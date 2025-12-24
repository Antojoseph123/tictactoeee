-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can delete rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Anyone can insert rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.game_rooms;

-- Create restrictive policies for game_rooms

-- Users can view waiting rooms (for matchmaking) or rooms they're part of
CREATE POLICY "Users can view available or own rooms"
ON public.game_rooms
FOR SELECT
USING (
  status = 'waiting' 
  OR host_id = auth.uid()::text 
  OR guest_id = auth.uid()::text
);

-- Only authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms"
ON public.game_rooms
FOR INSERT
TO authenticated
WITH CHECK (host_id = auth.uid()::text);

-- Only host or guest can update their room
CREATE POLICY "Participants can update their rooms"
ON public.game_rooms
FOR UPDATE
TO authenticated
USING (host_id = auth.uid()::text OR guest_id = auth.uid()::text);

-- Only the host can delete the room
CREATE POLICY "Host can delete their room"
ON public.game_rooms
FOR DELETE
TO authenticated
USING (host_id = auth.uid()::text);