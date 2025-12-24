import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface GameRecord {
  id: string;
  player_x: string;
  player_o: string;
  winner: string | null;
  board: (string | null)[];
  moves: { index: number; player: string }[];
  game_mode: string;
  ai_difficulty: string | null;
  created_at: string;
  completed_at: string | null;
}

export const useGameHistory = () => {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .not('winner', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedGames: GameRecord[] = (data || []).map(game => ({
        id: game.id,
        player_x: game.player_x,
        player_o: game.player_o,
        winner: game.winner,
        board: (game.board || []).map(cell => cell === 'null' || cell === null ? null : cell),
        moves: Array.isArray(game.moves) 
          ? (game.moves as { index: number; player: string }[])
          : [],
        game_mode: game.game_mode,
        ai_difficulty: game.ai_difficulty,
        created_at: game.created_at,
        completed_at: game.completed_at,
      }));

      setGames(formattedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGame = useCallback(async (
    board: (string | null)[],
    moves: { index: number; player: string }[],
    winner: string | null,
    gameMode: string,
    playerX: string = 'Player 1',
    playerO: string = 'Player 2',
    aiDifficulty?: string
  ) => {
    try {
      const { error } = await supabase.from('games').insert({
        player_x: playerX,
        player_o: playerO,
        winner: winner || 'draw',
        board: board.map(cell => cell ?? 'null'),
        moves: moves as unknown as Json,
        game_mode: gameMode,
        ai_difficulty: aiDifficulty || null,
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;
      
      // Refresh games list
      fetchGames();
    } catch (error) {
      console.error('Error saving game:', error);
    }
  }, [fetchGames]);

  const clearHistory = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .not('id', 'is', null);

      if (error) throw error;
      setGames([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return {
    games,
    loading,
    saveGame,
    clearHistory,
    refreshGames: fetchGames,
  };
};
