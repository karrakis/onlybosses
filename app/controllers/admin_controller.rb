require 'open3'

class AdminController < ApplicationController
  include ActionController::Live

  def index
    # Both /admin and /admin/synergy_chart render this same shell.
    # React owns the view state and uses pushState for the URL.
  end

  # GET /admin/analysis_stream — streams SSE events as each report section completes
  # Events:
  #   { type: "meta",    run_count:, snapshot_count: }
  #   { type: "section", title:, lines: [...] }
  #   { type: "done" }
  #   { type: "error",   message: }
  def analysis_stream
    min_depth   = (params[:depth]     || 1).to_i.clamp(1, 50)
    min_support = (params[:support]   || 15).to_i.clamp(1, 999)
    delta_thr   = (params[:threshold] || 0.15).to_f.clamp(0.0, 1.0)
    use_tree    = params[:tree] == '1'

    response.headers['Content-Type']      = 'text/event-stream'
    response.headers['Cache-Control']     = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Last-Modified']     = Time.current.httpdate

    sse = ->(payload) {
      response.stream.write("data: #{JSON.generate(payload)}\n\n")
    }

    script = Rails.root.join('analysis', 'analyze.py').to_s
    use_triples = params[:triples] == '1'

    args = ["python3", script,
              "--depth",     min_depth.to_s,
              "--support",   min_support.to_s,
              "--threshold", delta_thr.to_s,
              "--stream"]
    args << "--tree"    if use_tree
    args << "--triples" if use_triples

    sse.({ type: 'meta',
           run_count:      Run.count,
           snapshot_count: DepthSnapshot.count })

    Open3.popen3(*args) do |_stdin, stdout, stderr, wait_thr|
      current_title = nil
      current_lines = []
      all_sections  = []

      stdout.each_line do |raw|
        line = raw.chomp
        if line.start_with?('SECTION_START:')
          current_title = line[14..]
          current_lines = []
        elsif line == 'SECTION_END'
          if current_title
            sse.({ type: 'section', title: current_title, lines: current_lines })
            all_sections << { title: current_title, lines: current_lines }
          end
          current_title = nil
          current_lines = []
        else
          current_lines << line
        end
      end

      # Flush any trailing section not followed by SECTION_END
      if current_title
        sse.({ type: 'section', title: current_title, lines: current_lines })
        all_sections << { title: current_title, lines: current_lines }
      end

      if wait_thr.value.success?
        # Persist the completed report so it survives page reloads
        run_count_val      = Run.count
        snapshot_count_val = DepthSnapshot.count
        AnalysisReport.create!(
          params:         {
            min_depth:       min_depth,
            min_support:     min_support,
            delta_threshold: delta_thr,
            tree:            use_tree,
            triples:         use_triples,
          },
          run_count:      run_count_val,
          snapshot_count: snapshot_count_val,
          sections:       all_sections,
        )
        sse.({ type: 'done', run_count: run_count_val, snapshot_count: snapshot_count_val })
      else
        err = stderr.read.presence || "Analysis script failed"
        sse.({ type: 'error', message: err })
      end
    end
  rescue IOError, ActionController::Live::ClientDisconnected
    # client navigated away
  ensure
    response.stream.close
  end

  # GET /admin/latest_analysis — returns the most recently saved AnalysisReport
  def latest_analysis
    report = AnalysisReport.order(created_at: :desc).first
    if report
      render json: {
        id:             report.id,
        saved_at:       report.created_at.iso8601,
        params:         report.params,
        run_count:      report.run_count,
        snapshot_count: report.snapshot_count,
        sections:       report.sections,
        error:          nil,
      }
    else
      render json: { id: nil }
    end
  end

  # DELETE /admin/analysis_report — deletes the most recently saved report
  def delete_analysis
    AnalysisReport.order(created_at: :desc).first&.destroy
    render json: { ok: true }
  end

  # GET /admin/analysis_data — kept for backwards compat / non-streaming fallback
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

  # GET /admin/keyword_data
  # Returns per-depth survival rate data for individual keywords.
  #
  # Params:
  #   keywords[]   — keyword name(s), max 8
  #   depth_min    — integer (default 1)
  #   depth_max    — integer (default 20)
  #   context      — "player" | "boss" (default "player")
  #   min_support  — minimum snapshot count per depth (default 3)
  #   date_from, date_to — optional YYYY-MM-DD strings
  def keyword_data
    depth_min   = (params[:depth_min]   || 1).to_i.clamp(1, 50)
    depth_max   = (params[:depth_max]   || 20).to_i.clamp(depth_min, 50)
    context     = params[:context].presence_in(%w[player boss]) || 'player'
    min_support = (params[:min_support] || 3).to_i.clamp(1, 9999)
    keywords    = Array(params[:keywords]).first(8)

    date_from = params[:date_from].present? ? (Date.parse(params[:date_from]) rescue nil) : nil
    date_to   = params[:date_to].present?   ? (Date.parse(params[:date_to])   rescue nil) : nil

    kw_col = context == 'player' ? 'keyword_ids' : 'boss_keyword_ids'
    conn   = ActiveRecord::Base.connection

    result = keywords.filter_map do |name|
      name = name.strip
      next nil if name.empty?

      kw = BossKeyword.find_by(name: name)
      unless kw
        next { keyword: name, data: [], error: "Unknown keyword: #{name}" }
      end

      data = per_depth_rate(conn, kw_col, kw.id, depth_min, depth_max, min_support,
                             date_from: date_from, date_to: date_to)
      { keyword: name, data: data }
    end

    render json: result
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

    # Optional date range (YYYY-MM-DD strings parsed safely; nil means no filter)
    date_from = params[:date_from].present? ? (Date.parse(params[:date_from]) rescue nil) : nil
    date_to   = params[:date_to].present?   ? (Date.parse(params[:date_to])   rescue nil) : nil

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

      data = per_depth_delta(conn, kw_col, kw_ids, depth_min, depth_max, min_support,
                             date_from: date_from, date_to: date_to)
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
  def per_depth_delta(conn, kw_col, kw_ids, depth_min, depth_max, min_support,
                      date_from: nil, date_to: nil)
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

    # Date clauses: date_from/date_to are Ruby Date objects, conn.quote handles escaping
    date_clauses = []
    date_clauses << "AND ds.created_at >= #{conn.quote(date_from.to_s)}" if date_from
    date_clauses << "AND ds.created_at <  #{conn.quote((date_to + 1).to_s)}" if date_to

    sql = <<~SQL
      SELECT #{select_parts.join(', ')}
      FROM   depth_snapshots ds
      JOIN   runs r ON r.id = ds.run_id
      WHERE  ds.depth BETWEEN #{depth_min} AND #{depth_max}
        AND  r.outcome = 'died'
        #{date_clauses.join("\n        ")}
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

  # ── Per-depth survival rate for a single keyword ─────────────────────────────
  #
  # Returns an array of:
  #   { depth:, rate:, support:, baseline: }
  # where `rate` is the survival rate when the keyword is present, and
  # `baseline` is the overall survival rate at that depth (no keyword filter).
  def per_depth_rate(conn, kw_col, kw_id, depth_min, depth_max, min_support,
                     date_from: nil, date_to: nil)
    kw_arr = "ARRAY[#{kw_id.to_i}]::integer[]"

    date_clauses = []
    date_clauses << "AND ds.created_at >= #{conn.quote(date_from.to_s)}" if date_from
    date_clauses << "AND ds.created_at <  #{conn.quote((date_to + 1).to_s)}" if date_to

    sql = <<~SQL
      SELECT ds.depth,
             AVG(CASE WHEN ds.reached_next THEN 1.0 ELSE 0.0 END) AS overall_rate,
             COUNT(*)  FILTER (WHERE ds.#{kw_col} @> #{kw_arr}) AS kw_support,
             AVG(CASE WHEN ds.reached_next THEN 1.0 ELSE 0.0 END)
               FILTER (WHERE ds.#{kw_col} @> #{kw_arr}) AS kw_rate
      FROM   depth_snapshots ds
      JOIN   runs r ON r.id = ds.run_id
      WHERE  ds.depth BETWEEN #{depth_min} AND #{depth_max}
        AND  r.outcome = 'died'
        #{date_clauses.join("\n        ")}
      GROUP  BY ds.depth
      ORDER  BY ds.depth
    SQL

    conn.execute(sql).filter_map do |row|
      support = row['kw_support'].to_i
      next if support < min_support

      rate     = row['kw_rate']&.to_f
      baseline = row['overall_rate']&.to_f
      next if rate.nil? || baseline.nil?

      {
        depth:    row['depth'].to_i,
        rate:     rate.round(4),
        support:  support,
        baseline: baseline.round(4),
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
