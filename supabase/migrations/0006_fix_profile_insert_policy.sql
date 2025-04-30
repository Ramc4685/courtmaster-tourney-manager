-- Fix profile insert policy
BEGIN;

-- Drop existing insert policy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- Create new insert policy that allows authenticated users to create their own profile
CREATE POLICY "Enable insert for authenticated users only" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Grant insert permission to authenticated users
GRANT INSERT ON public.profiles TO authenticated;

COMMIT; 