-- Fix profile table permissions
BEGIN;

-- First ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- Recreate policies with clear names
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Grant permissions to anon for public reads
GRANT SELECT ON public.profiles TO anon;

COMMIT; 