import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BetControls } from '../BetControls';
import { Bomb, Gem } from 'lucide-react';

interface MinesGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

const GRID_SIZE = 25;

export const MinesGame = ({ balance, onBet, onWin }: MinesGameProps) => {
  const [mineCount, setMineCount] = useState(5);
  const [betAmount, setBetAmount] = useState(5);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'won' | 'lost'>('betting');
  const [mines, setMines] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);

  const calculateMultiplier = (safe: number, mineCount: number): number => {
    let mult = 1;
    for (let i = 0; i < safe; i++) {
      mult *= (GRID_SIZE - mineCount - i) / (GRID_SIZE - i);
    }
    return Math.max(1, Math.floor((0.97 / mult) * 100) / 100);
  };

  const startGame = useCallback(async () => {
    const success = await onBet(betAmount);
    if (!success) return;

    const minePositions: number[] = [];
    while (minePositions.length < mineCount) {
      const pos = Math.floor(Math.random() * GRID_SIZE);
      if (!minePositions.includes(pos)) {
        minePositions.push(pos);
      }
    }

    setMines(minePositions);
    setRevealed([]);
    setCurrentMultiplier(1);
    setGameState('playing');
  }, [betAmount, mineCount, onBet]);

  const revealTile = useCallback((index: number) => {
    if (gameState !== 'playing' || revealed.includes(index)) return;

    if (mines.includes(index)) {
      setRevealed([...revealed, index]);
      setGameState('lost');
      return;
    }

    const newRevealed = [...revealed, index];
    setRevealed(newRevealed);
    
    const newMult = calculateMultiplier(newRevealed.length, mineCount);
    setCurrentMultiplier(newMult);

    if (newRevealed.length === GRID_SIZE - mineCount) {
      setGameState('won');
      onWin(betAmount * newMult);
    }
  }, [gameState, revealed, mines, mineCount, betAmount, onWin]);

  const cashOut = useCallback(() => {
    if (gameState !== 'playing' || revealed.length === 0) return;

    const winnings = betAmount * currentMultiplier;
    onWin(winnings);
    setGameState('won');
  }, [gameState, revealed.length, betAmount, currentMultiplier, onWin]);

  const resetGame = () => {
    setGameState('betting');
    setMines([]);
    setRevealed([]);
    setCurrentMultiplier(1);
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-1 sm:mb-2">Mines</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Reveal gems, avoid mines</p>
      </div>

      {/* Multiplier Display */}
      {gameState === 'playing' && (
        <motion.div
          className="text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <p className="text-sm text-muted-foreground">Current Multiplier</p>
          <p className="text-3xl font-bold indicator-win">{currentMultiplier.toFixed(2)}x</p>
          <p className="text-sm text-muted-foreground">
            Potential: ${(betAmount * currentMultiplier).toFixed(2)}
          </p>
        </motion.div>
      )}

      {/* Game Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-3 sm:p-4 bg-muted/20 rounded-xl border border-border w-full max-w-xs sm:max-w-sm">
        {Array.from({ length: GRID_SIZE }).map((_, index) => {
          const isRevealed = revealed.includes(index);
          const isMine = mines.includes(index);
          const showMine = (gameState === 'lost' || gameState === 'won') && isMine;
          const showGem = isRevealed && !isMine;

          return (
            <motion.button
              key={index}
              onClick={() => revealTile(index)}
              disabled={gameState !== 'playing' || isRevealed}
              className={`aspect-square w-full rounded-lg flex items-center justify-center font-bold text-lg transition-all ${
                showMine
                  ? 'bg-destructive'
                  : showGem
                  ? 'bg-casino-win'
                  : 'bg-muted hover:bg-muted/80'
              } ${gameState === 'playing' && !isRevealed ? 'cursor-pointer' : 'cursor-default'}`}
              whileHover={gameState === 'playing' && !isRevealed ? { scale: 1.05 } : {}}
              whileTap={gameState === 'playing' && !isRevealed ? { scale: 0.95 } : {}}
            >
              <AnimatePresence>
                {showMine && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    <Bomb className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                )}
                {showGem && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    <Gem className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs space-y-4">
        {gameState === 'betting' && (
          <>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Mines: {mineCount}</label>
              <div className="flex gap-2 flex-wrap">
                {[3, 5, 10, 15, 20, 24].map(count => (
                  <Button
                    key={count}
                    variant={mineCount === count ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMineCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>

            <BetControls
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              balance={balance}
            />

            <Button
              onClick={startGame}
              disabled={betAmount > balance}
              className="w-full h-12 font-semibold bg-primary hover:bg-primary-glow"
            >
              Start (${betAmount})
            </Button>
          </>
        )}

        {gameState === 'playing' && (
          <Button
            onClick={cashOut}
            disabled={revealed.length === 0}
            className="w-full h-12 font-semibold bg-secondary hover:bg-secondary-glow"
          >
            Cash Out (${(betAmount * currentMultiplier).toFixed(2)})
          </Button>
        )}

        {(gameState === 'won' || gameState === 'lost') && (
          <div className="text-center space-y-4">
            <p className={`text-xl font-bold ${gameState === 'won' ? 'indicator-win' : 'indicator-loss'}`}>
              {gameState === 'won' 
                ? `Won $${(betAmount * currentMultiplier).toFixed(2)}!` 
                : 'Hit a mine!'}
            </p>
            <Button onClick={resetGame} className="w-full h-12 font-semibold">
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
