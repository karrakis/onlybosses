require "test_helper"

class BossKeywordTest < ActiveSupport::TestCase
  self.fixture_table_names = []

  test "requires a name" do
    keyword = BossKeyword.new(category: "creature", properties: {}, rarity: 1)

    assert_not keyword.valid?
    assert_includes keyword.errors[:name], "can't be blank"
  end

  test "requires a unique name" do
    existing = BossKeyword.create!(
      name: "kw_unique_source",
      category: "creature",
      properties: {},
      rarity: 1
    )
    duplicate = BossKeyword.new(
      name: existing.name,
      category: "creature",
      properties: {},
      rarity: 1
    )

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "destroying a keyword removes joins but preserves boss" do
    keyword = BossKeyword.create!(
      name: "kw_destroy_preserves_boss",
      category: "creature",
      properties: {},
      rarity: 1
    )

    boss = Boss.create!(
      name: "kw_destroy_test_boss",
      computed_stats: { "base_stats" => { "life" => 100, "stamina" => 100, "mana" => 100 } },
      image_generation_status: "pending"
    )

    BossKeywordAssociation.create!(boss: boss, boss_keyword: keyword, position: 0)

    assert_equal 1, BossKeywordAssociation.where(boss_id: boss.id, boss_keyword_id: keyword.id).count

    keyword.destroy!

    assert_not BossKeyword.exists?(keyword.id)
    assert Boss.exists?(boss.id)
    assert_equal 0, BossKeywordAssociation.where(boss_id: boss.id).count
  end

  test "recreated keyword with same name does not reattach to old boss" do
    keyword = BossKeyword.create!(
      name: "kw_recreate_same_name",
      category: "creature",
      properties: {},
      rarity: 1
    )

    boss = Boss.create!(
      name: "kw_recreate_test_boss",
      computed_stats: { "base_stats" => { "life" => 100, "stamina" => 100, "mana" => 100 } },
      image_generation_status: "pending"
    )

    BossKeywordAssociation.create!(boss: boss, boss_keyword: keyword, position: 0)
    original_keyword_id = keyword.id

    keyword.destroy!
    recreated = BossKeyword.create!(
      name: "kw_recreate_same_name",
      category: "creature",
      properties: {},
      rarity: 1
    )

    assert_not_equal original_keyword_id, recreated.id
    assert_equal 0, BossKeywordAssociation.where(boss_id: boss.id, boss_keyword_id: recreated.id).count
    assert_empty boss.reload.boss_keywords
  end
end
