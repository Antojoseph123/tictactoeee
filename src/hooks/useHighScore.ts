import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  level?: number;
  created_at: string;
}

export function useHighScore(gameId: string) {
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load high score and leaderboard on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load from localStorage first for quick display
      const localHighScore = localStorage.getItem(`${gameId}-high-score`);
      if (localHighScore) {
        setHighScore(parseInt(localHighScore));
      }

      // Then fetch leaderboard from database
      try {
        const { data, error } = await supabase
          .from('game_scores')
          .select('id, player_name, score, level, created_at')
          .eq('game_id', gameId)
          .order('score', { ascending: false })
          .limit(10);

        if (!error && data) {
          setLeaderboard(data);
          // Update high score if database has higher
          if (data.length > 0 && data[0].score > (parseInt(localHighScore || '0'))) {
            setHighScore(data[0].score);
          }
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [gameId]);

  // Submit a new score
  const submitScore = useCallback(async (score: number, playerName: string = 'Anonymous', level?: number) => {
    // Update local high score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(`${gameId}-high-score`, score.toString());
    }

    // Submit to database
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('game_scores')
        .insert({
          game_id: gameId,
          score,
          level: level || 1,
          player_name: playerName,
          user_id: user?.user?.id || null,
        });

      if (error) {
        console.error('Failed to submit score:', error);
        return false;
      }

      // Refresh leaderboard
      const { data: newLeaderboard } = await supabase
        .from('game_scores')
        .select('id, player_name, score, level, created_at')
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(10);

      if (newLeaderboard) {
        setLeaderboard(newLeaderboard);
      }

      return true;
    } catch (error) {
      console.error('Failed to submit score:', error);
      return false;
    }
  }, [gameId, highScore]);

  // Check if score qualifies for leaderboard
  const qualifiesForLeaderboard = useCallback((score: number) => {
    if (leaderboard.length < 10) return true;
    return score > (leaderboard[leaderboard.length - 1]?.score || 0);
  }, [leaderboard]);

  return {
    highScore,
    leaderboard,
    isLoading,
    submitScore,
    qualifiesForLeaderboard,
  };
}
