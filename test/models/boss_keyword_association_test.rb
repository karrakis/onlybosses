require "test_helper"

class BossKeywordAssociationTest < ActiveSupport::TestCase
  self.fixture_table_names = []

  test "is valid with boss and keyword" do
    boss = Boss.create!(
      name: "assoc_valid_boss",
      computed_stats: { "base_stats" => { "life" => 100, "stamina" => 100, "mana" => 100 } },
      image_generation_status: "pending"
    )
    keyword = BossKeyword.create!(
      name: "assoc_valid_keyword",
      category: "creature",
      properties: {},
      rarity: 1
    )

    association = BossKeywordAssociation.new(boss: boss, boss_keyword: keyword, position: 0)

    assert association.valid?
  end

  test "requires a boss" do
    keyword = BossKeyword.create!(
      name: "assoc_requires_boss_keyword",
      category: "creature",
      properties: {},
      rarity: 1
    )

    association = BossKeywordAssociation.new(boss_keyword: keyword, position: 0)

    assert_not association.valid?
    assert_includes association.errors[:boss], "must exist"
  end

  test "requires a boss keyword" do
    boss = Boss.create!(
      name: "assoc_requires_keyword_boss",
      computed_stats: { "base_stats" => { "life" => 100, "stamina" => 100, "mana" => 100 } },
      image_generation_status: "pending"
    )

    association = BossKeywordAssociation.new(boss: boss, position: 0)

    assert_not association.valid?
    assert_includes association.errors[:boss_keyword], "must exist"
  end
end
