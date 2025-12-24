import { motion } from "framer-motion";
import { RotateCcw, RefreshCw } from "lucide-react";

interface GameControlsProps {
  onRestart: () => void;
  onResetScores: () => void;
  gameOver: boolean;
}

const GameControls = ({ onRestart, onResetScores, gameOver }: GameControlsProps) => {
  return (
    <motion.div
      className="flex gap-3 justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <motion.button
        onClick={onRestart}
        className="glass-button rounded-xl px-6 py-3 flex items-center gap-2 text-foreground font-medium"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RotateCcw className="w-5 h-5" />
        <span>{gameOver ? 'Play Again' : 'Restart'}</span>
      </motion.button>
      
      <motion.button
        onClick={onResetScores}
        className="glass-button rounded-xl px-6 py-3 flex items-center gap-2 text-muted-foreground font-medium"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RefreshCw className="w-5 h-5" />
        <span>Reset Scores</span>
      </motion.button>
    </motion.div>
  );
};

export default GameControls;
