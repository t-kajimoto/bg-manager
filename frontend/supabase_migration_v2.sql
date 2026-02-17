-- 1. Create owned_games table
CREATE TABLE IF NOT EXISTS owned_games (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  board_game_id uuid REFERENCES board_games(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, board_game_id)
);

-- Enable RLS for owned_games
ALTER TABLE owned_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owned games are viewable by everyone"
  ON owned_games FOR SELECT
  USING ( true );

CREATE POLICY "Users can manage their own owned games"
  ON owned_games FOR ALL
  USING ( auth.uid() = user_id );

-- 2. Update matches table (add image_url)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Update match_players table
-- Change is_winner to rank (int)
-- Change score to text
ALTER TABLE match_players ADD COLUMN IF NOT EXISTS rank int;
ALTER TABLE match_players ALTER COLUMN score TYPE text USING score::text;
-- We keep is_winner for a while or drop it later, but let's encourage rank usage.

-- 4. Storage Bucket Setup (Note: Bucket creation usually requires Console or Admin API)
-- This SQL is for RLS on the storage schema if needed, but standard bucket setup is recommended via UI.
-- However, we can try to insert into storage.buckets if the user has permissions.

-- 5. Update RLS for matches to allow participants to see their matches
-- Currently "Matches are viewable by everyone" is set, so participant viewing is already covered.
-- If we want to restrict it later, we would use a more complex policy.
