import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface HistoryEntry {
  id: string;
  game_type: string;
  bet_amount: number;
  multiplier: number;
  payout: number;
  profit: number;
  result: string;
  created_at: string;
}

interface GameHistoryPanelProps {
  gameType?: string;
  maxHeight?: string;
}

const gameNames: Record<string, string> = {
  dice: 'Dice',
  crash: 'Crash',
  mines: 'Mines',
  plinko: 'Plinko',
  roulette: 'Roulette',
  blackjack: 'Blackjack',
  snake: 'Snake',
  flappy: 'Flappy Bird',
  whackamole: 'Whack-a-Mole',
  simon: 'Simon Says',
};

export const GameHistoryPanel = ({ gameType, maxHeight = '300px' }: GameHistoryPanelProps) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      let query = supabase
        .from('game_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching history:', error);
      } else {
        setHistory(data || []);
      }
      setLoading(false);
    };

    fetchHistory();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('game-history-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEntry = payload.new as HistoryEntry;
          if (!gameType || newEntry.game_type === gameType) {
            setHistory((prev) => [newEntry, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, gameType]);

  if (!user) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        Sign in to view your game history
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        No games played yet
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }} className="w-full">
      <div className="space-y-2 p-2">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border text-sm"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{gameNames[entry.game_type] || entry.game_type}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-muted-foreground">
                ${entry.bet_amount.toFixed(2)} × {entry.multiplier.toFixed(2)}x
              </span>
              <span
                className={`font-semibold ${
                  entry.profit > 0
                    ? 'text-green-500'
                    : entry.profit < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                }`}
              >
                {entry.profit >= 0 ? '+' : ''}${entry.profit.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
