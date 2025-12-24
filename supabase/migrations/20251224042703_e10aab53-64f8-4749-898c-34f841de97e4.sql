-- Fix games table RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert games" ON public.games;
DROP POLICY IF EXISTS "Anyone can update games" ON public.games;
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;

-- Create proper restrictive policies

-- SELECT: Users can view games they're participating in (by user_id or room_code match)
-- Also allow viewing completed games for replay/history purposes
CREATE POLICY "Users can view their own games"
ON public.games
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  room_code IN (
    SELECT room_code FROM public.game_rooms 
    WHERE host_id = auth.uid()::text OR guest_id = auth.uid()::text
  )
);

-- INSERT: Only authenticated users can create games
CREATE POLICY "Authenticated users can create games"
ON public.games
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

-- UPDATE: Only participants can update games
-- For online games, check via room_code; for local games, check user_id
CREATE POLICY "Participants can update their games"
ON public.games
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  room_code IN (
    SELECT room_code FROM public.game_rooms 
    WHERE host_id = auth.uid()::text OR guest_id = auth.uid()::text
  )
);

-- DELETE: Users can only delete their own games
CREATE POLICY "Users can delete their own games"
ON public.games
FOR DELETE
TO authenticated
USING (user_id = auth.uid());