import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { BetControls } from '../../BetControls';

interface CasinoSimonSaysGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

const COLORS = ['red', 'blue', 'green', 'yellow'] as const;
type Color = typeof COLORS[number];

const getMultiplier = (level: number): number => {
  if (level >= 15) return 15;
  if (level >= 12) return 8;
  if (level >= 9) return 4;
  if (level >= 6) return 2;
  if (level >= 3) return 1;
  return 0;
};

const TONES: Record<Color, number> = {
  red: 261.63,
  blue: 329.63,
  green: 392.00,
  yellow: 523.25,
};

export function CasinoSimonSaysGame({ balance, onBet, onWin }: CasinoSimonSaysGameProps) {
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [level, setLevel] = useState(0);
  const [betAmount, setBetAmount] = useState(5);
  const [hasBet, setHasBet] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((color: Color) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = TONES[color];
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Silently fail if audio isn't available
    }
  }, []);

  const showSequence = useCallback(async (seq: Color[]) => {
    setIsShowingSequence(true);
    setPlayerSequence([]);
    
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setActiveColor(seq[i]);
      playTone(seq[i]);
      await new Promise(resolve => setTimeout(resolve, 400));
      setActiveColor(null);
    }
    
    setIsShowingSequence(false);
  }, [playTone]);

  const startGame = async () => {
    const success = await onBet(betAmount);
    if (!success) return;
    
    setHasBet(true);
    const firstColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setSequence([firstColor]);
    setLevel(1);
    setGameOver(false);
    setWinAmount(0);
    setIsPlaying(true);
    
    setTimeout(() => showSequence([firstColor]), 500);
  };

  const handleColorClick = useCallback((color: Color) => {
    if (!isPlaying || isShowingSequence || gameOver) return;
    
    setActiveColor(color);
    playTone(color);
    setTimeout(() => setActiveColor(null), 200);
    
    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);
    
    const currentIndex = newPlayerSequence.length - 1;
    
    if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
      // Wrong color - game over
      setGameOver(true);
      setIsPlaying(false);
      
      const multiplier = getMultiplier(level);
      const payout = Math.floor(betAmount * multiplier);
      setWinAmount(payout);
      
      if (payout > 0) {
        onWin(payout);
        confetti({ particleCount: 50 + level * 10, spread: 60, origin: { y: 0.6 } });
      }
      return;
    }
    
    if (newPlayerSequence.length === sequence.length) {
      // Completed sequence
      const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const newSequence = [...sequence, newColor];
      setSequence(newSequence);
      setLevel(prev => prev + 1);
      
      setTimeout(() => showSequence(newSequence), 1000);
    }
  }, [isPlaying, isShowingSequence, gameOver, playerSequence, sequence, level, betAmount, onWin, playTone, showSequence]);

  const resetGame = () => {
    setHasBet(false);
    setGameOver(false);
    setSequence([]);
    setPlayerSequence([]);
    setLevel(0);
    setWinAmount(0);
  };

  const getColorStyle = (color: Color, isActive: boolean) => {
    const baseColors = {
      red: { bg: 'from-red-500 to-red-700', active: 'from-red-300 to-red-500', glow: 'rgba(239, 68, 68, 0.8)' },
      blue: { bg: 'from-blue-500 to-blue-700', active: 'from-blue-300 to-blue-500', glow: 'rgba(59, 130, 246, 0.8)' },
      green: { bg: 'from-green-500 to-green-700', active: 'from-green-300 to-green-500', glow: 'rgba(34, 197, 94, 0.8)' },
      yellow: { bg: 'from-yellow-400 to-yellow-600', active: 'from-yellow-200 to-yellow-400', glow: 'rgba(250, 204, 21, 0.8)' },
    };
    
    return {
      className: `bg-gradient-to-br ${isActive ? baseColors[color].active : baseColors[color].bg}`,
      style: isActive ? { boxShadow: `0 0 30px ${baseColors[color].glow}` } : {},
    };
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold">🎵 Casino Simon Says</h3>
        <p className="text-sm text-muted-foreground">Remember the pattern to win!</p>
      </div>

      {/* Payout Table */}
      <div className="grid grid-cols-5 gap-2 text-xs text-center mb-2">
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">Lvl 3</div>
          <div className="text-muted-foreground">1x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">Lvl 6</div>
          <div className="text-muted-foreground">2x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">Lvl 9</div>
          <div className="text-muted-foreground">4x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">Lvl 12</div>
          <div className="text-muted-foreground">8x</div>
        </div>
        <div className="p-2 bg-primary/20 rounded border border-primary">
          <div className="font-bold">Lvl 15</div>
          <div className="text-primary">15x</div>
        </div>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Level</p>
          <p className="text-3xl font-bold text-primary">{level}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Bet</p>
          <p className="text-xl font-bold text-foreground">${betAmount}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Potential</p>
          <p className="text-xl font-bold text-green-500">${Math.floor(betAmount * getMultiplier(level))}</p>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative">
        <div 
          className="grid grid-cols-2 gap-3 p-4 rounded-full"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          {COLORS.map((color) => {
            const isActive = activeColor === color;
            const colorStyle = getColorStyle(color, isActive);
            
            return (
              <motion.button
                key={color}
                onClick={() => handleColorClick(color)}
                disabled={isShowingSequence || gameOver || !isPlaying}
                className={`w-24 h-24 md:w-28 md:h-28 rounded-full ${colorStyle.className} transition-all duration-150 disabled:opacity-50`}
                style={colorStyle.style}
                whileHover={{ scale: isPlaying && !isShowingSequence ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
              />
            );
          })}
        </div>

        {/* Status */}
        {isPlaying && !gameOver && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <p className="text-sm text-muted-foreground">
              {isShowingSequence ? 'Watch the sequence...' : 'Your turn!'}
            </p>
          </div>
        )}

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-full flex flex-col items-center justify-center gap-3"
            >
              <h2 className="text-xl font-bold text-foreground">Game Over!</h2>
              <p className="text-base text-muted-foreground">Level: {level}</p>
              {winAmount > 0 ? (
                <motion.p 
                  className="text-lg font-bold text-green-500"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  Won ${winAmount}! 🎉
                </motion.p>
              ) : (
                <p className="text-sm text-red-500">Reach Lvl 3 to win</p>
              )}
              <Button onClick={resetGame} size="sm" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      {!hasBet ? (
        <div className="space-y-4 w-full max-w-xs mt-8">
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

      <p className="text-sm text-muted-foreground mt-4">
        Repeat the color sequence to advance!
      </p>
    </div>
  );
}
