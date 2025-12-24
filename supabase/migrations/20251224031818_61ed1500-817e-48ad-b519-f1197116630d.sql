-- Create games history table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_x TEXT NOT NULL DEFAULT 'Player 1',
  player_o TEXT NOT NULL DEFAULT 'Player 2',
  winner TEXT, -- 'X', 'O', 'draw', or null if in progress
  board TEXT[] NOT NULL DEFAULT ARRAY[NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL]::TEXT[],
  moves JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of moves [{index, player}]
  game_mode TEXT NOT NULL DEFAULT 'local', -- 'local', 'ai', 'online'
  ai_difficulty TEXT, -- 'easy', 'medium', 'hard' for AI games
  room_code TEXT, -- For online multiplayer
  current_player TEXT NOT NULL DEFAULT 'X',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create online game rooms table
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL, -- Browser session ID
  guest_id TEXT, -- Browser session ID
  host_name TEXT NOT NULL DEFAULT 'Host',
  guest_name TEXT,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- Allow all operations for games (public game history)
CREATE POLICY "Anyone can view games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Anyone can insert games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update games" ON public.games FOR UPDATE USING (true);

-- Allow all operations for game rooms (public multiplayer)
CREATE POLICY "Anyone can view rooms" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rooms" ON public.game_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.game_rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete rooms" ON public.game_rooms FOR DELETE USING (true);

-- Enable realtime for game rooms and games
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;