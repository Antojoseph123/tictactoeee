-- Fix 1: Rewrite update_profile_stats to use auth.uid() and validate input
CREATE OR REPLACE FUNCTION public.update_profile_stats(p_result TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Validate authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate result input
  IF p_result NOT IN ('win', 'loss', 'draw') THEN
    RAISE EXCEPTION 'Invalid result: %', p_result;
  END IF;

  -- Update only the authenticated user's profile
  UPDATE public.profiles
  SET 
    wins = CASE WHEN p_result = 'win' THEN wins + 1 ELSE wins END,
    losses = CASE WHEN p_result = 'loss' THEN losses + 1 ELSE losses END,
    draws = CASE WHEN p_result = 'draw' THEN draws + 1 ELSE draws END,
    games_played = games_played + 1,
    updated_at = now()
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

-- Fix 2: Add database constraints for username validation
ALTER TABLE profiles 
  ADD CONSTRAINT username_length CHECK (char_length(username) >= 2 AND char_length(username) <= 20);

-- Fix 3: Update profiles RLS policy to include username validation
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND char_length(username) >= 2 
  AND char_length(username) <= 20
);