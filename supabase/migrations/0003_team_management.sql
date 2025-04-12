-- Migration: 0003_team_management
-- Description: Adds tables for teams and team members, and updates registrations table.

BEGIN;

-- 1. Create Team table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  captain_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Link to the user profile of the captain
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraint to ensure unique team names within a tournament
  CONSTRAINT unique_team_name_per_tournament UNIQUE (tournament_id, name)
);

-- Add comments for clarity
COMMENT ON TABLE public.teams IS 'Stores information about teams participating in tournaments.';
COMMENT ON COLUMN public.teams.captain_id IS 'User ID of the team captain from the profiles table.';

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policies for teams table
CREATE POLICY "Allow authenticated users to view teams" ON public.teams
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow captains to update their own teams
CREATE POLICY "Allow captains to update their own teams" ON public.teams
  FOR UPDATE USING (auth.uid() = captain_id) WITH CHECK (auth.uid() = captain_id);

-- TODO: Add policy for organizers/admins to update any team based on role system

-- Allow authenticated users to insert teams (captain will likely be set in backend logic)
CREATE POLICY "Allow authenticated users to insert teams" ON public.teams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. Create Team Members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Link to the user profile
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Ensure a user can only be on one team per tournament
  CONSTRAINT unique_user_per_team UNIQUE (team_id, user_id)
);

-- Add comments
COMMENT ON TABLE public.team_members IS 'Junction table linking users (profiles) to teams.';

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policies for team_members table
CREATE POLICY "Allow users to view their own team memberships" ON public.team_members
  FOR SELECT USING (auth.uid() = user_id);

-- Allow team members/captains to view memberships of their team
CREATE POLICY "Allow team members/captains to view team details" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id AND (
        teams.captain_id = auth.uid() OR
        team_members.user_id = auth.uid() -- Allow member to see their own team
      )
    )
  );

-- Allow captains to add/remove members from their team
CREATE POLICY "Allow captains to manage team members" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id AND teams.captain_id = auth.uid()
    )
  );

-- 3. Update Registrations table
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON COLUMN public.registrations.team_id IS 'Reference to the team if this is a team registration.';
COMMENT ON COLUMN public.registrations.player_id IS 'Reference to the player if this is an individual registration. Could also be captain for team reg.';
COMMENT ON COLUMN public.registrations.partner_id IS 'Reference to a partner for doubles registration.';


-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON public.teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_teams_captain_id ON public.teams(captain_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_team_id ON public.registrations(team_id);


COMMIT; 