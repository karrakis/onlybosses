require "test_helper"

class BossConstructionParityTest < ActiveSupport::TestCase
  self.fixture_table_names = []

  test "simulator and live boss construction match combat projection" do
    keyword_sets = [
      create_case_keywords("alpha", with_stacked_passive: true),
      create_case_keywords("beta", with_stacked_passive: false)
    ]

    keyword_sets.each do |base_names|
      registry = BossKeyword.where(name: all_related_names(base_names)).index_by(&:name)

      sim_expanded = RunSimulatorService.send(:expand_keywords, base_names, registry)
      sim_entity = RunSimulatorService.send(:build_boss_entity, sim_expanded, registry)

      boss = BossFactory.find_or_create(base_names)
      live_primary = boss.boss_keywords.order("boss_keyword_associations.position").pluck(:name)
      live_expanded = expand_like_live_game(live_primary)

      live_projection = project_live_boss(boss, live_expanded)
      sim_projection = project_sim_boss(sim_entity, sim_expanded)

      assert_equal sim_projection, live_projection, parity_failure_message(base_names, sim_projection, live_projection)
    end
  end

  private

  def create_case_keywords(prefix, with_stacked_passive:)
    passive_name = "test_#{prefix}_passive"
    creature_name = "test_#{prefix}_creature"
    characteristic_name = "test_#{prefix}_characteristic"

    BossKeyword.create!(
      name: passive_name,
      category: "passive",
      rarity: 1,
      properties: {
        "multipliers" => { "life" => 1.1, "stamina" => 0.95, "life_regen" => 1.2 }
      }
    )

    creature_passives = [passive_name]
    characteristic_passives = with_stacked_passive ? [passive_name] : []

    BossKeyword.create!(
      name: creature_name,
      category: "creature",
      rarity: 1,
      properties: {
        "max_hands" => 2,
        "passives" => creature_passives,
        "multipliers" => { "life" => 1.25, "stamina" => 0.9, "mana" => 1.15 }
      }
    )

    BossKeyword.create!(
      name: characteristic_name,
      category: "characteristic",
      rarity: 1,
      properties: {
        "passives" => characteristic_passives,
        "multipliers" => { "life" => 0.95, "stamina" => 1.2, "mana" => 0.9 }
      }
    )

    [creature_name, characteristic_name]
  end

  def all_related_names(base_names)
    related = base_names.dup
    base_names.each do |name|
      kw = BossKeyword.find_by(name: name)
      related.concat(kw&.properties&.dig("passives") || [])
    end
    related.uniq
  end

  def expand_like_live_game(primary_names)
    expanded = primary_names.dup
    primary_names.each do |kw_name|
      kw = BossKeyword.find_by(name: kw_name)
      (kw&.properties&.dig("passives") || []).each { |passive| expanded << passive }
    end
    expanded
  end

  def project_sim_boss(sim_entity, expanded_keywords)
    {
      keyword_counts: expanded_keywords.tally,
      max_life: sim_entity["max_life"],
      max_stamina: sim_entity["max_stamina"],
      max_mana: sim_entity["max_mana"],
      life: sim_entity["life"],
      stamina: sim_entity["stamina"],
      mana: sim_entity["mana"],
      life_regen_multiplier: sim_entity["life_regen_multiplier"].to_f.round(6)
    }
  end

  def project_live_boss(boss, expanded_keywords)
    stats = boss.computed_stats || {}
    base = stats["base_stats"] || {}

    {
      keyword_counts: expanded_keywords.tally,
      max_life: base["life"],
      max_stamina: base["stamina"],
      max_mana: base["mana"],
      life: base["life"],
      stamina: base["stamina"],
      mana: base["mana"],
      life_regen_multiplier: (stats["life_regen_multiplier"] || 1.0).to_f.round(6)
    }
  end

  def parity_failure_message(base_names, sim_projection, live_projection)
    <<~MSG
      Combat projection mismatch for keyword set: #{base_names.inspect}
      simulator: #{sim_projection.inspect}
      live:      #{live_projection.inspect}
    MSG
  end
end