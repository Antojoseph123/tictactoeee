import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Clock, Bot, User, Globe, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { GameRecord } from "@/hooks/useGameHistory";
import { soundManager } from "@/utils/sounds";

interface GameHistoryProps {
  games: GameRecord[];
  loading: boolean;
  onBack: () => void;
  onClearHistory: () => void;
  onReplay: (game: GameRecord) => void;
}

const GameHistory = ({ games, loading, onBack, onClearHistory, onReplay }: GameHistoryProps) => {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'ai': return Bot;
      case 'online': return Globe;
      default: return User;
    }
  };

  const getWinnerText = (game: GameRecord) => {
    if (game.winner === 'draw') return 'Draw';
    if (game.winner === 'X') return `${game.player_x} won`;
    if (game.winner === 'O') return `${game.player_o} won`;
    return 'In progress';
  };

  const handleClear = () => {
    soundManager.playClick();
    onClearHistory();
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
        <h2 className="text-2xl font-light text-foreground">Game History</h2>
        {games.length > 0 && (
          <motion.button
            onClick={handleClear}
            className="glass-button rounded-lg p-2 text-destructive"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {games.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No games played yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {games.map((game, index) => {
            const ModeIcon = getModeIcon(game.game_mode);
            
            return (
              <motion.button
                key={game.id}
                onClick={() => { soundManager.playClick(); onReplay(game); }}
                className="glass-panel rounded-xl p-3 w-full text-left hover:bg-card/10 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="glass-tile rounded-lg p-2">
                      <ModeIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {game.player_x} vs {game.player_o}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(game.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      game.winner === 'draw' 
                        ? 'text-muted-foreground' 
                        : game.winner === 'X' 
                          ? 'text-primary' 
                          : 'text-secondary'
                    }`}>
                      {getWinnerText(game)}
                    </p>
                    {game.ai_difficulty && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {game.ai_difficulty} AI
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
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

export default GameHistory;
