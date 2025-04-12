-- Add player statistics fields to profiles
alter table public.profiles add column if not exists player_stats jsonb default '{
  "matches_played": 0,
  "matches_won": 0,
  "tournaments_played": 0,
  "tournaments_won": 0,
  "rating": 1000,
  "ranking": null
}'::jsonb;

-- Add player preferences
alter table public.profiles add column if not exists preferences jsonb default '{
  "notifications": {
    "email": true,
    "push": true,
    "tournament_updates": true,
    "match_reminders": true
  },
  "privacy": {
    "show_profile": true,
    "show_stats": true,
    "show_history": true
  },
  "display": {
    "theme": "light",
    "language": "en"
  }
}'::jsonb;

-- Add player details
alter table public.profiles add column if not exists player_details jsonb default '{
  "birthdate": null,
  "gender": null,
  "skill_level": "beginner",
  "preferred_play_times": [],
  "preferred_locations": [],
  "equipment": [],
  "achievements": []
}'::jsonb;

-- Add social links
alter table public.profiles add column if not exists social_links jsonb default '{
  "facebook": null,
  "twitter": null,
  "instagram": null,
  "website": null
}'::jsonb;

-- Create player history table
create table if not exists public.player_history (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references public.profiles(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  division_id uuid references public.divisions(id) on delete cascade,
  partner_id uuid references public.profiles(id),
  placement int,
  points_earned int,
  matches_played int,
  matches_won int,
  created_at timestamptz default now()
);

-- Add RLS policies for player history
alter table public.player_history enable row level security;

create policy "Players can view their own history"
  on public.player_history for select
  using (auth.uid() = player_id);

create policy "Players can view their partners' history"
  on public.player_history for select
  using (auth.uid() = partner_id);

-- Add indexes for performance
create index if not exists idx_player_history_player_id on public.player_history(player_id);
create index if not exists idx_player_history_tournament_id on public.player_history(tournament_id);
create index if not exists idx_profiles_player_stats on public.profiles using gin (player_stats);

-- Add function to update player stats
create or replace function update_player_stats()
returns trigger as $$
begin
  -- Update matches played and won
  update public.profiles
  set player_stats = jsonb_set(
    jsonb_set(
      player_stats,
      '{matches_played}',
      (coalesce((player_stats->>'matches_played')::int, 0) + 1)::text::jsonb
    ),
    '{matches_won}',
    (coalesce((player_stats->>'matches_won')::int, 0) + case when new.winner_team = 1 then 1 else 0 end)::text::jsonb
  )
  where id in (new.team1_player1, new.team1_player2);

  update public.profiles
  set player_stats = jsonb_set(
    jsonb_set(
      player_stats,
      '{matches_played}',
      (coalesce((player_stats->>'matches_played')::int, 0) + 1)::text::jsonb
    ),
    '{matches_won}',
    (coalesce((player_stats->>'matches_won')::int, 0) + case when new.winner_team = 2 then 1 else 0 end)::text::jsonb
  )
  where id in (new.team2_player1, new.team2_player2);

  return new;
end;
$$ language plpgsql;

-- Add trigger to update player stats when a match is completed
create trigger update_player_stats_on_match_complete
  after update of status on public.matches
  for each row
  when (old.status != 'completed' and new.status = 'completed')
  execute function update_player_stats(); 