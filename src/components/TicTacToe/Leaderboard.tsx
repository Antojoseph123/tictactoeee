import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { soundManager } from '@/utils/sounds';

interface LeaderboardEntry {
  id: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  games_played: number;
  win_rate: number;
}

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard = ({ onBack }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'wins' | 'win_rate' | 'games'>('wins');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .gt('games_played', 0)
        .order('wins', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData: LeaderboardEntry[] = (data || []).map(entry => ({
        id: entry.id,
        username: entry.username,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        games_played: entry.games_played,
        win_rate: entry.games_played > 0 ? (entry.wins / entry.games_played) * 100 : 0,
      }));

      setEntries(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortBy) {
      case 'wins': return b.wins - a.wins;
      case 'win_rate': return b.win_rate - a.win_rate;
      case 'games': return b.games_played - a.games_played;
      default: return 0;
    }
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 1: return <Medal className="w-5 h-5 text-gray-300" />;
      case 2: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 text-center text-muted-foreground">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Leaderboard
        </h2>
      </div>

      {/* Sort tabs */}
      <div className="glass-panel rounded-xl p-1 flex gap-1">
        {(['wins', 'win_rate', 'games'] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => { soundManager.playClick(); setSortBy(sort); }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              sortBy === sort
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {sort === 'wins' && 'Most Wins'}
            {sort === 'win_rate' && 'Win Rate'}
            {sort === 'games' && 'Most Games'}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No players yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {sortedEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              className="glass-panel rounded-xl p-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{entry.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.games_played} games played
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary">{entry.wins} wins</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.win_rate.toFixed(0)}% win rate
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.button
        onClick={() => { soundManager.playClick(); onBack(); }}
        className="glass-button rounded-xl px-6 py-3 flex items-center gap-2 mx-auto text-muted-foreground"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </motion.button>
    </motion.div>
  );
};

export default Leaderboard;
