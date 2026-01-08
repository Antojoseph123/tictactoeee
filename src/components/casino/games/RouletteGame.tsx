import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';

type BetType = 'red' | 'black' | 'green' | 'odd' | 'even' | 'low' | 'high' | number;

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

interface RouletteGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

export const RouletteGame = ({ balance, onBet, onWin }: RouletteGameProps) => {
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [betAmount, setBetAmount] = useState(5);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const spin = useCallback(async () => {
    if (!selectedBet || spinning) return;
    
    const success = await onBet(betAmount);
    if (!success) return;

    setSpinning(true);
    setWinAmount(null);

    const resultNum = Math.floor(Math.random() * 37);
    const resultIndex = WHEEL_NUMBERS.indexOf(resultNum);
    const segmentAngle = 360 / 37;
    const targetAngle = rotation + 1440 + (360 - resultIndex * segmentAngle);

    setRotation(targetAngle);

    setTimeout(() => {
      setResult(resultNum);

      let won = false;
      let multiplier = 0;
      const color = getNumberColor(resultNum);

      if (typeof selectedBet === 'number' && selectedBet === resultNum) {
        won = true;
        multiplier = 35;
      } else if (selectedBet === 'red' && color === 'red') {
        won = true;
        multiplier = 2;
      } else if (selectedBet === 'black' && color === 'black') {
        won = true;
        multiplier = 2;
      } else if (selectedBet === 'green' && color === 'green') {
        won = true;
        multiplier = 35;
      } else if (selectedBet === 'odd' && resultNum !== 0 && resultNum % 2 === 1) {
        won = true;
        multiplier = 2;
      } else if (selectedBet === 'even' && resultNum !== 0 && resultNum % 2 === 0) {
        won = true;
        multiplier = 2;
      } else if (selectedBet === 'low' && resultNum >= 1 && resultNum <= 18) {
        won = true;
        multiplier = 2;
      } else if (selectedBet === 'high' && resultNum >= 19 && resultNum <= 36) {
        won = true;
        multiplier = 2;
      }

      if (won) {
        const winnings = betAmount * multiplier;
        setWinAmount(winnings);
        onWin(winnings);
      }

      setSpinning(false);
    }, 4000);
  }, [selectedBet, spinning, betAmount, rotation, onBet, onWin]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Roulette</h2>
        <p className="text-sm text-muted-foreground">Pick your bet and spin</p>
      </div>

      {/* Wheel */}
      <div className="relative w-64 h-64">
        <motion.div
          className="w-full h-full rounded-full border-4 border-secondary bg-muted flex items-center justify-center shadow-lg"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {WHEEL_NUMBERS.map((num, i) => {
            const angle = (i * 360) / 37 - 90;
            const color = getNumberColor(num);
            return (
              <div
                key={num}
                className="absolute text-xs font-medium text-white"
                style={{
                  transform: `rotate(${angle}deg) translateX(100px) rotate(90deg)`,
                }}
              >
                <span className={`px-1 rounded ${
                  color === 'red' ? 'bg-red-600' : 
                  color === 'black' ? 'bg-gray-900' : 
                  'bg-green-600'
                }`}>
                  {num}
                </span>
              </div>
            );
          })}
        </motion.div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card shadow-inner flex items-center justify-center border border-border">
          <span className="text-foreground font-bold">{result ?? '?'}</span>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
          <div className="w-3 h-3 bg-foreground rounded-full" />
        </div>
      </div>

      {/* Result Display */}
      <AnimatePresence>
        {result !== null && !spinning && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <span className={`text-3xl font-bold ${
              getNumberColor(result) === 'red' ? 'text-red-500' :
              getNumberColor(result) === 'green' ? 'text-green-500' :
              'text-gray-400'
            }`}>
              {result}
            </span>
            {winAmount && (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="indicator-win font-bold"
              >
                Won ${winAmount.toFixed(2)}!
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Betting Options */}
      <div className="w-full max-w-md space-y-3">
        <p className="text-sm text-muted-foreground">Select bet:</p>
        
        <div className="flex gap-2 justify-center">
          <Button
            variant={selectedBet === 'red' ? 'default' : 'outline'}
            onClick={() => setSelectedBet('red')}
            disabled={spinning}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            Red (2x)
          </Button>
          <Button
            variant={selectedBet === 'black' ? 'default' : 'outline'}
            onClick={() => setSelectedBet('black')}
            disabled={spinning}
            className="bg-gray-900 hover:bg-gray-800 text-white border-gray-900"
          >
            Black (2x)
          </Button>
          <Button
            variant={selectedBet === 'green' ? 'default' : 'outline'}
            onClick={() => setSelectedBet('green')}
            disabled={spinning}
            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            0 (35x)
          </Button>
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            variant={selectedBet === 'odd' ? 'default' : 'outline'}
            onClick={() => setSelectedBet('odd')}
            disabled={spinning}
            size="sm"
          >
            Odd
          </Button>
          <Button
            variant={selectedBet === 'even' ? 'default' : 'outline'}
            onClick={() => setSelectedBet('even')}
            disabled={spinning}
            size="sm"
          >
            Even
          </Button>
          <Button
            variant={selectedBet === 'low' ? 'default' : 'outline'}
            onClick={() => setSelectedBet('low')}
            disabled={spinning}
            size="sm"
          >
            1-18
          </Button>
          <Button
            variant={selectedBet === 'high' ? 'default' : 'outline'}
            onClick={() => setSelectedBet('high')}
            disabled={spinning}
            size="sm"
          >
            19-36
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        <BetControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={spinning}
        />

        <Button
          onClick={spin}
          disabled={spinning || !selectedBet || betAmount > balance}
          className="w-full h-12 font-semibold bg-primary hover:bg-primary-glow"
        >
          {spinning ? 'Spinning...' : `Spin ($${betAmount})`}
        </Button>
      </div>
    </div>
  );
};
