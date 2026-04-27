require "test_helper"

class BossTest < ActiveSupport::TestCase
  self.fixture_table_names = []

  test "destroying a boss removes joins but preserves keywords" do
    keyword = BossKeyword.create!(
      name: "boss_destroy_preserves_keyword",
      category: "creature",
      properties: {},
      rarity: 1
    )

    boss = Boss.create!(
      name: "boss_destroy_test",
      computed_stats: { "base_stats" => { "life" => 100, "stamina" => 100, "mana" => 100 } },
      image_generation_status: "pending"
    )

    BossKeywordAssociation.create!(boss: boss, boss_keyword: keyword, position: 0)

    assert_equal 1, BossKeywordAssociation.where(boss_id: boss.id, boss_keyword_id: keyword.id).count

    boss.destroy!

    assert_not Boss.exists?(boss.id)
    assert BossKeyword.exists?(keyword.id)
    assert_equal 0, BossKeywordAssociation.where(boss_id: boss.id, boss_keyword_id: keyword.id).count
  end
end
