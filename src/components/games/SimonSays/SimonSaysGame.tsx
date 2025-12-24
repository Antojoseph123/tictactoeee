import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const COLORS = [
  { name: 'green', bg: 'bg-green-500', active: 'bg-green-300', freq: 392 },
  { name: 'red', bg: 'bg-red-500', active: 'bg-red-300', freq: 329.63 },
  { name: 'yellow', bg: 'bg-yellow-500', active: 'bg-yellow-300', freq: 261.63 },
  { name: 'blue', bg: 'bg-blue-500', active: 'bg-blue-300', freq: 220 },
];

export function SimonSaysGame() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [canClick, setCanClick] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('simon-high-score');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const playTone = useCallback((frequency: number, duration: number = 300) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, []);

  const flashColor = useCallback((colorIndex: number, duration: number = 400) => {
    return new Promise<void>(resolve => {
      setActiveColor(colorIndex);
      playTone(COLORS[colorIndex].freq, duration);
      setTimeout(() => {
        setActiveColor(null);
        setTimeout(resolve, 100);
      }, duration);
    });
  }, [playTone]);

  const showSequence = useCallback(async (seq: number[]) => {
    setIsShowingSequence(true);
    setCanClick(false);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    for (const colorIndex of seq) {
      await flashColor(colorIndex);
    }
    
    setIsShowingSequence(false);
    setCanClick(true);
  }, [flashColor]);

  const addToSequence = useCallback(() => {
    const newColor = Math.floor(Math.random() * 4);
    const newSequence = [...sequence, newColor];
    setSequence(newSequence);
    setPlayerSequence([]);
    return newSequence;
  }, [sequence]);

  const startGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setSequence([]);
    setPlayerSequence([]);
    setIsPlaying(true);
    
    // Start with first color
    const firstColor = Math.floor(Math.random() * 4);
    const newSequence = [firstColor];
    setSequence(newSequence);
    setTimeout(() => showSequence(newSequence), 500);
  }, [showSequence]);

  const handleColorClick = useCallback(async (colorIndex: number) => {
    if (!canClick || isShowingSequence || gameOver) return;
    
    await flashColor(colorIndex, 200);
    
    const newPlayerSequence = [...playerSequence, colorIndex];
    setPlayerSequence(newPlayerSequence);
    
    // Check if wrong
    if (colorIndex !== sequence[newPlayerSequence.length - 1]) {
      setGameOver(true);
      setIsPlaying(false);
      setCanClick(false);
      
      // Play error sound
      playTone(100, 500);
      
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('simon-high-score', score.toString());
      }
      return;
    }
    
    // Check if completed sequence
    if (newPlayerSequence.length === sequence.length) {
      const newScore = score + 1;
      setScore(newScore);
      setPlayerSequence([]);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('simon-high-score', newScore.toString());
      }
      
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
      });
      
      // Add to sequence and show
      setTimeout(() => {
        const updatedSequence = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(updatedSequence);
        showSequence(updatedSequence);
      }, 1000);
    }
  }, [canClick, isShowingSequence, gameOver, playerSequence, sequence, score, highScore, flashColor, playTone, showSequence]);

  return (
    <div className="flex flex-col items-center gap-8 p-6">
      {/* Score Display */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-4xl font-bold text-primary">{score}</p>
        </div>
        <div className="text-center flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-muted-foreground">Best</p>
            <p className="text-3xl font-bold text-yellow-500">{highScore}</p>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative">
        <div 
          className="grid grid-cols-2 gap-4 p-8 rounded-full"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          {COLORS.map((color, index) => (
            <motion.button
              key={color.name}
              className={`
                w-32 h-32 md:w-40 md:h-40 rounded-full transition-all duration-100
                ${activeColor === index ? color.active : color.bg}
                ${canClick && !isShowingSequence ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed'}
                ${index === 0 ? 'rounded-br-none' : ''}
                ${index === 1 ? 'rounded-bl-none' : ''}
                ${index === 2 ? 'rounded-tr-none' : ''}
                ${index === 3 ? 'rounded-tl-none' : ''}
              `}
              style={{
                boxShadow: activeColor === index 
                  ? `0 0 40px ${color.name}, inset 0 0 20px rgba(255,255,255,0.5)`
                  : 'inset 0 0 30px rgba(0,0,0,0.3)',
              }}
              whileTap={canClick ? { scale: 0.95 } : {}}
              animate={{
                opacity: activeColor === index ? 1 : 0.7,
                scale: activeColor === index ? 1.05 : 1,
              }}
              onClick={() => handleColorClick(index)}
              disabled={!canClick || isShowingSequence}
            />
          ))}

          {/* Center Circle */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full bg-background flex items-center justify-center"
            style={{
              boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
            }}
          >
            <div className="text-center">
              {isShowingSequence && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Volume2 className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground mt-1">Watch</p>
                </motion.div>
              )}
              {canClick && !gameOver && (
                <p className="text-sm text-muted-foreground">Your turn!</p>
              )}
              {!isPlaying && !gameOver && (
                <p className="text-sm text-muted-foreground">Press Start</p>
              )}
            </div>
          </div>
        </div>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-full flex flex-col items-center justify-center gap-4"
            >
              <h2 className="text-2xl font-bold text-foreground">Game Over!</h2>
              <p className="text-lg text-muted-foreground">Score: {score}</p>
              <Button onClick={startGame} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      {!isPlaying && !gameOver && (
        <Button onClick={startGame} size="lg" className="gap-2">
          <Play className="w-5 h-5" />
          Start Game
        </Button>
      )}

      {/* Progress */}
      {isPlaying && !gameOver && (
        <div className="flex gap-2">
          {sequence.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < playerSequence.length ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Watch the pattern and repeat it. Each round adds one more color to remember!
      </p>
    </div>
  );
}
