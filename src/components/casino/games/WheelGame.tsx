import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { BetControls } from "@/components/casino/BetControls";
import { GameHistoryEntry } from "@/hooks/useGameHistory";

interface WheelGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
  onGameComplete?: (entry: GameHistoryEntry) => Promise<unknown>;
  gameType: string;
}

interface WheelSegment {
  multiplier: number;
  color: string;
  probability: number;
}

const SEGMENTS: WheelSegment[] = [
  { multiplier: 0, color: "bg-gray-700", probability: 0.25 },
  { multiplier: 1.2, color: "bg-blue-600", probability: 0.20 },
  { multiplier: 1.5, color: "bg-green-600", probability: 0.18 },
  { multiplier: 2, color: "bg-yellow-500", probability: 0.15 },
  { multiplier: 3, color: "bg-orange-500", probability: 0.10 },
  { multiplier: 5, color: "bg-red-500", probability: 0.07 },
  { multiplier: 10, color: "bg-purple-500", probability: 0.04 },
  { multiplier: 50, color: "bg-primary", probability: 0.01 },
];

// Create wheel layout (repeating segments)
const WHEEL_LAYOUT = [
  0, 1.2, 1.5, 0, 2, 1.2, 3, 0, 1.5, 5, 1.2, 0, 2, 1.5, 0, 10, 1.2, 3, 0, 1.5, 2, 0, 5, 1.2, 50, 0, 1.5, 3, 1.2, 0, 2, 1.5
];

const getSegmentColor = (multiplier: number): string => {
  const segment = SEGMENTS.find(s => s.multiplier === multiplier);
  return segment?.color || "bg-gray-700";
};

export const WheelGame = ({ balance, onBet, onWin, onGameComplete, gameType }: WheelGameProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ multiplier: number; winAmount: number } | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const rotationRef = useRef(rotation);

  const getWeightedResult = (): number => {
    const random = Math.random();
    let cumulative = 0;
    for (const segment of SEGMENTS) {
      cumulative += segment.probability;
      if (random <= cumulative) {
        return segment.multiplier;
      }
    }
    return 0;
  };

  const spin = useCallback(async () => {
    if (isSpinning || betAmount > balance) return;

    const success = await onBet(betAmount);
    if (!success) return;

    setIsSpinning(true);
    setResult(null);

    // Get weighted result
    const resultMultiplier = getWeightedResult();
    
    // Find index of result in wheel layout
    const resultIndices = WHEEL_LAYOUT.map((m, i) => m === resultMultiplier ? i : -1).filter(i => i !== -1);
    const targetIndex = resultIndices[Math.floor(Math.random() * resultIndices.length)];
    
    // Calculate rotation
    const segmentAngle = 360 / WHEEL_LAYOUT.length;
    const targetAngle = targetIndex * segmentAngle;
    const spins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const newRotation = rotationRef.current + (spins * 360) + (360 - targetAngle) + (segmentAngle / 2);
    
    rotationRef.current = newRotation;
    setRotation(newRotation);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 4000));

    const winAmount = betAmount * resultMultiplier;
    setResult({ multiplier: resultMultiplier, winAmount });
    setHistory(prev => [resultMultiplier, ...prev.slice(0, 9)]);

    if (winAmount > 0) {
      onWin(winAmount);
    }

    if (onGameComplete) {
      await onGameComplete({
        game_type: gameType,
        bet_amount: betAmount,
        multiplier: resultMultiplier,
        payout: winAmount,
        profit: winAmount - betAmount,
        result: resultMultiplier > 0 ? "win" : "loss",
        game_data: { resultMultiplier },
      });
    }

    setIsSpinning(false);
  }, [betAmount, balance, isSpinning, onBet, onWin, onGameComplete, gameType]);

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Wheel of Fortune</h2>
        <p className="text-sm text-muted-foreground">Spin to win up to 50×!</p>
      </div>

      {/* History */}
      <div className="flex gap-1 flex-wrap justify-center">
        {history.map((h, i) => (
          <span
            key={i}
            className={`history-chip ${h > 0 ? "win" : "loss"}`}
          >
            {h > 0 ? `${h}×` : "0"}
          </span>
        ))}
      </div>

      {/* Wheel */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
        </div>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-border overflow-hidden shadow-2xl"
            style={{ rotate: rotation }}
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.15, 0.85, 0.35, 1] }}
          >
            {/* Wheel segments */}
            {WHEEL_LAYOUT.map((multiplier, index) => {
              const angle = (360 / WHEEL_LAYOUT.length) * index;
              const segmentAngle = 360 / WHEEL_LAYOUT.length;
              
              return (
                <div
                  key={index}
                  className={`absolute inset-0 ${getSegmentColor(multiplier)}`}
                  style={{
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((angle + segmentAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle + segmentAngle - 90) * Math.PI / 180)}%)`,
                  }}
                >
                  <div
                    className="absolute text-[8px] sm:text-[10px] font-bold text-white whitespace-nowrap"
                    style={{
                      left: '50%',
                      top: '12%',
                      transform: `rotate(${angle + segmentAngle / 2}deg) translateX(-50%)`,
                      transformOrigin: 'center bottom',
                    }}
                  >
                    {multiplier}×
                  </div>
                </div>
              );
            })}

            {/* Center circle */}
            <div className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface-elevated border-2 border-border flex items-center justify-center shadow-inner">
              <span className="text-sm font-black text-primary">P</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {result.multiplier > 0 ? (
            <>
              <p className={`text-3xl font-bold ${result.multiplier >= 5 ? "text-primary" : "text-green-500"}`}>
                {result.multiplier}× 🎉
              </p>
              <p className="text-lg text-muted-foreground">
                Won ${result.winAmount.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-xl text-red-400">Better luck next time!</p>
          )}
        </motion.div>
      )}

      {/* Multiplier Legend */}
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {SEGMENTS.map((seg) => (
          <div
            key={seg.multiplier}
            className={`px-2 py-1 rounded text-xs font-bold text-white ${seg.color}`}
          >
            {seg.multiplier}×
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        <BetControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={isSpinning}
        />

        <motion.button
          onClick={spin}
          disabled={isSpinning || betAmount > balance}
          className="w-full py-4 rounded-xl font-bold text-lg bg-primary hover:bg-primary-hover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/25"
          whileHover={{ scale: isSpinning ? 1 : 1.02 }}
          whileTap={{ scale: isSpinning ? 1 : 0.98 }}
        >
          {isSpinning ? "Spinning..." : "SPIN THE WHEEL"}
        </motion.button>
      </div>
    </div>
  );
};

export default WheelGame;
