-- Create a table for tracking high scores across all games
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  level INTEGER DEFAULT 1,
  player_name TEXT NOT NULL DEFAULT 'Anonymous',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast leaderboard queries
CREATE INDEX idx_game_scores_game_id_score ON public.game_scores(game_id, score DESC);
CREATE INDEX idx_game_scores_user_id ON public.game_scores(user_id);

-- Enable Row Level Security
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can view high scores (leaderboard is public)
CREATE POLICY "High scores are viewable by everyone" 
ON public.game_scores 
FOR SELECT 
USING (true);

-- Anyone can insert scores (supports anonymous play)
CREATE POLICY "Anyone can submit scores" 
ON public.game_scores 
FOR INSERT 
WITH CHECK (true);

-- Users can update their own scores
CREATE POLICY "Users can update their own scores" 
ON public.game_scores 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own scores
CREATE POLICY "Users can delete their own scores" 
ON public.game_scores 
FOR DELETE 
USING (auth.uid() = user_id);