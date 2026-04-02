require 'open3'

class AdminController < ApplicationController
  def index
    # Both /admin and /admin/synergy_chart render this same shell.
    # React owns the view state and uses pushState for the URL.
  end

  # GET /admin/analysis_data — runs Python analysis, returns JSON sections
  def analysis_data
    script      = Rails.root.join('analysis', 'analyze.py')
    min_depth   = (params[:depth]     || 1).to_i.clamp(1, 50)
    min_support = (params[:support]   || 15).to_i.clamp(1, 999)
    delta_thr   = (params[:threshold] || 0.15).to_f.clamp(0.0, 1.0)
    use_tree    = params[:tree] == '1'

    args = ["python3", script.to_s,
            "--depth",     min_depth.to_s,
            "--support",   min_support.to_s,
            "--threshold", delta_thr.to_s]
    args << "--tree" if use_tree

    stdout, stderr, status = Open3.capture3(*args)

    if status.success?
      sections = parse_sections(stdout)
      render json: {
        sections:       sections,
        error:          nil,
        run_count:      Run.count,
        snapshot_count: DepthSnapshot.count
      }
    else
      render json: {
        sections:       [],
        error:          stderr.presence || "Analysis script exited with status #{status.exitstatus}",
        run_count:      Run.count,
        snapshot_count: DepthSnapshot.count
      }
    end
  end

  # GET /admin/combo_data
  # Returns per-depth conditional delta data for each requested combo.
  #
  # Params:
  #   combos[]     — comma-separated keyword names, repeated for each combo
  #   depth_min    — integer (default 1)
  #   depth_max    — integer (default 20)
  #   context      — "player" | "boss" (default "player")
  #   min_support  — minimum snapshot count per depth (default 3)
  def combo_data
    depth_min   = (params[:depth_min]   || 1).to_i.clamp(1, 50)
    depth_max   = (params[:depth_max]   || 20).to_i.clamp(depth_min, 50)
    context     = params[:context].presence_in(%w[player boss]) || 'player'
    min_support = (params[:min_support] || 3).to_i.clamp(1, 9999)
    combos      = Array(params[:combos]).first(8)

    kw_col = context == 'player' ? 'keyword_ids' : 'boss_keyword_ids'
    conn   = ActiveRecord::Base.connection

    result = combos.filter_map do |combo_str|
      names = combo_str.split(',').map(&:strip).reject(&:empty?)
      next nil if names.empty?

      # Resolve keyword names → IDs
      id_rows = BossKeyword.where(name: names).pluck(:id, :name)
      id_map  = id_rows.to_h { |id, name| [name, id] }
      kw_ids  = names.map { |n| id_map[n] }.compact

      if kw_ids.length != names.length
        missing = names.reject { |n| id_map.key?(n) }
        next { combo: names.join(' + '), data: [], error: "Unknown keyword(s): #{missing.join(', ')}" }
      end

      data = per_depth_delta(conn, kw_col, kw_ids, depth_min, depth_max, min_support)
      { combo: names.join(' + '), data: data }
    end

    render json: result
  end

  private

  # ── Single-query per-depth conditional delta ─────────────────────────────────
  #
  # For each depth in [depth_min, depth_max] runs one SQL query using conditional
  # aggregation.  Returns an array of hashes:
  #   { depth:, delta:, support:, combo_rate:, baseline: }
  #
  # kw_ids are already-validated integer IDs — no injection risk.
  def per_depth_delta(conn, kw_col, kw_ids, depth_min, depth_max, min_support)
    n          = kw_ids.length
    combo_arr  = "ARRAY[#{kw_ids.join(',')}]::integer[]"

    select_parts = [
      "ds.depth",
      "COUNT(*) FILTER (WHERE ds.#{kw_col} @> #{combo_arr}) AS combo_support",
      "AVG(CASE WHEN ds.reached_next THEN 1.0 ELSE 0.0 END) " \
        "FILTER (WHERE ds.#{kw_col} @> #{combo_arr}) AS combo_rate",
    ]

    kw_ids.each_with_index do |id, i|
      indiv_arr = "ARRAY[#{id}]::integer[]"
      select_parts << "AVG(CASE WHEN ds.reached_next THEN 1.0 ELSE 0.0 END) " \
                        "FILTER (WHERE ds.#{kw_col} @> #{indiv_arr}) AS rate_#{i}"
    end

    sql = <<~SQL
      SELECT #{select_parts.join(', ')}
      FROM   depth_snapshots ds
      JOIN   runs r ON r.id = ds.run_id
      WHERE  ds.depth BETWEEN #{depth_min} AND #{depth_max}
        AND  r.outcome = 'died'
      GROUP  BY ds.depth
      ORDER  BY ds.depth
    SQL

    conn.execute(sql).filter_map do |row|
      support = row['combo_support'].to_i
      next if support < min_support

      combo_rate = row['combo_rate']&.to_f
      next if combo_rate.nil?

      indiv_rates = n.times.map { |i| row["rate_#{i}"]&.to_f }.compact
      next if indiv_rates.length != n

      baseline = indiv_rates.sum / n
      delta    = (combo_rate - baseline).round(4)

      {
        depth:      row['depth'].to_i,
        delta:      delta,
        support:    support,
        combo_rate: combo_rate.round(4),
        baseline:   baseline.round(4),
      }
    end
  end

  # Split the script's stdout into titled sections on the ─── marker lines.
  def parse_sections(output)
    sections = []
    current  = nil

    output.each_line do |line|
      line = line.chomp
      if line =~ /\A─{3}\s+(.+?)\s+─+\z/
        sections << current if current
        current = { title: $1, lines: [] }
      elsif current
        current[:lines] << line
      end
    end

    sections << current if current
    sections
  end
end
