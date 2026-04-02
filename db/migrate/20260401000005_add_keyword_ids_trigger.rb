class AddKeywordIdsTrigger < ActiveRecord::Migration[7.0]
  def up
    execute <<~SQL
      CREATE OR REPLACE FUNCTION check_keyword_ids_exist()
      RETURNS trigger AS $$
      DECLARE
        kw_id integer;
      BEGIN
        IF NEW.keyword_ids IS NOT NULL THEN
          FOREACH kw_id IN ARRAY NEW.keyword_ids LOOP
            IF NOT EXISTS (SELECT 1 FROM boss_keywords WHERE id = kw_id) THEN
              RAISE EXCEPTION 'keyword_id % does not exist in boss_keywords', kw_id;
            END IF;
          END LOOP;
        END IF;

        IF NEW.boss_keyword_ids IS NOT NULL THEN
          FOREACH kw_id IN ARRAY NEW.boss_keyword_ids LOOP
            IF NOT EXISTS (SELECT 1 FROM boss_keywords WHERE id = kw_id) THEN
              RAISE EXCEPTION 'boss_keyword_id % does not exist in boss_keywords', kw_id;
            END IF;
          END LOOP;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER enforce_keyword_ids_fk
        BEFORE INSERT OR UPDATE ON depth_snapshots
        FOR EACH ROW EXECUTE FUNCTION check_keyword_ids_exist();
    SQL
  end

  def down
    execute <<~SQL
      DROP TRIGGER IF EXISTS enforce_keyword_ids_fk ON depth_snapshots;
      DROP FUNCTION IF EXISTS check_keyword_ids_exist();
    SQL
  end
end
