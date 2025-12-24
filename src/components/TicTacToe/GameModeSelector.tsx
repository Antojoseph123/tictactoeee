import { motion } from "framer-motion";
import { User, Bot, Globe, History, Trophy, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Difficulty } from "@/utils/aiOpponent";

export type GameMode = 'local' | 'ai' | 'online' | 'history' | 'leaderboard';

interface GameModeSelectorProps {
  onSelectMode: (mode: GameMode, difficulty?: Difficulty) => void;
  onAuthClick: () => void;
}

const GameModeSelector = ({ onSelectMode, onAuthClick }: GameModeSelectorProps) => {
  const { user, profile } = useAuth();

  const modes = [
    {
      id: 'local' as GameMode,
      icon: User,
      title: 'Local Game',
      description: 'Play with a friend',
    },
    {
      id: 'ai' as GameMode,
      icon: Bot,
      title: 'vs AI',
      description: 'Challenge the computer',
      showDifficulty: true,
    },
    {
      id: 'online' as GameMode,
      icon: Globe,
      title: 'Online',
      description: 'Play remotely',
    },
    {
      id: 'leaderboard' as GameMode,
      icon: Trophy,
      title: 'Leaderboard',
      description: 'Top players',
    },
    {
      id: 'history' as GameMode,
      icon: History,
      title: 'History',
      description: 'Past games',
    },
  ];

  const difficulties: { id: Difficulty; label: string; color: string }[] = [
    { id: 'easy', label: 'Easy', color: 'text-green-400' },
    { id: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { id: 'hard', label: 'Hard', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-4">
      {/* User info / Login button */}
      <motion.div
        className="glass-panel rounded-2xl p-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {user && profile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{profile.username}</p>
                <p className="text-xs text-muted-foreground">
                  {profile.wins}W - {profile.losses}L - {profile.draws}D
                </p>
              </div>
            </div>
          </div>
        ) : (
          <motion.button
            onClick={onAuthClick}
            className="w-full flex items-center justify-center gap-2 text-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn className="w-5 h-5" />
            <span>Sign in to track stats</span>
          </motion.button>
        )}
      </motion.div>

      <motion.h2
        className="text-xl font-light text-center text-foreground"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Choose Game Mode
      </motion.h2>

      <div className="grid grid-cols-2 gap-3">
        {modes.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={mode.id === 'history' ? 'col-span-2' : ''}
          >
            {mode.showDifficulty ? (
              <div className="glass-panel rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <mode.icon className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">{mode.title}</span>
                </div>
                <div className="flex gap-2">
                  {difficulties.map((diff) => (
                    <motion.button
                      key={diff.id}
                      onClick={() => onSelectMode('ai', diff.id)}
                      className={`glass-button rounded-lg px-3 py-1.5 text-xs font-medium flex-1 ${diff.color}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {diff.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <motion.button
                onClick={() => onSelectMode(mode.id)}
                className="glass-panel rounded-2xl p-3 w-full text-left hover:bg-card/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <mode.icon className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">{mode.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GameModeSelector;
