-- Fix RPC function permissions
BEGIN;

-- Drop existing functions to recreate them with proper permissions
DROP FUNCTION IF EXISTS get_user_profile(UUID);
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT);

-- Recreate get_user_profile function with proper security
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the requesting user is trying to access their own profile
  IF auth.uid() = user_id THEN
    RETURN (
      SELECT row_to_json(p.*)
      FROM profiles p
      WHERE p.id = user_id
    );
  ELSE
    -- For other users, return only public information
    RETURN (
      SELECT row_to_json(p.*)
      FROM profiles p
      WHERE p.id = user_id
      AND COALESCE((p.preferences->>'privacy'->>'show_profile')::boolean, true)
    );
  END IF;
END;
$$;

-- Recreate create_user_profile function with proper security
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  display_name TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_profile json;
BEGIN
  -- Only allow creating profile for the authenticated user
  IF auth.uid() = user_id THEN
    INSERT INTO profiles (
      id,
      full_name,
      display_name,
      email,
      role,
      player_stats,
      preferences
    )
    VALUES (
      user_id,
      display_name,
      display_name,
      user_email,
      'player',
      json_build_object(
        'matches_played', 0,
        'matches_won', 0,
        'tournaments_played', 0,
        'tournaments_won', 0,
        'rating', 1000,
        'ranking', null
      ),
      json_build_object(
        'notifications', json_build_object(
          'email', true,
          'push', true,
          'tournament_updates', true,
          'match_reminders', true
        ),
        'privacy', json_build_object(
          'show_profile', true,
          'show_stats', true,
          'show_history', true
        ),
        'display', json_build_object(
          'theme', 'light',
          'language', 'en'
        )
      )
    )
    RETURNING row_to_json(profiles.*) INTO new_profile;
    
    RETURN new_profile;
  ELSE
    RAISE EXCEPTION 'Not authorized to create profile for another user';
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- Create new policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

COMMIT; 