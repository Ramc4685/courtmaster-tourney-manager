-- CourtMaster Tournament Manager Schema
-- Description: Complete database schema for the tournament management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS public.tournament_messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.player_history CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.courts CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.divisions CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS tournament_status CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS division_type CASCADE;
DROP TYPE IF EXISTS tournament_stage CASCADE;
DROP TYPE IF EXISTS court_status CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'player', 'scorekeeper');
CREATE TYPE tournament_status AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled');
CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE division_type AS ENUM ('skill', 'age', 'gender');
CREATE TYPE tournament_stage AS ENUM (
  'GROUP_STAGE',
  'DIVISION_PLACEMENT',
  'PLAYOFF_KNOCKOUT',
  'INITIAL_ROUND',
  'ELIMINATION_ROUND',
  'FINALS',
  'REGISTRATION',
  'SEEDING'
);
CREATE TYPE court_status AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  role user_role DEFAULT 'player',
  player_stats JSONB DEFAULT '{
    "matches_played": 0,
    "matches_won": 0,
    "tournaments_played": 0,
    "tournaments_won": 0,
    "rating": 1000,
    "ranking": null
  }'::JSONB,
  preferences JSONB DEFAULT '{
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
  }'::JSONB,
  player_details JSONB DEFAULT '{
    "birthdate": null,
    "gender": null,
    "skill_level": "beginner",
    "preferred_play_times": [],
    "preferred_locations": [],
    "equipment": [],
    "achievements": []
  }'::JSONB,
  social_links JSONB DEFAULT '{
    "facebook": null,
    "twitter": null,
    "instagram": null,
    "website": null
  }'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline TIMESTAMPTZ,
  venue TEXT,
  status tournament_status DEFAULT 'draft',
  current_stage tournament_stage NOT NULL DEFAULT 'REGISTRATION',
  organizer_id UUID REFERENCES public.profiles(id),
  format TEXT NOT NULL,
  format_config JSONB DEFAULT '{}',
  registration_enabled BOOLEAN DEFAULT true,
  require_player_profile BOOLEAN DEFAULT false,
  max_teams INTEGER,
  registration_config JSONB DEFAULT '{
    "max_entries_per_category": false,
    "allow_waitlist": true,
    "fee_amount": null,
    "waiver_required": false
  }',
  scoring_config JSONB DEFAULT '{}',
  categories JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  schedule_config JSONB DEFAULT '{}',
  statistics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create divisions table
CREATE TABLE public.divisions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type division_type NOT NULL,
  min_age INTEGER,
  max_age INTEGER,
  skill_level TEXT,
  gender TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  captain_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_team_name_per_tournament UNIQUE (tournament_id, name)
);

-- Create team members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_per_team UNIQUE (team_id, user_id)
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id),
  division_id UUID NOT NULL REFERENCES public.divisions(id),
  player_id UUID NOT NULL REFERENCES public.profiles(id),
  partner_id UUID REFERENCES public.profiles(id),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WAITLIST', 'CHECKED_IN', 'WITHDRAWN')) NOT NULL DEFAULT 'PENDING',
  metadata JSONB,
  notes TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create courts table
CREATE TABLE public.courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id),
  name TEXT NOT NULL,
  status court_status NOT NULL DEFAULT 'AVAILABLE',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_court_name_per_tournament UNIQUE (tournament_id, name)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id),
  division_id UUID REFERENCES public.divisions(id),
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES public.profiles(id),
  player2_id UUID REFERENCES public.profiles(id),
  team1_id UUID REFERENCES public.teams(id),
  team2_id UUID REFERENCES public.teams(id),
  status match_status NOT NULL DEFAULT 'scheduled',
  scores JSONB,
  winner_id UUID REFERENCES public.profiles(id),
  winner_team_id UUID REFERENCES public.teams(id),
  scheduled_time TIMESTAMPTZ,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  court_id UUID REFERENCES public.courts(id),
  notes TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create player history table
CREATE TABLE public.player_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.profiles(id),
  placement INTEGER,
  points_earned INTEGER,
  matches_played INTEGER,
  matches_won INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tournament messages table
CREATE TABLE public.tournament_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tournament policies
CREATE POLICY "Tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT
  USING (true);

CREATE POLICY "Organizers can create tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own tournaments"
  ON public.tournaments FOR UPDATE
  USING (auth.uid() = organizer_id);

-- Team policies
CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Team captains or organizers can update their teams"
  ON public.teams FOR UPDATE
  USING (
    captain_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

-- Team members policies
CREATE POLICY "Allow users to view their own team memberships"
  ON public.team_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow team members/captains to view team details"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_id AND (
        teams.captain_id = auth.uid() OR
        team_members.user_id = auth.uid()
      )
    )
  );

-- Court policies
CREATE POLICY "Courts are viewable by everyone"
  ON public.courts FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage courts"
  ON public.courts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = tournament_id AND organizer_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_current_stage ON public.tournaments(current_stage);
