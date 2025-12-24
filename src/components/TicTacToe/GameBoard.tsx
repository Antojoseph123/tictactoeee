import { motion } from "framer-motion";

interface GameBoardProps {
  board: (string | null)[];
  winningLine: number[] | null;
  onCellClick: (index: number) => void;
}

const GameBoard = ({ board, winningLine, onCellClick }: GameBoardProps) => {
  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winningLine?.includes(index);

    return (
      <motion.button
        key={index}
        onClick={() => onCellClick(index)}
        className={`
          glass-tile rounded-2xl aspect-square flex items-center justify-center
          text-5xl sm:text-6xl md:text-7xl font-light cursor-pointer
          ${isWinningCell ? 'animate-celebration' : ''}
          ${!value ? 'hover:bg-card/15' : ''}
        `}
        whileHover={!value ? { scale: 1.05 } : {}}
        whileTap={!value ? { scale: 0.95 } : {}}
        disabled={!!value}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
      >
        {value && (
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={value === 'X' ? 'marker-x' : 'marker-o'}
          >
            {value}
          </motion.span>
        )}
      </motion.button>
    );
  };

  return (
    <motion.div
      className="glass-panel rounded-3xl p-4 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {board.map((_, index) => renderCell(index))}
      </div>
    </motion.div>
  );
};

export default GameBoard;
