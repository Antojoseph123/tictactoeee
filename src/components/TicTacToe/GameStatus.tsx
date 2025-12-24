import { motion, AnimatePresence } from "framer-motion";

interface GameStatusProps {
  currentPlayer: 'X' | 'O';
  winner: string | null;
  isDraw: boolean;
}

const GameStatus = ({ currentPlayer, winner, isDraw }: GameStatusProps) => {
  const getMessage = () => {
    if (winner) {
      return (
        <span className="flex items-center gap-3">
          <span className={winner === 'X' ? 'marker-x' : 'marker-o'}>
            {winner}
          </span>
          <span>wins!</span>
        </span>
      );
    }
    if (isDraw) {
      return "It's a draw!";
    }
    return (
      <span className="flex items-center gap-3">
        <span className={currentPlayer === 'X' ? 'marker-x' : 'marker-o'}>
          {currentPlayer}
        </span>
        <span className="text-muted-foreground">'s turn</span>
      </span>
    );
  };

  return (
    <motion.div
      className="glass-panel rounded-2xl px-6 py-4 text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <AnimatePresence mode="wait">
        <motion.h2
          key={`${winner}-${isDraw}-${currentPlayer}`}
          className="text-2xl sm:text-3xl font-medium text-foreground"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {getMessage()}
        </motion.h2>
      </AnimatePresence>
    </motion.div>
  );
};

export default GameStatus;
