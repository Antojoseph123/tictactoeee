import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { BetControls } from '../../BetControls';

interface CasinoFlappyBirdGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

const useResponsiveCanvas = () => {
  const [size, setSize] = useState({ width: 320, height: 480 });
  
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 48, 320);
      const maxHeight = Math.min(window.innerHeight - 400, 480);
      const aspectRatio = 320 / 480;
      
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return size;
};

const BIRD_SIZE = 25;
const GRAVITY = 0.4;
const JUMP_FORCE = -7;
const PIPE_WIDTH = 50;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.5;

const getMultiplier = (score: number): number => {
  if (score >= 20) return 10;
  if (score >= 15) return 5;
  if (score >= 10) return 3;
  if (score >= 5) return 1.5;
  if (score >= 3) return 1;
  return 0;
};

interface Bird {
  y: number;
  velocity: number;
  rotation: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export function CasinoFlappyBirdGame({ balance, onBet, onWin }: CasinoFlappyBirdGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = useResponsiveCanvas();
  const [bird, setBird] = useState<Bird>({ y: CANVAS_HEIGHT / 2, velocity: 0, rotation: 0 });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [betAmount, setBetAmount] = useState(5);
  const [hasBet, setHasBet] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  
  const birdRef = useRef(bird);
  const pipesRef = useRef(pipes);
  const scoreRef = useRef(score);
  const animationRef = useRef<number>();

  useEffect(() => { birdRef.current = bird; }, [bird]);
  useEffect(() => { pipesRef.current = pipes; }, [pipes]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const jump = useCallback(() => {
    if (!isPlaying || gameOver) return;
    setBird(prev => ({ ...prev, velocity: JUMP_FORCE }));
  }, [isPlaying, gameOver]);

  const startGame = async () => {
    const success = await onBet(betAmount);
    if (!success) return;
    
    setHasBet(true);
    setBird({ y: CANVAS_HEIGHT / 2, velocity: 0, rotation: 0 });
    setPipes([{ x: CANVAS_WIDTH + 100, topHeight: 80 + Math.random() * 150, passed: false }]);
    setScore(0);
    setWinAmount(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const resetGame = () => {
    setHasBet(false);
    setGameOver(false);
    setScore(0);
    setWinAmount(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (isPlaying && !gameOver) jump();
      }
    };

    const handleClick = () => {
      if (isPlaying && !gameOver) jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvasRef.current?.addEventListener('click', handleClick);
    canvasRef.current?.addEventListener('touchstart', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvasRef.current?.removeEventListener('click', handleClick);
      canvasRef.current?.removeEventListener('touchstart', handleClick);
    };
  }, [isPlaying, gameOver, jump]);

  // Handle game over
  useEffect(() => {
    if (gameOver && hasBet) {
      const multiplier = getMultiplier(score);
      const payout = Math.floor(betAmount * multiplier);
      setWinAmount(payout);
      
      if (payout > 0) {
        onWin(payout);
        confetti({ particleCount: 50 + payout * 5, spread: 60, origin: { y: 0.6 } });
      }
    }
  }, [gameOver, hasBet, score, betAmount, onWin]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = () => {
      const currentBird = birdRef.current;
      const currentPipes = pipesRef.current;

      const newVelocity = currentBird.velocity + GRAVITY;
      const newY = currentBird.y + newVelocity;
      const newRotation = Math.min(90, Math.max(-30, newVelocity * 3));

      if (newY <= 0 || newY >= CANVAS_HEIGHT - BIRD_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }

      const updatedPipes = currentPipes
        .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
        .filter(pipe => pipe.x > -PIPE_WIDTH);

      if (updatedPipes.length === 0 || updatedPipes[updatedPipes.length - 1].x < CANVAS_WIDTH - 200) {
        updatedPipes.push({
          x: CANVAS_WIDTH,
          topHeight: 60 + Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 120),
          passed: false,
        });
      }

      const birdLeft = 60;
      const birdRight = 60 + BIRD_SIZE;
      const birdTop = newY;
      const birdBottom = newY + BIRD_SIZE;

      for (const pipe of updatedPipes) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;
        const gapTop = pipe.topHeight;
        const gapBottom = pipe.topHeight + PIPE_GAP;

        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          if (birdTop < gapTop || birdBottom > gapBottom) {
            setGameOver(true);
            setIsPlaying(false);
            return;
          }
        }

        if (!pipe.passed && pipe.x + PIPE_WIDTH < birdLeft) {
          pipe.passed = true;
          setScore(prev => prev + 1);
        }
      }

      setBird({ y: newY, velocity: newVelocity, rotation: newRotation });
      setPipes(updatedPipes);
      setParallaxOffset(prev => (prev + 1) % 50);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(0.5, '#1e3a5f');
    skyGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 30; i++) {
      const x = ((i * 37 + parallaxOffset * 0.2) % CANVAS_WIDTH);
      const y = (i * 13) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, CANVAS_HEIGHT - 15, CANVAS_WIDTH, 15);

    pipes.forEach(pipe => {
      const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      pipeGradient.addColorStop(0, '#22c55e');
      pipeGradient.addColorStop(0.5, '#4ade80');
      pipeGradient.addColorStop(1, '#15803d');
      
      ctx.fillStyle = pipeGradient;
      ctx.beginPath();
      ctx.roundRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight, [0, 0, 8, 8]);
      ctx.fill();
      ctx.fillRect(pipe.x - 4, pipe.topHeight - 15, PIPE_WIDTH + 8, 15);

      ctx.beginPath();
      ctx.roundRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.topHeight - PIPE_GAP, [8, 8, 0, 0]);
      ctx.fill();
      ctx.fillRect(pipe.x - 4, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 8, 15);
    });

    ctx.save();
    ctx.translate(60 + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2);
    ctx.rotate((bird.rotation * Math.PI) / 180);
    
    const birdGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, BIRD_SIZE / 2);
    birdGradient.addColorStop(0, '#fbbf24');
    birdGradient.addColorStop(1, '#f59e0b');
    ctx.fillStyle = birdGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(6, -3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(8, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(BIRD_SIZE / 2 - 4, 0);
    ctx.lineTo(BIRD_SIZE / 2 + 6, 2);
    ctx.lineTo(BIRD_SIZE / 2 - 4, 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }, [bird, pipes, parallaxOffset, CANVAS_WIDTH, CANVAS_HEIGHT]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold">🐦 Casino Flappy Bird</h3>
        <p className="text-sm text-muted-foreground">Fly far to win big!</p>
      </div>

      {/* Payout Table */}
      <div className="grid grid-cols-5 gap-2 text-xs text-center mb-2">
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">3+</div>
          <div className="text-muted-foreground">1x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">5+</div>
          <div className="text-muted-foreground">1.5x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">10+</div>
          <div className="text-muted-foreground">3x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">15+</div>
          <div className="text-muted-foreground">5x</div>
        </div>
        <div className="p-2 bg-primary/20 rounded border border-primary">
          <div className="font-bold">20+</div>
          <div className="text-primary">10x</div>
        </div>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-3xl font-bold text-primary">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Bet</p>
          <p className="text-xl font-bold text-foreground">${betAmount}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Potential</p>
          <p className="text-xl font-bold text-green-500">${Math.floor(betAmount * getMultiplier(score))}</p>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(250, 204, 21, 0.2)' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-2xl border-2 border-border cursor-pointer"
        />

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
            >
              <h2 className="text-3xl font-bold text-foreground">Game Over!</h2>
              <p className="text-xl text-muted-foreground">Score: {score}</p>
              {winAmount > 0 ? (
                <motion.p 
                  className="text-2xl font-bold text-green-500"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  Won ${winAmount}! 🎉
                </motion.p>
              ) : (
                <p className="text-lg text-red-500">No win - Score 3+ to win</p>
              )}
              <Button onClick={resetGame} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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
      ) : !gameOver && (
        <Button onClick={jump} size="lg" className="gap-2">
          Tap to Fly
        </Button>
      )}

      <p className="text-sm text-muted-foreground">
        Tap or press Space to fly
      </p>
    </div>
  );
}
