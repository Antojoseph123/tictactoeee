import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GameHistoryEntry {
  game_type: string;
  bet_amount: number;
  multiplier: number;
  payout: number;
  profit: number;
  result: 'win' | 'loss' | 'push';
  game_data?: Record<string, unknown>;
}

export const useGameHistory = () => {
  const { user } = useAuth();

  const addHistoryEntry = useCallback(async (entry: GameHistoryEntry) => {
    if (!user) return null;

    const insertData = {
      user_id: user.id,
      game_type: entry.game_type,
      bet_amount: entry.bet_amount,
      multiplier: entry.multiplier,
      payout: entry.payout,
      profit: entry.profit,
      result: entry.result,
      game_data: JSON.parse(JSON.stringify(entry.game_data || {})),
    };

    const { data, error } = await supabase
      .from('game_history')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error saving game history:', error);
      return null;
    }

    return data;
  }, [user]);

  const getHistory = useCallback(async (gameType?: string, limit = 50) => {
    if (!user) return [];

    let query = supabase
      .from('game_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (gameType) {
      query = query.eq('game_type', gameType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching game history:', error);
      return [];
    }

    return data || [];
  }, [user]);

  return {
    addHistoryEntry,
    getHistory,
  };
};
