import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const GAME_DURATION = 30; // seconds
const GRID_SIZE = 9; // 3x3 grid

interface Mole {
  id: number;
  isUp: boolean;
  isHit: boolean;
  isGolden: boolean;
}

export function WhackAMoleGame() {
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
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [combo, setCombo] = useState(0);
  const [showHammer, setShowHammer] = useState<{ x: number; y: number } | null>(null);
  
  const moleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('whack-high-score');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const spawnMole = useCallback(() => {
    setMoles(prev => {
      const availableHoles = prev.filter(m => !m.isUp && !m.isHit);
      if (availableHoles.length === 0) return prev;
      
      const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      const isGolden = Math.random() < 0.1; // 10% chance for golden mole
      
      return prev.map(m => 
        m.id === randomHole.id 
          ? { ...m, isUp: true, isHit: false, isGolden }
          : m
      );
    });

    // Mole goes down after random time
    const stayTime = 800 + Math.random() * 1000;
    setTimeout(() => {
      setMoles(prev => prev.map(m => 
        m.isUp && !m.isHit ? { ...m, isUp: false } : m
      ));
    }, stayTime);
  }, []);

  const startGame = useCallback(() => {
    setMoles(Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      isUp: false,
      isHit: false,
      isGolden: false,
    })));
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setCombo(0);
    setGameOver(false);
    setIsPlaying(true);

    // Start spawning moles
    moleIntervalRef.current = setInterval(spawnMole, 600);

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Game over
          if (moleIntervalRef.current) clearInterval(moleIntervalRef.current);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setIsPlaying(false);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [spawnMole]);

  useEffect(() => {
    return () => {
      if (moleIntervalRef.current) clearInterval(moleIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('whack-high-score', score.toString());
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [gameOver, score, highScore]);

  const whackMole = useCallback((id: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying) return;

    // Show hammer effect
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setShowHammer({ x: x - rect.left, y: y - rect.top });
    setTimeout(() => setShowHammer(null), 200);

    setMoles(prev => {
      const mole = prev.find(m => m.id === id);
      if (!mole?.isUp || mole.isHit) {
        // Missed - reset combo
        setCombo(0);
        return prev;
      }

      // Hit!
      const basePoints = mole.isGolden ? 50 : 10;
      const comboMultiplier = 1 + combo * 0.1;
      const points = Math.floor(basePoints * comboMultiplier);
      
      setScore(s => s + points);
      setCombo(c => c + 1);

      return prev.map(m =>
        m.id === id ? { ...m, isHit: true } : m
      );
    });

    // Mole goes down after being hit
    setTimeout(() => {
      setMoles(prev => prev.map(m =>
        m.id === id ? { ...m, isUp: false, isHit: false } : m
      ));
    }, 200);
  }, [isPlaying, combo]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Score Display */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-4xl font-bold text-primary">{score}</p>
        </div>
        <div className="text-center flex items-center gap-2">
          <Timer className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Time</p>
            <p className={`text-3xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-foreground'}`}>
              {timeLeft}s
            </p>
          </div>
        </div>
        <div className="text-center flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-muted-foreground">Best</p>
            <p className="text-2xl font-bold text-yellow-500">{highScore}</p>
          </div>
        </div>
      </div>

      {/* Combo Display */}
      <AnimatePresence>
        {combo > 1 && isPlaying && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-2xl font-bold text-primary"
          >
            {combo}x Combo! 🔥
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <div 
        className="relative grid grid-cols-3 gap-4 p-6 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #4a7c59 0%, #2d5a3d 100%)',
          boxShadow: '0 0 60px rgba(74, 124, 89, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {moles.map((mole) => (
          <div
            key={mole.id}
            className="relative w-24 h-24 md:w-28 md:h-28 cursor-pointer"
            onClick={(e) => whackMole(mole.id, e)}
            onTouchStart={(e) => whackMole(mole.id, e)}
          >
            {/* Hole */}
            <div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 md:w-24 md:h-12 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)',
                boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.8)',
              }}
            />
            
            {/* Mole */}
            <AnimatePresence>
              {mole.isUp && (
                <motion.div
                  initial={{ y: 40, scale: 0.8 }}
                  animate={{ 
                    y: mole.isHit ? 20 : 0, 
                    scale: mole.isHit ? 0.9 : 1,
                    rotate: mole.isHit ? [0, -10, 10, 0] : 0,
                  }}
                  exit={{ y: 40, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2"
                >
                  {/* Mole body */}
                  <div 
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-t-full relative ${
                      mole.isGolden ? 'bg-gradient-to-b from-yellow-400 to-yellow-600' : 'bg-gradient-to-b from-amber-700 to-amber-900'
                    }`}
                    style={{
                      boxShadow: mole.isGolden 
                        ? '0 0 20px rgba(250, 204, 21, 0.8)' 
                        : '0 0 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* Eyes */}
                    <div className="absolute top-4 left-3 w-3 h-3 bg-white rounded-full">
                      <div className={`absolute top-0.5 left-0.5 w-2 h-2 bg-black rounded-full ${mole.isHit ? 'opacity-0' : ''}`} />
                      {mole.isHit && <div className="absolute inset-0 flex items-center justify-center text-xs">✕</div>}
                    </div>
                    <div className="absolute top-4 right-3 w-3 h-3 bg-white rounded-full">
                      <div className={`absolute top-0.5 left-0.5 w-2 h-2 bg-black rounded-full ${mole.isHit ? 'opacity-0' : ''}`} />
                      {mole.isHit && <div className="absolute inset-0 flex items-center justify-center text-xs">✕</div>}
                    </div>
                    
                    {/* Nose */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-4 h-3 bg-pink-400 rounded-full" />
                    
                    {/* Cheeks */}
                    <div className="absolute top-10 left-1 w-3 h-2 bg-pink-300 rounded-full opacity-60" />
                    <div className="absolute top-10 right-1 w-3 h-2 bg-pink-300 rounded-full opacity-60" />
                    
                    {/* Mouth */}
                    {mole.isHit ? (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs">😵</div>
                    ) : (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-amber-950 rounded-b-full" />
                    )}
                    
                    {/* Golden crown */}
                    {mole.isGolden && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl">👑</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hit effect */}
            <AnimatePresence>
              {mole.isHit && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl"
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
              <h2 className="text-3xl font-bold text-foreground">Time's Up!</h2>
              <p className="text-xl text-muted-foreground">Score: {score}</p>
              <Button onClick={startGame} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Overlay */}
        {!isPlaying && !gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4"
          >
            <h2 className="text-3xl font-bold text-foreground">Whack-a-Mole</h2>
            <p className="text-muted-foreground">Whack as many moles as you can!</p>
            <p className="text-sm text-yellow-500">Golden moles = 50 points! 👑</p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          </motion.div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Click or tap to whack! Build combos for bonus points!
      </p>
    </div>
  );
}
