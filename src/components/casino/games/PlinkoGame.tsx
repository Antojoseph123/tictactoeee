import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';

interface PlinkoGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

const ROWS = 12;
const MULTIPLIERS = [10, 3, 1.5, 1.2, 1, 0.5, 0.3, 0.5, 1, 1.2, 1.5, 3, 10];

export const PlinkoGame = ({ balance, onBet, onWin }: PlinkoGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [balls, setBalls] = useState<{ id: number; path: number[]; landed: boolean; multiplier: number }[]>([]);
  const [isDropping, setIsDropping] = useState(false);
  const ballIdRef = useRef(0);

  const generatePath = () => {
    const path: number[] = [6]; // Start center
    let pos = 6;
    for (let i = 0; i < ROWS; i++) {
      pos += Math.random() < 0.5 ? -0.5 : 0.5;
      pos = Math.max(0, Math.min(12, pos));
      path.push(pos);
    }
    return path;
  };

  const dropBall = useCallback(async () => {
    const success = await onBet(betAmount);
    if (!success) return;

    setIsDropping(true);
    const id = ballIdRef.current++;
    const path = generatePath();
    const finalPos = Math.round(path[path.length - 1]);
    const multiplier = MULTIPLIERS[finalPos] || 1;

    setBalls(prev => [...prev, { id, path, landed: false, multiplier }]);

    // Ball lands after animation
    setTimeout(() => {
      setBalls(prev => prev.map(b => b.id === id ? { ...b, landed: true } : b));
      onWin(betAmount * multiplier);
      setIsDropping(false);

      // Remove ball after a moment
      setTimeout(() => {
        setBalls(prev => prev.filter(b => b.id !== id));
      }, 2000);
    }, 2500);
  }, [betAmount, onBet, onWin]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Plinko</h2>
        <p className="text-sm text-muted-foreground">Drop the ball and watch it bounce</p>
      </div>

      {/* Plinko Board */}
      <div className="relative w-full max-w-md aspect-[4/5] bg-muted/30 rounded-xl border border-border overflow-hidden">
        {/* Pegs */}
        {Array.from({ length: ROWS }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="absolute flex justify-center gap-6"
            style={{
              top: `${(rowIndex + 1) * (100 / (ROWS + 2))}%`,
              left: 0,
              right: 0,
            }}
          >
            {Array.from({ length: rowIndex + 3 }).map((_, pegIndex) => (
              <div
                key={pegIndex}
                className="w-2 h-2 rounded-full bg-border"
              />
            ))}
          </div>
        ))}

        {/* Multiplier slots */}
        <div className="absolute bottom-0 left-0 right-0 flex">
          {MULTIPLIERS.map((mult, i) => (
            <div
              key={i}
              className={`flex-1 py-2 text-center text-xs font-medium ${
                mult >= 3 ? 'bg-primary/20 text-primary' :
                mult >= 1 ? 'bg-secondary/20 text-secondary' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {mult}x
            </div>
          ))}
        </div>

        {/* Balls */}
        {balls.map((ball) => (
          <motion.div
            key={ball.id}
            className="absolute w-4 h-4 rounded-full bg-primary shadow-lg"
            initial={{ top: 0, left: '50%', x: '-50%' }}
            animate={{
              top: ball.landed ? '85%' : ['0%', '92%'],
              left: `${(ball.path[ball.path.length - 1] / 12) * 100}%`,
            }}
            transition={{
              duration: 2.5,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        ))}
      </div>

      {/* Last win */}
      {balls.filter(b => b.landed).slice(-1).map(b => (
        <p key={b.id} className={`text-lg font-semibold ${b.multiplier >= 1 ? 'indicator-win' : 'indicator-loss'}`}>
          {b.multiplier}x → ${(betAmount * b.multiplier).toFixed(2)}
        </p>
      ))}

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        <BetControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={isDropping}
        />

        <Button
          onClick={dropBall}
          disabled={isDropping || betAmount > balance}
          className="w-full h-12 font-semibold bg-primary hover:bg-primary-glow"
        >
          {isDropping ? 'Dropping...' : `Drop Ball ($${betAmount})`}
        </Button>
      </div>
    </div>
  );
};
