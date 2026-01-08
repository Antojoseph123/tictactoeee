import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';
import { Slider } from '@/components/ui/slider';

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
        }

        setRolling(false);
      }
    }, rollDuration / intervals);
  }, [betAmount, target, rollOver, multiplier, onBet, onWin]);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-1 sm:mb-2">Dice</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Roll {rollOver ? 'over' : 'under'} {target.toFixed(2)} to win</p>
      </div>

      {/* History */}
      <div className="flex gap-1 flex-wrap justify-center">
        {history.map((h, i) => (
          <span
            key={i}
            className={`w-8 h-8 text-xs rounded-full font-medium flex items-center justify-center ${
              h.won ? 'bg-casino-win/20 indicator-win' : 'bg-destructive/20 indicator-loss'
            }`}
          >
            {h.result.toFixed(0)}
          </span>
        ))}
      </div>

      {/* Result Display */}
      <div className="relative w-full max-w-xs sm:max-w-md px-2">
        <div className="h-16 sm:h-20 bg-muted/30 rounded-xl flex items-center justify-center relative overflow-hidden border border-border">
          <div 
            className={`absolute inset-y-0 ${rollOver ? 'right-0' : 'left-0'} bg-primary/20`}
            style={{ width: `${rollOver ? 100 - target : target}%` }}
          />
          <motion.span
            className={`text-3xl sm:text-4xl font-bold z-10 ${
              won === null ? 'text-foreground' :
              won ? 'indicator-win' : 'indicator-loss'
            }`}
            animate={rolling ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: rolling ? Infinity : 0, duration: 0.1 }}
          >
            {result !== null ? result.toFixed(2) : '??.??'}
          </motion.span>
        </div>

        {/* Target Indicator */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-secondary"
          style={{ left: `${target}%` }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded">
            {target.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Target Slider */}
      <div className="w-full max-w-xs sm:max-w-md space-y-3 sm:space-y-4 px-2">
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
            <span className="font-medium text-foreground">{winChance.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Multiplier: </span>
            <span className="font-medium indicator-win">{multiplier.toFixed(2)}x</span>
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
          className="w-full h-12 font-semibold bg-primary hover:bg-primary-glow"
        >
          {rolling ? 'Rolling...' : `Roll (${multiplier.toFixed(2)}x)`}
        </Button>
      </div>
    </div>
  );
};