CREATE INDEX idx_matches_tournament_id ON public.matches(tournament_id);
CREATE INDEX idx_registrations_tournament_id ON public.registrations(tournament_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_courts_tournament_id ON public.courts(tournament_id);
CREATE INDEX idx_matches_court_id ON public.matches(court_id);
CREATE INDEX idx_teams_tournament_id ON public.teams(tournament_id);
CREATE INDEX idx_matches_team1_id ON public.matches(team1_id);
CREATE INDEX idx_matches_team2_id ON public.matches(team2_id);
CREATE INDEX idx_player_history_player_id ON public.player_history(player_id);
CREATE INDEX idx_player_history_tournament_id ON public.player_history(tournament_id);
CREATE INDEX idx_profiles_player_stats ON public.profiles USING gin (player_stats);
CREATE INDEX idx_tournament_messages_tournament_id_created_at ON public.tournament_messages(tournament_id, created_at DESC);

-- Create functions for real-time features
CREATE OR REPLACE FUNCTION notify_match_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'match_updates',
    json_build_object(
      'match_id', NEW.id,
      'tournament_id', NEW.tournament_id,
      'status', NEW.status,
      'scores', NEW.scores
    )::TEXT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to notify court status changes
CREATE OR REPLACE FUNCTION notify_court_status_update()
RETURNS TRIGGER AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'data', row_to_json(NEW)
  );
  PERFORM pg_notify('court_updates', payload::TEXT);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update player stats
CREATE OR REPLACE FUNCTION update_player_stats_after_match()
RETURNS TRIGGER AS $$
DECLARE
  player1_id_val UUID;
  player2_id_val UUID;
  winner_id_val UUID;
  loser_id_val UUID;
BEGIN
  IF NEW.status = 'completed' AND NEW.verified = true THEN
    player1_id_val := NEW.player1_id;
    player2_id_val := NEW.player2_id;
    winner_id_val := NEW.winner_id;

    IF player1_id_val IS NOT NULL AND player2_id_val IS NOT NULL AND winner_id_val IS NOT NULL THEN
      IF winner_id_val = player1_id_val THEN
        loser_id_val := player2_id_val;
      ELSE
        loser_id_val := player1_id_val;
      END IF;

      -- Update Winner's Stats
      UPDATE public.profiles
      SET player_stats = jsonb_set(
        COALESCE(player_stats, '{}')::jsonb,
        '{matches_played}',
        (COALESCE((player_stats->>'matches_played')::int, 0) + 1)::text::jsonb
      )
      WHERE id = winner_id_val;

      UPDATE public.profiles
      SET player_stats = jsonb_set(
        COALESCE(player_stats, '{}')::jsonb,
        '{matches_won}',
        (COALESCE((player_stats->>'matches_won')::int, 0) + 1)::text::jsonb
      )
      WHERE id = winner_id_val;

      -- Update Loser's Stats
      UPDATE public.profiles
      SET player_stats = jsonb_set(
        COALESCE(player_stats, '{}')::jsonb,
        '{matches_played}',
        (COALESCE((player_stats->>'matches_played')::int, 0) + 1)::text::jsonb
      )
      WHERE id = loser_id_val;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER notify_match_changes
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_match_update();

CREATE TRIGGER court_status_change_trigger
  AFTER INSERT OR UPDATE OF status ON public.courts
  FOR EACH ROW
  EXECUTE FUNCTION notify_court_status_update();

CREATE TRIGGER handle_match_completion_stats
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.verified IS DISTINCT FROM NEW.verified)
  EXECUTE FUNCTION update_player_stats_after_match();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT INSERT, UPDATE ON public.registrations TO authenticated;
GRANT INSERT, UPDATE ON public.matches TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
GRANT UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.tournament_messages TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.tournaments IS 'Tournament information and configuration';
COMMENT ON TABLE public.divisions IS 'Tournament divisions (age, skill, gender groups)';
COMMENT ON TABLE public.teams IS 'Teams participating in tournaments';
COMMENT ON TABLE public.team_members IS 'Players belonging to teams';
COMMENT ON TABLE public.registrations IS 'Tournament registrations for players/teams';
COMMENT ON TABLE public.courts IS 'Courts available for matches';
COMMENT ON TABLE public.matches IS 'Tournament matches and their results';
COMMENT ON TABLE public.player_history IS 'Historical record of player tournament participation';
COMMENT ON TABLE public.notifications IS 'User notifications';
COMMENT ON TABLE public.tournament_messages IS 'Tournament-specific chat messages';

COMMENT ON COLUMN public.tournaments.current_stage IS 'Current stage of the tournament (e.g., REGISTRATION, GROUP_STAGE, etc.)';
COMMENT ON COLUMN public.registrations.team_id IS 'Reference to the team if this is a team registration';
COMMENT ON COLUMN public.registrations.player_id IS 'Reference to the player if this is an individual registration';
COMMENT ON COLUMN public.registrations.partner_id IS 'Reference to a partner for doubles registration'; 