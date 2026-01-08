import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';
import { soundManager } from '@/utils/sounds';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣', '⭐'];
const PAYOUTS: Record<string, number> = {
  '🍒🍒🍒': 5,
  '🍋🍋🍋': 8,
  '🍊🍊🍊': 10,
  '🍇🍇🍇': 15,
  '🔔🔔🔔': 20,
  '💎💎💎': 50,
  '7️⃣7️⃣7️⃣': 100,
  '⭐⭐⭐': 200,
};

interface SlotsGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

export const SlotsGame = ({ balance, onBet, onWin }: SlotsGameProps) => {
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(1);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);

  const spin = useCallback(async () => {
    if (spinning) return;
    
    const success = await onBet(betAmount);
    if (!success) return;

    setSpinning(true);
    setLastWin(null);
    soundManager.playClick();

    // Start all reels spinning
    setSpinningReels([true, true, true]);

    // Generate final results
    const results = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    ];

    // Stop reels one by one with delay
    setTimeout(() => {
      setReels(prev => [results[0], prev[1], prev[2]]);
      setSpinningReels(prev => [false, prev[1], prev[2]]);
      soundManager.playClick();
    }, 500);

    setTimeout(() => {
      setReels(prev => [prev[0], results[1], prev[2]]);
      setSpinningReels(prev => [prev[0], false, prev[2]]);
      soundManager.playClick();
    }, 1000);

    setTimeout(() => {
      setReels(results);
      setSpinningReels([false, false, false]);
      soundManager.playClick();

      // Check for win
      const combo = results.join('');
      const multiplier = PAYOUTS[combo];
      
      if (multiplier) {
        const winAmount = betAmount * multiplier;
        setLastWin(winAmount);
        onWin(winAmount);
        soundManager.playWin();
      }

      setSpinning(false);
    }, 1500);
  }, [spinning, betAmount, onBet, onWin]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">🎰 Slots</h2>
        <p className="text-sm text-muted-foreground">Match 3 symbols to win!</p>
      </div>

      {/* Slot Machine */}
      <div className="relative p-6 bg-gradient-to-b from-yellow-900/30 to-amber-900/30 rounded-2xl border-4 border-yellow-600/50">
        <div className="flex gap-2">
          {reels.map((symbol, index) => (
            <div 
              key={index}
              className="w-20 h-24 bg-background rounded-lg border-2 border-border flex items-center justify-center overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {spinningReels[index] ? (
                  <motion.div
                    key="spinning"
                    className="text-4xl"
                    initial={{ y: -100 }}
                    animate={{ y: 100 }}
                    transition={{ duration: 0.1, repeat: Infinity }}
                  >
                    {SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]}
                  </motion.div>
                ) : (
                  <motion.span
                    key={symbol}
                    className="text-4xl"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {symbol}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Win Display */}
        <AnimatePresence>
          {lastWin && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500 text-white font-bold rounded-full"
            >
              +${lastWin.toFixed(2)}
            </motion.div>
          )}
        </AnimatePresence>
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
          disabled={spinning || betAmount > balance}
          className="w-full h-12 text-lg font-bold bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
        >
          {spinning ? 'Spinning...' : `Spin ($${betAmount})`}
        </Button>
      </div>

      {/* Paytable */}
      <div className="w-full max-w-md">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Payouts</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(PAYOUTS).map(([combo, mult]) => (
            <div key={combo} className="flex justify-between px-3 py-1 bg-muted/50 rounded">
              <span>{combo}</span>
              <span className="font-bold text-green-500">{mult}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
