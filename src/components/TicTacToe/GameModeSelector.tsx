import { motion } from "framer-motion";
import { User, Bot, Globe, History } from "lucide-react";
import type { Difficulty } from "@/utils/aiOpponent";

export type GameMode = 'local' | 'ai' | 'online' | 'history';

interface GameModeSelectorProps {
  onSelectMode: (mode: GameMode, difficulty?: Difficulty) => void;
}

const GameModeSelector = ({ onSelectMode }: GameModeSelectorProps) => {
  const modes = [
    {
      id: 'local' as GameMode,
      icon: User,
      title: 'Local Game',
      description: 'Play with a friend on the same device',
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
      description: 'Play with friends remotely',
    },
    {
      id: 'history' as GameMode,
      icon: History,
      title: 'History',
      description: 'View past games',
    },
  ];

  const difficulties: { id: Difficulty; label: string; color: string }[] = [
    { id: 'easy', label: 'Easy', color: 'text-green-400' },
    { id: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { id: 'hard', label: 'Hard', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-4">
      <motion.h2
        className="text-2xl font-light text-center text-foreground mb-6"
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
            transition={{ delay: index * 0.1 }}
          >
            {mode.showDifficulty ? (
              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <mode.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">{mode.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
                <div className="flex flex-col gap-2">
                  {difficulties.map((diff) => (
                    <motion.button
                      key={diff.id}
                      onClick={() => onSelectMode('ai', diff.id)}
                      className={`glass-button rounded-lg px-3 py-2 text-sm font-medium ${diff.color}`}
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
                className="glass-panel rounded-2xl p-4 w-full text-left hover:bg-card/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <mode.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">{mode.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GameModeSelector;
