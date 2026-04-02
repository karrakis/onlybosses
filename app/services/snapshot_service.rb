class SnapshotService
  # Properties whose values (or sub-values) should be summed rather than multiplied
  ADDITIVE_PROPERTY_KEYS = %w[lifesteal base_damage_by_type].freeze

  # Non-numeric/structural properties to skip entirely
  SKIP_PROPERTY_KEYS = %w[passives abilities applies_to life_resource].freeze

  # Create or retrieve the Run record for this session.
  def self.ensure_run(session)
    run_id = session[:run_id]
    return Run.find_by(id: run_id) if run_id

    session[:anonymous_id] ||= SecureRandom.uuid
    run = Run.create!(session_id: session[:anonymous_id], started_at: Time.current)
    session[:run_id] = run.id
    run
  end

  # Write a depth snapshot capturing the player's state as they descend into `depth`.
  # depth must be >= 1. Called after keyword selection, before the next boss fight.
  def self.record_snapshot(session, player, boss, depth)
    return if depth.to_i < 1

    run = ensure_run(session)
    return unless run

    ActiveRecord::Base.transaction do
      # Retroactively mark the previous depth as survived
      run.depth_snapshots.find_by(depth: depth.to_i - 1)&.update!(reached_next: true)

      player_kw_names = player['keywords'] || []
      boss_kw_names   = (boss || {})['keywords'] || []

      player_kw_ids = player_kw_names.any? ? BossKeyword.where(name: player_kw_names).pluck(:id) : []
      boss_kw_ids   = boss_kw_names.any?   ? BossKeyword.where(name: boss_kw_names).pluck(:id)   : []

      snapshot = run.depth_snapshots.create!(
        depth:            depth.to_i,
        reached_next:     false,
        keyword_ids:      player_kw_ids,
        boss_keyword_ids: boss_kw_ids
      )

      write_modifiers(snapshot, compute_modifiers(player_kw_names), 'player')
      write_modifiers(snapshot, compute_modifiers(boss_kw_names),   'boss')

      snapshot
    end
  end

  # Close the current run with the given outcome ('died' or 'quit').
  def self.close_run(session, outcome)
    run_id = session[:run_id]
    return unless run_id

    run = Run.find_by(id: run_id)
    if run
      final_depth = run.depth_snapshots.maximum(:depth)
      run.update!(ended_at: Time.current, final_depth: final_depth, outcome: outcome)
    end

    session[:run_id] = nil
  end

  # ── private ────────────────────────────────────────────────────────────────

  # Walk each keyword's properties and produce a flat key → aggregated-value map.
  def self.compute_modifiers(keyword_names)
    result = {}
    return result if keyword_names.empty?

    keyword_names.each do |name|
      kw = BossKeyword.find_by(name: name)
      next unless kw

      (kw.properties || {}).each do |prop_key, prop_val|
        next if SKIP_PROPERTY_KEYS.include?(prop_key)

        if prop_val.is_a?(Hash)
          prop_val.each do |sub_key, sub_val|
            next unless sub_val.is_a?(Numeric)
            accumulate(result, "#{prop_key}.#{sub_key}", sub_val, prop_key)
          end
        elsif prop_val.is_a?(Numeric)
          accumulate(result, prop_key, prop_val, prop_key)
        end
      end
    end

    result
  end
  private_class_method :compute_modifiers

  # Aggregate a value into result under flat_key using the correct strategy
  # (additive for lifesteal/base_damage_by_type, multiplicative for everything else).
  def self.accumulate(result, flat_key, value, top_key)
    if ADDITIVE_PROPERTY_KEYS.include?(top_key)
      result[flat_key] = (result[flat_key] || 0.0) + value
    else
      result[flat_key] = (result[flat_key] || 1.0) * value
    end
  end
  private_class_method :accumulate

  # Persist modifier rows, auto-registering any new modifier keys.
  def self.write_modifiers(snapshot, modifiers, context)
    modifiers.each do |key, value|
      mk = ModifierKey.find_or_create_by!(key: key)
      SnapshotModifier.create!(
        depth_snapshot: snapshot,
        modifier_key:   mk,
        value:          value,
        context:        context
      )
    end
  end
  private_class_method :write_modifiers
end
