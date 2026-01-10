-- Create game_history table to track all bets across all games
CREATE TABLE public.game_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  bet_amount NUMERIC NOT NULL DEFAULT 0,
  multiplier NUMERIC NOT NULL DEFAULT 1,
  payout NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  result TEXT NOT NULL DEFAULT 'loss',
  game_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own history" 
ON public.game_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert their own history" 
ON public.game_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all history
CREATE POLICY "Admins can view all history" 
ON public.game_history 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete history
CREATE POLICY "Admins can delete history" 
ON public.game_history 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for game_history table
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_history;

-- Create index for faster queries
CREATE INDEX idx_game_history_user_id ON public.game_history(user_id);
CREATE INDEX idx_game_history_game_type ON public.game_history(game_type);
CREATE INDEX idx_game_history_created_at ON public.game_history(created_at DESC);