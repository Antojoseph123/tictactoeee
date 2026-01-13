import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "@/components/casino/BetControls";
import { GameHistoryEntry } from "@/hooks/useGameHistory";

interface KenoGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
  onGameComplete?: (entry: GameHistoryEntry) => Promise<unknown>;
  gameType: string;
}

// Payout table based on picks and matches
const PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 3.5 },
  2: { 2: 9 },
  3: { 2: 2, 3: 25 },
  4: { 2: 1.5, 3: 8, 4: 75 },
  5: { 3: 3, 4: 15, 5: 200 },
  6: { 3: 2, 4: 8, 5: 50, 6: 500 },
  7: { 3: 1.5, 4: 5, 5: 25, 6: 150, 7: 1000 },
  8: { 4: 3, 5: 12, 6: 75, 7: 400, 8: 2000 },
  9: { 4: 2, 5: 8, 6: 40, 7: 200, 8: 800, 9: 4000 },
  10: { 5: 5, 6: 25, 7: 100, 8: 500, 9: 2000, 10: 10000 },
};

const TOTAL_NUMBERS = 40;
const DRAW_COUNT = 10;
const MAX_PICKS = 10;

export const KenoGame = ({ balance, onBet, onWin, onGameComplete, gameType }: KenoGameProps) => {
  const [betAmount, setBetAmount] = useState(5);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gameState, setGameState] = useState<"picking" | "drawing" | "result">("picking");
  const [result, setResult] = useState<{ matches: number; payout: number } | null>(null);
  const [history, setHistory] = useState<{ matches: number; picks: number }[]>([]);

  const toggleNumber = (num: number) => {
    if (gameState !== "picking") return;
    
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else if (selectedNumbers.length < MAX_PICKS) {
      setSelectedNumbers(prev => [...prev, num]);
    }
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setResult(null);
    setGameState("picking");
  };

  const quickPick = () => {
    if (gameState !== "picking") return;
    const nums: number[] = [];
    while (nums.length < 5) {
      const n = Math.floor(Math.random() * TOTAL_NUMBERS) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    setSelectedNumbers(nums.sort((a, b) => a - b));
  };

  const play = useCallback(async () => {
    if (isDrawing || selectedNumbers.length === 0 || betAmount > balance) return;

    const success = await onBet(betAmount);
    if (!success) return;

    setIsDrawing(true);
    setGameState("drawing");
    setResult(null);
    setDrawnNumbers([]);

    // Draw numbers one by one
    const drawn: number[] = [];
    while (drawn.length < DRAW_COUNT) {
      const n = Math.floor(Math.random() * TOTAL_NUMBERS) + 1;
      if (!drawn.includes(n)) {
        drawn.push(n);
        setDrawnNumbers([...drawn]);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Calculate result
    const matches = selectedNumbers.filter(n => drawn.includes(n)).length;
    const picks = selectedNumbers.length;
    const payoutMultiplier = PAYOUTS[picks]?.[matches] || 0;
    const payout = betAmount * payoutMultiplier;

    setResult({ matches, payout });
    setHistory(prev => [{ matches, picks }, ...prev.slice(0, 9)]);
    setGameState("result");

    if (payout > 0) {
      onWin(payout);
    }

    if (onGameComplete) {
      await onGameComplete({
        game_type: gameType,
        bet_amount: betAmount,
        multiplier: payoutMultiplier,
        payout,
        profit: payout - betAmount,
        result: payout > 0 ? "win" : "loss",
        game_data: { selectedNumbers, drawnNumbers: drawn, matches },
      });
    }

    setIsDrawing(false);
  }, [selectedNumbers, betAmount, balance, isDrawing, onBet, onWin, onGameComplete, gameType]);

  const getNumberStatus = (num: number) => {
    const isSelected = selectedNumbers.includes(num);
    const isDrawn = drawnNumbers.includes(num);
    const isMatch = isSelected && isDrawn;

    if (isMatch) return "match";
    if (isDrawn) return "drawn";
    if (isSelected) return "selected";
    return "default";
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Keno</h2>
        <p className="text-sm text-muted-foreground">
          Pick up to {MAX_PICKS} numbers • {DRAW_COUNT} will be drawn
        </p>
      </div>

      {/* History */}
      <div className="flex gap-1 flex-wrap justify-center">
        {history.map((h, i) => (
          <span
            key={i}
            className={`history-chip ${h.matches > 0 ? "win" : "loss"}`}
          >
            {h.matches}/{h.picks}
          </span>
        ))}
      </div>

      {/* Selection Info */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          Selected: <span className="text-foreground font-bold">{selectedNumbers.length}/{MAX_PICKS}</span>
        </span>
        <button
          onClick={quickPick}
          disabled={gameState !== "picking"}
          className="px-3 py-1 text-xs font-medium bg-surface-elevated hover:bg-surface-hover rounded-lg disabled:opacity-50 transition-colors"
        >
          Quick Pick
        </button>
        <button
          onClick={clearSelection}
          className="px-3 py-1 text-xs font-medium bg-surface-elevated hover:bg-surface-hover rounded-lg transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Number Grid */}
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 sm:gap-2 w-full max-w-md">
        {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map((num) => {
          const status = getNumberStatus(num);
          return (
            <motion.button
              key={num}
              onClick={() => toggleNumber(num)}
              disabled={gameState !== "picking" && status === "default"}
              className={`
                aspect-square rounded-lg font-bold text-sm transition-all
                ${status === "match" 
                  ? "bg-green-500 text-white scale-110 ring-2 ring-green-400" 
                  : status === "drawn" 
                    ? "bg-primary/20 text-primary border border-primary/30" 
                    : status === "selected" 
                      ? "bg-primary text-white" 
                      : "bg-surface-elevated hover:bg-surface-hover text-foreground"
                }
                disabled:cursor-default
              `}
              whileHover={gameState === "picking" ? { scale: 1.05 } : {}}
              whileTap={gameState === "picking" ? { scale: 0.95 } : {}}
              animate={status === "match" ? { scale: [1, 1.2, 1] } : {}}
            >
              {num}
            </motion.button>
          );
        })}
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className={`text-2xl font-bold ${result.payout > 0 ? "text-green-500" : "text-muted-foreground"}`}>
              {result.matches} Match{result.matches !== 1 ? "es" : ""}!
            </p>
            {result.payout > 0 ? (
              <p className="text-lg">Won ${result.payout.toFixed(2)} 🎉</p>
            ) : (
              <p className="text-muted-foreground">No payout - Try again!</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payout Table */}
      {selectedNumbers.length > 0 && (
        <div className="w-full max-w-sm bg-surface-elevated rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-2 text-center font-medium">
            PAYOUTS FOR {selectedNumbers.length} PICKS
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {PAYOUTS[selectedNumbers.length] && Object.entries(PAYOUTS[selectedNumbers.length]).map(([matches, mult]) => (
              <div key={matches} className="px-2 py-1 bg-surface rounded-lg">
                <span className="text-muted-foreground">{matches} match:</span>{" "}
                <span className="text-primary font-bold">{mult}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        <BetControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={isDrawing}
        />

        <motion.button
          onClick={gameState === "result" ? clearSelection : play}
          disabled={isDrawing || (gameState === "picking" && selectedNumbers.length === 0) || betAmount > balance}
          className="w-full py-4 rounded-xl font-bold text-lg bg-primary hover:bg-primary-hover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/25"
          whileHover={{ scale: isDrawing ? 1 : 1.02 }}
          whileTap={{ scale: isDrawing ? 1 : 0.98 }}
        >
          {isDrawing 
            ? `Drawing... (${drawnNumbers.length}/${DRAW_COUNT})` 
            : gameState === "result" 
              ? "PLAY AGAIN" 
              : "DRAW"
          }
        </motion.button>
      </div>
    </div>
  );
};

export default KenoGame;
