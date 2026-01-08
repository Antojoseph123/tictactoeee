import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';
import { Slider } from '@/components/ui/slider';
import { soundManager } from '@/utils/sounds';

interface DiceGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

export const DiceGame = ({ balance, onBet, onWin }: DiceGameProps) => {
  const [target, setTarget] = useState(50);
  const [rollOver, setRollOver] = useState(true);
  const [betAmount, setBetAmount] = useState(5);
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [won, setWon] = useState<boolean | null>(null);
  const [history, setHistory] = useState<{ result: number; won: boolean }[]>([]);

  const winChance = rollOver ? 100 - target : target;
  const multiplier = Math.max(1.01, Math.floor((99 / winChance) * 100) / 100);

  const roll = useCallback(async () => {
    const success = await onBet(betAmount);
    if (!success) return;

    setRolling(true);
    setResult(null);
    setWon(null);
    soundManager.playClick();

    // Animate rolling
    const rollDuration = 1000;
    const intervals = 15;
    let count = 0;

    const interval = setInterval(() => {
      setResult(Math.random() * 100);
      count++;
      if (count >= intervals) {
        clearInterval(interval);
        
        const finalResult = Math.random() * 100;
        setResult(finalResult);

        const isWin = rollOver 
          ? finalResult > target 
          : finalResult < target;
        
        setWon(isWin);
        setHistory(h => [{ result: finalResult, won: isWin }, ...h.slice(0, 9)]);

        if (isWin) {
          onWin(betAmount * multiplier);
          soundManager.playWin();
        }

        setRolling(false);
      }
    }, rollDuration / intervals);
  }, [betAmount, target, rollOver, multiplier, onBet, onWin]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">🎲 Dice</h2>
        <p className="text-sm text-muted-foreground">Roll {rollOver ? 'over' : 'under'} {target.toFixed(2)} to win!</p>
      </div>

      {/* History */}
      <div className="flex gap-1 flex-wrap justify-center">
        {history.map((h, i) => (
          <span
            key={i}
            className={`w-8 h-8 text-xs rounded-full font-bold flex items-center justify-center ${
              h.won ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
            }`}
          >
            {h.result.toFixed(0)}
          </span>
        ))}
      </div>

      {/* Result Display */}
      <div className="relative w-full max-w-md">
        <div className="h-20 bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
          <div 
            className={`absolute inset-y-0 ${rollOver ? 'right-0' : 'left-0'} bg-green-500/20`}
            style={{ width: `${rollOver ? 100 - target : target}%` }}
          />
          <motion.span
            className={`text-4xl font-bold z-10 ${
              won === null ? 'text-foreground' :
              won ? 'text-green-500' : 'text-red-500'
            }`}
            animate={rolling ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: rolling ? Infinity : 0, duration: 0.1 }}
          >
            {result !== null ? result.toFixed(2) : '??.??'}
          </motion.span>
        </div>

        {/* Target Indicator */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-yellow-500"
          style={{ left: `${target}%` }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded">
            {target.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Target Slider */}
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target</span>
          <div className="flex gap-2">
            <Button
              variant={!rollOver ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRollOver(false)}
              disabled={rolling}
            >
              Under
            </Button>
            <Button
              variant={rollOver ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRollOver(true)}
              disabled={rolling}
            >
              Over
            </Button>
          </div>
        </div>

        <Slider
          value={[target]}
          onValueChange={([v]) => setTarget(v)}
          min={1}
          max={99}
          step={1}
          disabled={rolling}
        />

        <div className="flex justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Win Chance: </span>
            <span className="font-bold text-foreground">{winChance.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Multiplier: </span>
            <span className="font-bold text-green-500">{multiplier.toFixed(2)}x</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        <BetControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={rolling}
        />

        <Button
          onClick={roll}
          disabled={rolling || betAmount > balance}
          className="w-full h-12 text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
        >
          {rolling ? 'Rolling...' : `Roll (${multiplier.toFixed(2)}x)`}
        </Button>
      </div>
    </div>
  );
};
