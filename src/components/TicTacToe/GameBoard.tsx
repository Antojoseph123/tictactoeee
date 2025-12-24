import { motion } from "framer-motion";

interface GameBoardProps {
  board: (string | null)[];
  winningLine: number[] | null;
  onCellClick: (index: number) => void;
  predictions?: Map<number, number>;
  showPredictions?: boolean;
}

const GameBoard = ({ board, winningLine, onCellClick, predictions, showPredictions }: GameBoardProps) => {
  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winningLine?.includes(index);
    const prediction = predictions?.get(index) || 0;
    const showPrediction = showPredictions && !value && prediction > 0;

    // Convert prediction to visual intensity (0-100%)
    const intensity = Math.round(prediction * 100);
    const isHighProbability = prediction > 0.7;
    const isMediumProbability = prediction > 0.4 && prediction <= 0.7;

    return (
      <motion.button
        key={index}
        onClick={() => onCellClick(index)}
        className={`
          glass-tile rounded-2xl aspect-square flex items-center justify-center relative
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
        
        {showPrediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Pulsing ring indicator */}
            <motion.div
              className={`absolute rounded-xl ${
                isHighProbability 
                  ? 'bg-destructive/30 border-2 border-destructive' 
                  : isMediumProbability 
                    ? 'bg-primary/20 border-2 border-primary/60' 
                    : 'bg-muted/20 border border-muted-foreground/30'
              }`}
              style={{
                width: `${40 + intensity * 0.4}%`,
                height: `${40 + intensity * 0.4}%`,
              }}
              animate={{
                scale: isHighProbability ? [1, 1.1, 1] : [1, 1.05, 1],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: isHighProbability ? 1 : 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Percentage label */}
            <span className={`text-xs sm:text-sm font-medium z-10 ${
              isHighProbability 
                ? 'text-destructive' 
                : isMediumProbability 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
            }`}>
              {intensity}%
            </span>
          </motion.div>
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
