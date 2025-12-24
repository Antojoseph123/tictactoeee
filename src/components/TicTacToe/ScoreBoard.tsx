import { motion } from "framer-motion";

interface ScoreBoardProps {
  scores: {
    X: number;
    O: number;
    draws: number;
  };
}

const ScoreBoard = ({ scores }: ScoreBoardProps) => {
  const scoreItems = [
    { label: 'X', value: scores.X, className: 'marker-x' },
    { label: 'Draws', value: scores.draws, className: 'text-muted-foreground' },
    { label: 'O', value: scores.O, className: 'marker-o' },
  ];

  return (
    <motion.div
      className="glass-panel rounded-2xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex justify-around items-center gap-4">
        {scoreItems.map((item, index) => (
          <motion.div
            key={item.label}
            className="text-center flex-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <p className={`text-lg font-medium ${item.className}`}>
              {item.label}
            </p>
            <motion.p
              className="text-3xl sm:text-4xl font-light text-foreground mt-1"
              key={item.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {item.value}
            </motion.p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ScoreBoard;
