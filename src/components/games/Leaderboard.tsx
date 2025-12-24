import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  level?: number;
  created_at: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  title?: string;
}

export function Leaderboard({ entries, isLoading = false, title = 'Leaderboard' }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground text-sm">{rank + 1}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-4 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {title}
        </h3>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="glass-card p-4 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {title}
        </h3>
        <p className="text-muted-foreground text-sm text-center py-4">
          No scores yet. Be the first!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 w-full max-w-sm">
      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        {title}
      </h3>
      <div className="space-y-1">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 p-2 rounded-lg ${
              index === 0 ? 'bg-yellow-500/10' : 
              index === 1 ? 'bg-gray-400/10' :
              index === 2 ? 'bg-amber-600/10' : 'bg-muted/30'
            }`}
          >
            {getRankIcon(index)}
            <span className="flex-1 truncate text-foreground text-sm">
              {entry.player_name}
            </span>
            <span className="font-bold text-primary">{entry.score.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
