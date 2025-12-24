-- Add avatar_url column if not exists and create friends table
-- Update profiles to add avatar options
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_index INTEGER DEFAULT 0;

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Policies for friendships
CREATE POLICY "Users can view their own friendships" 
ON public.friendships FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" 
ON public.friendships FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of" 
ON public.friendships FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships" 
ON public.friendships FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Enable realtime for friendships
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;