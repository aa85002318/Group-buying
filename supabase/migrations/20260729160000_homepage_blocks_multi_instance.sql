-- Allow multiple homepage_blocks instances of the same block_key (type).
-- Identity is id; block_key is the section template/type.

ALTER TABLE homepage_blocks DROP CONSTRAINT IF EXISTS homepage_blocks_block_key_key;

-- Some environments used a unique index instead of constraint
DROP INDEX IF EXISTS homepage_blocks_block_key_key;
DROP INDEX IF EXISTS idx_homepage_blocks_block_key_unique;

ALTER TABLE homepage_blocks
  ADD COLUMN IF NOT EXISTS instance_label TEXT;

CREATE INDEX IF NOT EXISTS idx_homepage_blocks_sort_order
  ON homepage_blocks(sort_order);

CREATE INDEX IF NOT EXISTS idx_homepage_blocks_block_key
  ON homepage_blocks(block_key);
