import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';
import { soundManager } from '@/utils/sounds';

interface CrashGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

export const CrashGame = ({ balance, onBet, onWin }: CrashGameProps) => {
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<'waiting' | 'running' | 'crashed'>('waiting');
  const [betAmount, setBetAmount] = useState(5);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashOutMultiplier, setCashOutMultiplier] = useState<number | null>(null);
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateCrashPoint = () => {
    // House edge of ~3%
    const r = Math.random();
    if (r < 0.03) return 1.0; // Instant crash 3%
    return Math.max(1.0, Math.floor((100 / (r * 97)) * 100) / 100);
  };

  const startGame = useCallback(async () => {
    const success = await onBet(betAmount);
    if (!success) return;

    setHasBet(true);
    setCashedOut(false);
    setCashOutMultiplier(null);
    setMultiplier(1.0);
    setGameState('running');
    soundManager.playClick();

    const crash = generateCrashPoint();
    setCrashPoint(crash);

    intervalRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = Math.round((prev + 0.01) * 100) / 100;
        if (next >= crash) {
          clearInterval(intervalRef.current!);
          setGameState('crashed');
          setHistory(h => [crash, ...h.slice(0, 9)]);
          return crash;
        }
        return next;
      });
    }, 50);
  }, [betAmount, onBet]);

  const cashOut = useCallback(() => {
    if (gameState !== 'running' || cashedOut) return;

    clearInterval(intervalRef.current!);
    setCashedOut(true);
    setCashOutMultiplier(multiplier);
    
    const winnings = betAmount * multiplier;
    onWin(winnings);
    soundManager.playWin();
  }, [gameState, cashedOut, multiplier, betAmount, onWin]);

  const resetGame = () => {
    setGameState('waiting');
    setHasBet(false);
    setMultiplier(1.0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">📈 Crash</h2>
        <p className="text-sm text-muted-foreground">Cash out before it crashes!</p>
      </div>

      {/* History */}
      <div className="flex gap-2 flex-wrap justify-center">
        {history.map((crash, i) => (
          <span
            key={i}
            className={`px-2 py-1 text-xs rounded-full font-bold ${
              crash < 2 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
            }`}
          >
            {crash.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Crash Display */}
      <div className="relative w-full max-w-md h-48 bg-gradient-to-b from-background to-muted/30 rounded-2xl border border-border overflow-hidden">
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/20 to-transparent"
          animate={{
            height: gameState === 'crashed' ? '0%' : `${Math.min(multiplier * 10, 100)}%`
          }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`text-6xl font-bold ${
              gameState === 'crashed' ? 'text-red-500' : 
              cashedOut ? 'text-green-500' : 
              'text-foreground'
            }`}
            animate={gameState === 'crashed' ? { scale: [1, 1.2, 1] } : {}}
          >
            {multiplier.toFixed(2)}x
          </motion.span>
        </div>

        {gameState === 'crashed' && !cashedOut && hasBet && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 text-white font-bold rounded-full"
          >
            CRASHED!
          </motion.div>
        )}

        {cashedOut && cashOutMultiplier && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500 text-white font-bold rounded-full"
          >
            Cashed out at {cashOutMultiplier.toFixed(2)}x! +${(betAmount * cashOutMultiplier).toFixed(2)}
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        {gameState === 'waiting' && (
          <>
            <BetControls
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              balance={balance}
            />
            <Button
              onClick={startGame}
              disabled={betAmount > balance}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              Start (${betAmount})
            </Button>
          </>
        )}

        {gameState === 'running' && !cashedOut && (
          <Button
            onClick={cashOut}
            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            Cash Out (${(betAmount * multiplier).toFixed(2)})
          </Button>
        )}

        {(gameState === 'crashed' || cashedOut) && (
          <Button
            onClick={resetGame}
            className="w-full h-12 font-bold"
          >
            Play Again
          </Button>
        )}
      </div>
    </div>
  );
};
