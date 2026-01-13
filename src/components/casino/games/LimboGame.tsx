import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "@/components/casino/BetControls";
import { GameHistoryEntry } from "@/hooks/useGameHistory";
import { TrendingUp, TrendingDown } from "lucide-react";

interface LimboGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
  onGameComplete?: (entry: GameHistoryEntry) => Promise<unknown>;
  gameType: string;
}

export const LimboGame = ({ balance, onBet, onWin, onGameComplete, gameType }: LimboGameProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{ multiplier: number; won: boolean } | null>(null);
  const [history, setHistory] = useState<{ multiplier: number; target: number; won: boolean }[]>([]);
  const [animatingValue, setAnimatingValue] = useState<number>(1);

  // Calculate win chance based on target
  const winChance = Math.min(99, Math.max(1, (1 / targetMultiplier) * 100));

  // Generate result based on house edge
  const generateResult = (): number => {
    const houseEdge = 0.02; // 2% house edge
    const adjustedChance = (1 / targetMultiplier) * (1 - houseEdge);
    
    if (Math.random() < adjustedChance) {
      // Win - return value above target
      return targetMultiplier + (Math.random() * (100 - targetMultiplier));
    } else {
      // Lose - return value below target
      return 1 + Math.random() * (targetMultiplier - 1 - 0.01);
    }
  };

  const play = useCallback(async () => {
    if (isPlaying || betAmount > balance) return;

    const success = await onBet(betAmount);
    if (!success) return;

    setIsPlaying(true);
    setResult(null);

    // Animate counting up
    const finalMultiplier = generateResult();
    const duration = 1500;
    const startTime = Date.now();
    const startValue = 1;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for dramatic effect
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (finalMultiplier - startValue) * eased;
      
      setAnimatingValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Final result
        const won = finalMultiplier >= targetMultiplier;
        setResult({ multiplier: finalMultiplier, won });
        setHistory(prev => [{ multiplier: finalMultiplier, target: targetMultiplier, won }, ...prev.slice(0, 9)]);

        if (won) {
          const payout = betAmount * targetMultiplier;
          onWin(payout);
        }

        if (onGameComplete) {
          onGameComplete({
            game_type: gameType,
            bet_amount: betAmount,
            multiplier: won ? targetMultiplier : 0,
            payout: won ? betAmount * targetMultiplier : 0,
            profit: won ? betAmount * (targetMultiplier - 1) : -betAmount,
            result: won ? "win" : "loss",
            game_data: { targetMultiplier, resultMultiplier: finalMultiplier },
          });
        }

        setIsPlaying(false);
      }
    };

    requestAnimationFrame(animate);
  }, [betAmount, balance, targetMultiplier, isPlaying, onBet, onWin, onGameComplete, gameType]);

  const presetTargets = [1.5, 2, 3, 5, 10, 20, 50, 100];

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Limbo</h2>
        <p className="text-sm text-muted-foreground">Will the multiplier go above your target?</p>
      </div>

      {/* History */}
      <div className="flex gap-1 flex-wrap justify-center">
        {history.map((h, i) => (
          <span
            key={i}
            className={`history-chip ${h.won ? "win" : "loss"}`}
          >
            {h.multiplier.toFixed(2)}×
          </span>
        ))}
      </div>

      {/* Main Display */}
      <div className="relative w-full max-w-sm">
        {/* Multiplier Display */}
        <motion.div
          className={`
            relative h-48 rounded-2xl flex items-center justify-center overflow-hidden
            ${result?.won ? "bg-green-500/20 border-green-500/50" : result && !result.won ? "bg-red-500/20 border-red-500/50" : "bg-surface-elevated"}
            border-2 border-border transition-colors duration-300
          `}
        >
          {/* Background glow */}
          <div className={`absolute inset-0 ${isPlaying ? "animate-pulse" : ""}`}>
            <div className={`absolute inset-0 bg-gradient-to-b ${
              result?.won ? "from-green-500/20" : result && !result.won ? "from-red-500/20" : "from-primary/10"
            } to-transparent`} />
          </div>

          {/* Value */}
          <motion.div
            className={`text-6xl sm:text-7xl font-black ${
              result?.won ? "text-green-500" : result && !result.won ? "text-red-400" : "text-foreground"
            }`}
            animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3, repeat: isPlaying ? Infinity : 0 }}
          >
            {isPlaying ? animatingValue.toFixed(2) : result ? result.multiplier.toFixed(2) : "--.--"}×
          </motion.div>

          {/* Result indicator */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute bottom-4 flex items-center gap-2 ${
                  result.won ? "text-green-500" : "text-red-400"
                }`}
              >
                {result.won ? (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-bold">Won ${(betAmount * targetMultiplier).toFixed(2)}!</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-5 h-5" />
                    <span className="font-bold">Busted below {targetMultiplier}×</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Target line indicator */}
        <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-surface rounded-xl">
          <span className="text-sm text-muted-foreground">Target:</span>
          <span className="text-xl font-bold text-primary">{targetMultiplier.toFixed(2)}×</span>
          <span className="ml-auto text-sm text-muted-foreground">
            {winChance.toFixed(2)}% chance
          </span>
        </div>
      </div>

      {/* Target Slider */}
      <div className="w-full max-w-sm space-y-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Lower risk</span>
          <span>Higher reward</span>
        </div>
        <input
          type="range"
          min="1.01"
          max="100"
          step="0.01"
          value={targetMultiplier}
          onChange={(e) => setTargetMultiplier(parseFloat(e.target.value))}
          disabled={isPlaying}
          className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
        />
        
        {/* Preset buttons */}
        <div className="flex gap-2 flex-wrap justify-center">
          {presetTargets.map((target) => (
            <motion.button
              key={target}
              onClick={() => setTargetMultiplier(target)}
              disabled={isPlaying}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                targetMultiplier === target 
                  ? "bg-primary text-white" 
                  : "bg-surface-elevated hover:bg-surface-hover text-foreground"
              } disabled:opacity-50`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {target}×
            </motion.button>
          ))}
        </div>
      </div>

      {/* Payout Info */}
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Potential Win</p>
          <p className="text-lg font-bold text-primary">
            ${(betAmount * targetMultiplier).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Win Chance</p>
          <p className="text-lg font-bold">{winChance.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Multiplier</p>
          <p className="text-lg font-bold text-primary">{targetMultiplier.toFixed(2)}×</p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        <BetControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={isPlaying}
        />

        <motion.button
          onClick={play}
          disabled={isPlaying || betAmount > balance}
          className="w-full py-4 rounded-xl font-bold text-lg bg-primary hover:bg-primary-hover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/25"
          whileHover={{ scale: isPlaying ? 1 : 1.02 }}
          whileTap={{ scale: isPlaying ? 1 : 0.98 }}
        >
          {isPlaying ? "Playing..." : "BET"}
        </motion.button>
      </div>
    </div>
  );
};

export default LimboGame;
