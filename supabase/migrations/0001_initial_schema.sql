-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create custom types
create type user_role as enum ('admin', 'organizer', 'player', 'scorekeeper');
create type tournament_status as enum ('draft', 'registration', 'in_progress', 'completed', 'cancelled');
create type match_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');
create type division_type as enum ('skill', 'age', 'gender');

-- Create users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,
  role user_role default 'player',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create tournaments table
create table public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  registration_deadline timestamptz,
  venue text,
  status tournament_status default 'draft',
  organizer_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create divisions table
create table public.divisions (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  name text not null,
  type division_type not null,
  min_age int,
  max_age int,
  skill_level text,
  gender text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create teams table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments not null,
  name text not null,
  captain_id uuid references public.profiles not null,
  members jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_team_name_per_tournament unique (tournament_id, name)
);

-- Create registrations table
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments not null,
  division_id uuid references public.divisions not null,
  player_id uuid references public.profiles not null,
  partner_id uuid references public.profiles null,
  status text check (status in ('PENDING', 'APPROVED', 'REJECTED', 'WAITLIST', 'CHECKED_IN', 'WITHDRAWN')) not null default 'PENDING',
  metadata jsonb,
  notes text,
  priority int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create matches table
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments not null,
  division_id uuid references public.divisions null,
  round_number int not null,
  match_number int not null,
  player1_id uuid references public.profiles null,
  player2_id uuid references public.profiles null,
  team1_id uuid references public.teams null,
  team2_id uuid references public.teams null,
  status text check (status in ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) not null default 'SCHEDULED',
  scores jsonb,
  winner_id uuid references public.profiles null,
  winner_team_id uuid references public.teams null,
  scheduled_time timestamp with time zone,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  court_id uuid references public.courts(id),
  notes text,
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create courts table
create table public.courts (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments not null,
  name text not null,
  status text check (status in ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE')) not null default 'AVAILABLE',
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_court_name_per_tournament unique (tournament_id, name)
);

-- Create notifications table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Tournament Messages Table (NEW)
create table if not exists public.tournament_messages (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments not null,
  sender_id uuid references public.profiles not null, -- Could be player or organizer
  content text not null check (length(content) > 0 and length(content) <= 500), -- Basic validation
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.divisions enable row level security;
alter table public.teams enable row level security;
alter table public.courts enable row level security;
alter table public.registrations enable row level security;
alter table public.matches enable row level security;
alter table public.notifications enable row level security;
alter table public.tournament_messages enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Tournament policies
create policy "Tournaments are viewable by everyone"
  on public.tournaments for select
  using (true);

create policy "Organizers can create tournaments"
  on public.tournaments for insert
  with check (auth.uid() = organizer_id);

create policy "Organizers can update own tournaments"
  on public.tournaments for update
  using (auth.uid() = organizer_id);

-- Team policies
create policy "Teams are viewable by everyone for their tournament" 
  on public.teams for select
  using (true);

create policy "Authenticated users can create teams"
  on public.teams for insert
  with check (auth.role() = 'authenticated');

create policy "Team captains or organizers can update their teams" 
  on public.teams for update
  using (captain_id = auth.uid() or exists (
    select 1 from public.tournaments t where t.id = teams.tournament_id and t.organizer_id = auth.uid()
  ));

create policy "Team captains or organizers can delete their teams" 
  on public.teams for delete
  using (captain_id = auth.uid() or exists (
    select 1 from public.tournaments t where t.id = teams.tournament_id and t.organizer_id = auth.uid()
  ));

-- Trigger for updating timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function update_updated_at_column();

create trigger update_tournaments_updated_at
  before update on public.tournaments
  for each row
  execute function update_updated_at_column();

create trigger update_teams_updated_at
  before update on public.teams
  for each row
  execute function update_updated_at_column();

-- Create indexes
create index idx_tournaments_status on public.tournaments(status);
create index idx_matches_tournament_id on public.matches(tournament_id);
create index idx_registrations_tournament_id on public.registrations(tournament_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_courts_tournament_id on public.courts(tournament_id);
create index idx_matches_court_id on public.matches(court_id);
create index idx_teams_tournament_id on public.teams(tournament_id);
create index idx_matches_team1_id on public.matches(team1_id);
create index idx_matches_team2_id on public.matches(team2_id);

-- Create functions for real-time features
create or replace function notify_match_update()
returns trigger as $$
begin
  perform pg_notify(
    'match_updates',
    json_build_object(
      'match_id', new.id,
      'tournament_id', new.tournament_id,
      'status', new.status,
      'scores', new.scores
    )::text
  );
  return new;
end;
$$ language plpgsql;

create trigger notify_match_changes
  after update on public.matches
  for each row
  execute function notify_match_update();

-- Add foreign key constraint from matches to courts
alter table public.matches
add constraint fk_matches_court_id foreign key (court_id) references public.courts(id);

-- Court Policies
create policy "Courts are viewable by everyone for their tournament" 
  on public.courts for select
  using (true);

create policy "Organizers can manage courts for their tournaments" 
  on public.courts for insert
  with check (exists (
    select 1 from public.tournaments
    where id = courts.tournament_id and organizer_id = auth.uid()
  ));

create policy "Organizers can update courts for their tournaments" 
  on public.courts for update
  using (exists (
    select 1 from public.tournaments
    where id = courts.tournament_id and organizer_id = auth.uid()
  ));

create policy "Organizers can delete courts for their tournaments" 
  on public.courts for delete
  using (exists (
    select 1 from public.tournaments
    where id = courts.tournament_id and organizer_id = auth.uid()
  ));

-- Trigger for courts table
create trigger update_courts_updated_at
  before update on public.courts
  for each row
  execute function update_updated_at_column();

-- Create function to notify court status changes
create or replace function notify_court_status_update()
returns trigger as $$
declare
  payload json;
begin
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP, 
    'data', row_to_json(new)
  );
  perform pg_notify('court_updates', payload::text);
  return new;
end;
$$ language plpgsql;

-- Trigger for court status updates (on INSERT or UPDATE)
create trigger court_status_change_trigger
  after insert or update of status on public.courts
  for each row
  execute function notify_court_status_update();

-- Function to update player stats after a match is completed and verified
create or replace function public.update_player_stats_after_match()
returns trigger as $$
declare
  player1_id_val uuid;
  player2_id_val uuid;
  winner_id_val uuid;
  loser_id_val uuid;
  -- TODO: Add team logic if needed
begin
  -- Only run if status is COMPLETED and verified is true (or just became true)
  if new.status = 'COMPLETED' and new.verified = true then

    -- Determine player IDs involved (simplified for singles for now)
    player1_id_val := new.player1_id;
    player2_id_val := new.player2_id;
    winner_id_val := new.winner_id;

    -- Check if it was a singles match with a winner
    if player1_id_val is not null and player2_id_val is not null and winner_id_val is not null then 
        if winner_id_val = player1_id_val then
          loser_id_val := player2_id_val;
        else
          loser_id_val := player1_id_val;
        end if;

        -- Update Winner's Stats
        update public.profiles
        set player_stats = jsonb_set(
            coalesce(player_stats, '{}')::jsonb, 
            '{matches_played}', 
            (coalesce((player_stats->>'matches_played')::int, 0) + 1)::text::jsonb
          )
        where id = winner_id_val;
        
        update public.profiles
        set player_stats = jsonb_set(
            coalesce(player_stats, '{}')::jsonb, 
            '{matches_won}', 
            (coalesce((player_stats->>'matches_won')::int, 0) + 1)::text::jsonb
          )
         where id = winner_id_val;
         
         -- TODO: Add rating update logic here for winner

        -- Update Loser's Stats
        update public.profiles
        set player_stats = jsonb_set(
            coalesce(player_stats, '{}')::jsonb, 
            '{matches_played}', 
            (coalesce((player_stats->>'matches_played')::int, 0) + 1)::text::jsonb
          )
        where id = loser_id_val;
        
        -- TODO: Add rating update logic here for loser

        -- TODO: Add logic to update tournament played/won counts (maybe harder here?)

    end if;
    -- TODO: Add handling for Team matches (team1_id, team2_id, winner_team_id)
    -- This would involve fetching team members and updating each player's stats.
  end if;
  
  return new;
end;
$$ language plpgsql security definer; -- Use security definer if needed to bypass RLS for updates

-- Trigger to update stats after match completion/verification
create trigger handle_match_completion_stats
  after update on public.matches
  for each row
  when (old.status is distinct from new.status or old.verified is distinct from new.verified) -- Only run if status or verified changed
  execute function public.update_player_stats_after_match();

-- Tournament Message Policies (NEW)
create policy "Users can view messages for tournaments they are part of" 
  on public.tournament_messages for select
  using (exists (
    -- Check if user is organizer OR registered player/team member (more complex check needed for teams)
    select 1 from public.tournaments t where t.id = tournament_messages.tournament_id and t.organizer_id = auth.uid()
    union
    select 1 from public.registrations r where r.tournament_id = tournament_messages.tournament_id and r.player_id = auth.uid() -- Simplified check
    -- TODO: Add check for team membership if teams are implemented
  ));

create policy "Authenticated users can send messages in tournaments they are part of" 
  on public.tournament_messages for insert
  with check (sender_id = auth.uid() and exists (
     -- Check if user is organizer OR registered player/team member
    select 1 from public.tournaments t where t.id = tournament_messages.tournament_id and t.organizer_id = auth.uid()
    union
    select 1 from public.registrations r where r.tournament_id = tournament_messages.tournament_id and r.player_id = auth.uid()
     -- TODO: Add check for team membership if teams are implemented
  ));

-- Trigger for new messages (for realtime)
create or replace function notify_new_tournament_message()
returns trigger as $$
declare
  payload json;
begin
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP, 
    'data', row_to_json(new)
  );
  -- Notify on a channel specific to the tournament
  perform pg_notify(concat('tournament_chat_', new.tournament_id), payload::text);
  return new;
end;
$$ language plpgsql;

create trigger handle_new_message
  after insert on public.tournament_messages
  for each row
  execute function public.notify_new_tournament_message();

-- Indexes
create index idx_tournament_messages_tournament_id_created_at on public.tournament_messages(tournament_id, created_at desc);