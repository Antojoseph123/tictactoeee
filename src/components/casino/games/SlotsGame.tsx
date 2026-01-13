import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "@/components/casino/BetControls";
import { GameHistoryEntry } from "@/hooks/useGameHistory";

interface SlotsGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
  onGameComplete?: (entry: GameHistoryEntry) => Promise<unknown>;
  gameType: string;
}

type Symbol = {
  id: string;
  emoji: string;
  multiplier: number;
};

const SYMBOLS: Symbol[] = [
  { id: "seven", emoji: "7️⃣", multiplier: 10 },
  { id: "diamond", emoji: "💎", multiplier: 8 },
  { id: "bell", emoji: "🔔", multiplier: 5 },
  { id: "cherry", emoji: "🍒", multiplier: 3 },
  { id: "lemon", emoji: "🍋", multiplier: 2 },
  { id: "bar", emoji: "🎰", multiplier: 4 },
];

const getRandomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

export const SlotsGame = ({ balance, onBet, onWin, onGameComplete, gameType }: SlotsGameProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [reels, setReels] = useState<Symbol[][]>([
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ win: boolean; amount: number; line?: string } | null>(null);
  const [spinHistory, setSpinHistory] = useState<{ win: boolean; amount: number }[]>([]);

  const checkWin = (finalReels: Symbol[][]): { win: boolean; amount: number; line?: string } => {
    // Check middle row (main payline)
    const middleRow = finalReels.map(reel => reel[1]);
    
    // All three match
    if (middleRow[0].id === middleRow[1].id && middleRow[1].id === middleRow[2].id) {
      return { win: true, amount: betAmount * middleRow[0].multiplier, line: "3 of a kind" };
    }
    
    // Two match (left pair)
    if (middleRow[0].id === middleRow[1].id) {
      return { win: true, amount: betAmount * 1.5, line: "2 match" };
    }
    
    // Two match (right pair)
    if (middleRow[1].id === middleRow[2].id) {
      return { win: true, amount: betAmount * 1.5, line: "2 match" };
    }

    // Check for 7s anywhere (bonus)
    const hasSevenInMiddle = middleRow.some(s => s.id === "seven");
    if (hasSevenInMiddle) {
      return { win: true, amount: betAmount * 1.2, line: "Lucky 7" };
    }

    return { win: false, amount: 0 };
  };

  const spin = useCallback(async () => {
    if (isSpinning || betAmount > balance) return;

    const success = await onBet(betAmount);
    if (!success) return;

    setIsSpinning(true);
    setResult(null);

    // Generate final symbols for each reel
    const finalReels: Symbol[][] = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    ];

    // Animate each reel with delay
    for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simulate spinning animation
      for (let spinCount = 0; spinCount < 8; spinCount++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setReels(prev => {
          const newReels = [...prev];
          newReels[reelIndex] = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
          return newReels;
        });
      }
      
      // Set final reel
      setReels(prev => {
        const newReels = [...prev];
        newReels[reelIndex] = finalReels[reelIndex];
        return newReels;
      });
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    const winResult = checkWin(finalReels);
    setResult(winResult);
    setSpinHistory(prev => [winResult, ...prev.slice(0, 9)]);

    if (winResult.win && winResult.amount > 0) {
      onWin(winResult.amount);
    }

    if (onGameComplete) {
      await onGameComplete({
        game_type: gameType,
        bet_amount: betAmount,
        multiplier: winResult.win ? winResult.amount / betAmount : 0,
        payout: winResult.amount,
        profit: winResult.amount - betAmount,
        result: winResult.win ? "win" : "loss",
        game_data: { 
          reels: finalReels.map(r => r.map(s => s.emoji)),
          line: winResult.line 
        },
      });
    }

    setIsSpinning(false);
  }, [betAmount, balance, isSpinning, onBet, onWin, onGameComplete, gameType]);

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Slots</h2>
        <p className="text-sm text-muted-foreground">Match symbols to win big!</p>
      </div>

      {/* History */}
      <div className="flex gap-1 flex-wrap justify-center">
        {spinHistory.slice(0, 10).map((h, i) => (
          <span
            key={i}
            className={`history-chip ${h.win ? "win" : "loss"}`}
          >
            {h.win ? `+$${h.amount.toFixed(0)}` : "-"}
          </span>
        ))}
      </div>

      {/* Slot Machine */}
      <div className="relative bg-gradient-to-b from-surface-elevated to-surface rounded-2xl p-4 border-2 border-primary/30 shadow-lg shadow-primary/10">
        {/* Decorative top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-xs font-bold text-white">
          PARADOX SLOTS
        </div>

        {/* Reels Container */}
        <div className="flex gap-2 p-4 bg-black/50 rounded-xl mt-2">
          {reels.map((reel, reelIndex) => (
            <div
              key={reelIndex}
              className="relative w-20 h-56 sm:w-24 sm:h-64 overflow-hidden rounded-lg bg-surface border border-border"
            >
              {/* Reel symbols */}
              <motion.div
                className="flex flex-col items-center justify-center h-full"
                animate={isSpinning ? { y: [0, -20, 0] } : {}}
                transition={{ duration: 0.1, repeat: isSpinning ? Infinity : 0 }}
              >
                {reel.map((symbol, symbolIndex) => (
                  <div
                    key={symbolIndex}
                    className={`flex-1 flex items-center justify-center text-3xl sm:text-4xl ${
                      symbolIndex === 1 ? "bg-primary/10" : ""
                    }`}
                  >
                    {symbol.emoji}
                  </div>
                ))}
              </motion.div>

              {/* Highlight middle row */}
              <div className="absolute top-1/2 left-0 right-0 h-16 sm:h-20 -translate-y-1/2 border-y-2 border-primary/50 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Payline indicator */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary rounded-r" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary rounded-l" />
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-center ${result.win ? "text-green-500" : "text-muted-foreground"}`}
          >
            {result.win ? (
              <>
                <p className="text-2xl font-bold">🎉 {result.line}!</p>
                <p className="text-lg">Won ${result.amount.toFixed(2)}</p>
              </>
            ) : (
              <p className="text-lg">No match - Try again!</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paytable */}
      <div className="w-full max-w-sm bg-surface-elevated rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-2 text-center font-medium">PAYTABLE</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {SYMBOLS.slice(0, 6).map((s) => (
            <div key={s.id} className="flex items-center justify-center gap-1.5 bg-surface rounded-lg p-1.5">
              <span className="text-lg">{s.emoji}</span>
              <span className="text-primary font-bold">×{s.multiplier}</span>
            </div>
          ))}
        </div>
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
          {isSpinning ? "Spinning..." : "SPIN"}
        </motion.button>
      </div>
    </div>
  );
};

export default SlotsGame;
