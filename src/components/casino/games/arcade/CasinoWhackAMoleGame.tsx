import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { BetControls } from '../../BetControls';

interface CasinoWhackAMoleGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

const GAME_DURATION = 30;
const GRID_SIZE = 9;

const getMultiplier = (score: number): number => {
  if (score >= 400) return 10;
  if (score >= 300) return 5;
  if (score >= 200) return 3;
  if (score >= 100) return 1.5;
  if (score >= 50) return 1;
  return 0;
};

interface Mole {
  id: number;
  isUp: boolean;
  isHit: boolean;
  isGolden: boolean;
}

export function CasinoWhackAMoleGame({ balance, onBet, onWin }: CasinoWhackAMoleGameProps) {
  const [moles, setMoles] = useState<Mole[]>(
    Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      isUp: false,
      isHit: false,
      isGolden: false,
    }))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [combo, setCombo] = useState(0);
  const [betAmount, setBetAmount] = useState(5);
  const [hasBet, setHasBet] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  
  const moleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const spawnMole = useCallback(() => {
    setMoles(prev => {
      const availableHoles = prev.filter(m => !m.isUp && !m.isHit);
      if (availableHoles.length === 0) return prev;
      
      const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      const isGolden = Math.random() < 0.1;
      
      return prev.map(m => 
        m.id === randomHole.id 
          ? { ...m, isUp: true, isHit: false, isGolden }
          : m
      );
    });

    const stayTime = 700 + Math.random() * 800;
    setTimeout(() => {
      setMoles(prev => prev.map(m => 
        m.isUp && !m.isHit ? { ...m, isUp: false } : m
      ));
    }, stayTime);
  }, []);

  const startGame = async () => {
    const success = await onBet(betAmount);
    if (!success) return;
    
    setHasBet(true);
    setMoles(Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      isUp: false,
      isHit: false,
      isGolden: false,
    })));
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setCombo(0);
    setWinAmount(0);
    setGameOver(false);
    setIsPlaying(true);

    moleIntervalRef.current = setInterval(spawnMole, 500);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (moleIntervalRef.current) clearInterval(moleIntervalRef.current);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setIsPlaying(false);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (moleIntervalRef.current) clearInterval(moleIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameOver && hasBet) {
      const multiplier = getMultiplier(score);
      const payout = Math.floor(betAmount * multiplier);
      setWinAmount(payout);
      
      if (payout > 0) {
        onWin(payout);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  }, [gameOver, hasBet, score, betAmount, onWin]);

  const resetGame = () => {
    setHasBet(false);
    setGameOver(false);
    setScore(0);
    setWinAmount(0);
  };

  const whackMole = useCallback((id: number) => {
    if (!isPlaying) return;

    setMoles(prev => {
      const mole = prev.find(m => m.id === id);
      if (!mole?.isUp || mole.isHit) {
        setCombo(0);
        return prev;
      }

      const basePoints = mole.isGolden ? 50 : 10;
      const comboMultiplier = 1 + combo * 0.1;
      const points = Math.floor(basePoints * comboMultiplier);
      
      setScore(s => s + points);
      setCombo(c => c + 1);

      return prev.map(m =>
        m.id === id ? { ...m, isHit: true } : m
      );
    });

    setTimeout(() => {
      setMoles(prev => prev.map(m =>
        m.id === id ? { ...m, isUp: false, isHit: false } : m
      ));
    }, 200);
  }, [isPlaying, combo]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold">🔨 Casino Whack-a-Mole</h3>
        <p className="text-sm text-muted-foreground">Whack moles to win big!</p>
      </div>

      {/* Payout Table */}
      <div className="grid grid-cols-5 gap-2 text-xs text-center mb-2">
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">50+</div>
          <div className="text-muted-foreground">1x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">100+</div>
          <div className="text-muted-foreground">1.5x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">200+</div>
          <div className="text-muted-foreground">3x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">300+</div>
          <div className="text-muted-foreground">5x</div>
        </div>
        <div className="p-2 bg-primary/20 rounded border border-primary">
          <div className="font-bold">400+</div>
          <div className="text-primary">10x</div>
        </div>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-3xl font-bold text-primary">{score}</p>
        </div>
        <div className="text-center flex items-center gap-2">
          <Timer className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Time</p>
            <p className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-foreground'}`}>
              {timeLeft}s
            </p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Potential</p>
          <p className="text-xl font-bold text-green-500">${Math.floor(betAmount * getMultiplier(score))}</p>
        </div>
      </div>

      {/* Combo Display */}
      <AnimatePresence>
        {combo > 1 && isPlaying && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-xl font-bold text-primary"
          >
            {combo}x Combo! 🔥
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <div 
        className="relative grid grid-cols-3 gap-3 p-4 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #4a7c59 0%, #2d5a3d 100%)',
          boxShadow: '0 0 60px rgba(74, 124, 89, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {moles.map((mole) => (
          <div
            key={mole.id}
            className="relative w-20 h-20 md:w-24 md:h-24 cursor-pointer"
            onClick={() => whackMole(mole.id)}
            onTouchStart={() => whackMole(mole.id)}
          >
            <div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-8 md:w-20 md:h-10 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)',
                boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.8)',
              }}
            />
            
            <AnimatePresence>
              {mole.isUp && (
                <motion.div
                  initial={{ y: 30, scale: 0.8 }}
                  animate={{ 
                    y: mole.isHit ? 15 : 0, 
                    scale: mole.isHit ? 0.9 : 1,
                    rotate: mole.isHit ? [0, -10, 10, 0] : 0,
                  }}
                  exit={{ y: 30, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2"
                >
                  <div 
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-t-full relative ${
                      mole.isGolden ? 'bg-gradient-to-b from-yellow-400 to-yellow-600' : 'bg-gradient-to-b from-amber-700 to-amber-900'
                    }`}
                    style={{
                      boxShadow: mole.isGolden 
                        ? '0 0 20px rgba(250, 204, 21, 0.8)' 
                        : '0 0 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div className="absolute top-3 left-2 w-2.5 h-2.5 bg-white rounded-full">
                      <div className={`absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-black rounded-full ${mole.isHit ? 'opacity-0' : ''}`} />
                      {mole.isHit && <div className="absolute inset-0 flex items-center justify-center text-[8px]">✕</div>}
                    </div>
                    <div className="absolute top-3 right-2 w-2.5 h-2.5 bg-white rounded-full">
                      <div className={`absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-black rounded-full ${mole.isHit ? 'opacity-0' : ''}`} />
                      {mole.isHit && <div className="absolute inset-0 flex items-center justify-center text-[8px]">✕</div>}
                    </div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3 h-2 bg-pink-400 rounded-full" />
                    {mole.isGolden && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-base">👑</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {mole.isHit && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl"
                >
                  💥
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4"
            >
              <h2 className="text-2xl font-bold text-foreground">Time's Up!</h2>
              <p className="text-lg text-muted-foreground">Score: {score}</p>
              {winAmount > 0 ? (
                <motion.p 
                  className="text-xl font-bold text-green-500"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  Won ${winAmount}! 🎉
                </motion.p>
              ) : (
                <p className="text-base text-red-500">No win - Score 50+ to win</p>
              )}
              <Button onClick={resetGame} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Overlay */}
        {!isPlaying && !gameOver && !hasBet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 p-4"
          >
            <p className="text-sm text-yellow-500">Golden moles = 50 points! 👑</p>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      {!hasBet ? (
        <div className="space-y-4 w-full max-w-xs">
          <BetControls
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            balance={balance}
            minBet={1}
          />
          <Button onClick={startGame} size="lg" className="w-full gap-2" disabled={betAmount > balance}>
            <Play className="w-5 h-5" />
            Start Game (${betAmount})
          </Button>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Click or tap to whack! Build combos for bonus points!
      </p>
    </div>
  );
}
