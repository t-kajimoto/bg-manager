
-- New BGG Fields
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS designers text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS artists text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS publishers text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS mechanics text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS categories text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS average_rating double precision;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS complexity double precision;
