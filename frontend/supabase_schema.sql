-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security!
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Configures a trigger to create a profile entry when a new user signs up via Supabase Auth
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Alter board_games table
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS bgg_id text UNIQUE;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS min_playtime int;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS max_playtime int;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS year_published int;

-- New BGG Fields
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS designers text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS artists text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS publishers text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS mechanics text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS categories text[];
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS average_rating double precision;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS complexity double precision;

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  board_game_id uuid REFERENCES board_games(id) ON DELETE CASCADE NOT NULL,
  date timestamp with time zone DEFAULT now() NOT NULL,
  location text,
  note text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone"
  ON matches FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can insert matches"
  ON matches FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own matches"
  ON matches FOR UPDATE
  USING ( auth.uid() = created_by );

CREATE POLICY "Users can delete their own matches"
  ON matches FOR DELETE
  USING ( auth.uid() = created_by );

-- Create match_players table
CREATE TABLE IF NOT EXISTS match_players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  player_name text NOT NULL,
  score double precision,
  is_winner boolean DEFAULT false,
  role text
);

-- Enable RLS for match_players
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match players are viewable by everyone"
  ON match_players FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can insert match players"
  ON match_players FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "Users can update match players for their matches"
  ON match_players FOR UPDATE
  USING ( EXISTS (
    SELECT 1 FROM matches WHERE id = match_players.match_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can delete match players for their matches"
  ON match_players FOR DELETE
  USING ( EXISTS (
    SELECT 1 FROM matches WHERE id = match_players.match_id AND created_by = auth.uid()
  ));

-- Update profiles table for My Page and Username system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discriminator text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_discriminator_key UNIQUE (display_name, discriminator);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS for friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received friendship requests"
  ON friendships FOR UPDATE
  USING (auth.uid() = receiver_id);
