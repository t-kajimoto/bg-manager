-- Board Games Table
create table board_games (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  min_players integer not null,
  max_players integer not null,
  play_time_minutes integer not null,
  tags text[] default '{}',
  owner_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security for board_games
alter table board_games enable row level security;

-- Everyone can view board games
create policy "Board games are viewable by everyone"
  on board_games for select
  using ( true );

-- Authenticated users can create board games
create policy "Authenticated users can create board games"
  on board_games for insert
  with check ( auth.role() = 'authenticated' );

-- User Board Game Status (Intermediate table)
create table user_board_game_states (
  user_id uuid references auth.users not null,
  board_game_id uuid references board_games not null,
  played boolean default false,
  evaluation integer check (evaluation >= 0 and evaluation <= 5), -- 0 or null could mean unrated, but let's allow 0 if needed, or just nullable
  comment text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, board_game_id)
);

-- RLS for user state
alter table user_board_game_states enable row level security;

create policy "Users can view all states"
  on user_board_game_states for select
  using ( true );

create policy "Users can insert/update their own state"
  on user_board_game_states for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );
