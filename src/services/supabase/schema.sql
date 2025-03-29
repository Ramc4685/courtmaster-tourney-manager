
-- Create tables for the badminton tournament manager
-- This schema should be run on your Supabase project

-- Create a profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS (Row Level Security) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles that allows users to view any profile
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Create policy that allows users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create a tournaments table to store tournament data
CREATE TABLE IF NOT EXISTS public.tournaments (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users
);

-- Set up RLS for the tournaments table
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create a user_tournaments table to track tournament access
CREATE TABLE IF NOT EXISTS public.user_tournaments (
  user_id UUID REFERENCES auth.users NOT NULL,
  tournament_id TEXT REFERENCES public.tournaments NOT NULL,
  role TEXT NOT NULL, -- 'owner', 'admin', 'participant', 'spectator'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, tournament_id)
);

-- Set up RLS for the user_tournaments table
ALTER TABLE public.user_tournaments ENABLE ROW LEVEL SECURITY;

-- Tournaments are viewable by users who have a relationship with them
CREATE POLICY "Users can view tournaments they have access to" ON public.tournaments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_tournaments ut
      WHERE ut.tournament_id = id AND ut.user_id = auth.uid()
    )
  );

-- Users can create tournaments
CREATE POLICY "Users can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (true);

-- Users can update tournaments they own or administer
CREATE POLICY "Users can update tournaments they have admin access to" ON public.tournaments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_tournaments ut
      WHERE ut.tournament_id = id AND ut.user_id = auth.uid()
      AND (ut.role = 'owner' OR ut.role = 'admin')
    )
  );

-- Users can delete tournaments they own
CREATE POLICY "Users can delete tournaments they own" ON public.tournaments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_tournaments ut
      WHERE ut.tournament_id = id AND ut.user_id = auth.uid() AND ut.role = 'owner'
    )
  );

-- Users can see tournament access records they're a part of
CREATE POLICY "Users can view their tournament relationships" ON public.user_tournaments
  FOR SELECT USING (user_id = auth.uid());

-- Users with admin access can add other users to tournaments
CREATE POLICY "Admins can insert user tournament relationships" ON public.user_tournaments
  FOR INSERT WITH CHECK (
    tournament_id IN (
      SELECT tournament_id FROM public.user_tournaments
      WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'admin')
    ) OR user_id = auth.uid() -- Users can add themselves to tournaments they've created
  );

-- Only owners and admins can update tournament access
CREATE POLICY "Admins can update user tournament relationships" ON public.user_tournaments
  FOR UPDATE USING (
    tournament_id IN (
      SELECT tournament_id FROM public.user_tournaments
      WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'admin')
    )
  );

-- Set up functions and triggers for maintenance

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tournaments table
CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to handle realtime tournament updates
CREATE OR REPLACE FUNCTION notify_tournament_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'tournament_update',
    json_build_object(
      'tournament_id', NEW.id,
      'updated_at', NEW.updated_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tournament updates
CREATE TRIGGER tournament_change_trigger
AFTER UPDATE ON public.tournaments
FOR EACH ROW EXECUTE PROCEDURE notify_tournament_change();
