import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { HorizontalControls } from '../MobileControls';

// Responsive sizing
const useResponsiveCanvas = () => {
  const [size, setSize] = useState({ width: 480, height: 600 });
  
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 48, 480);
      const aspectRatio = 480 / 600;
      const width = maxWidth;
      const height = Math.floor(width / aspectRatio);
      setSize({ width: Math.floor(width), height });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return size;
};

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 8;
const BRICK_ROWS = 6;
const BRICK_COLS = 8;
const BRICK_GAP = 4;
const BRICK_TOP = 60;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
}

interface Brick {
  x: number;
  y: number;
  hits: number;
  maxHits: number;
  color: string;
}

const COLORS = [
  'from-red-500 to-red-700',
  'from-orange-500 to-orange-700',
  'from-yellow-500 to-yellow-700',
  'from-green-500 to-green-700',
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
];

export function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = useResponsiveCanvas();
  
  // Calculate responsive brick size
  const BRICK_WIDTH = Math.floor((CANVAS_WIDTH - 20 - (BRICK_COLS - 1) * BRICK_GAP) / BRICK_COLS);
  const BRICK_HEIGHT = 20;
  
  const [paddleX, setPaddleX] = useState(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 100,
    vx: 4,
    vy: -4,
    trail: [],
  });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  
  const ballRef = useRef(ball);
  const paddleRef = useRef(paddleX);
  const bricksRef = useRef(bricks);
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const animationRef = useRef<number>();

  useEffect(() => {
    const saved = localStorage.getItem('breakout-high-score');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const createBricks = useCallback((lvl: number) => {
    const newBricks: Brick[] = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const maxHits = row < 2 ? Math.min(3, 1 + Math.floor(lvl / 2)) : 1;
        newBricks.push({
          x: col * (BRICK_WIDTH + BRICK_GAP) + BRICK_GAP + 10,
          y: row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_TOP,
          hits: 0,
          maxHits,
          color: COLORS[row % COLORS.length],
        });
      }
    }
    return newBricks;
  }, []);

  const resetBall = useCallback(() => {
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      vx: (Math.random() > 0.5 ? 1 : -1) * 4,
      vy: -4,
      trail: [],
    });
  }, []);

  const startGame = useCallback(() => {
    const newBricks = createBricks(1);
    setBricks(newBricks);
    bricksRef.current = newBricks;
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    livesRef.current = 3;
    setLevel(1);
    setGameOver(false);
    resetBall();
    setPaddleX(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
    setIsPlaying(true);
  }, [createBricks, resetBall]);

  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    const newBricks = createBricks(newLevel);
    setBricks(newBricks);
    bricksRef.current = newBricks;
    resetBall();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, [level, createBricks, resetBall]);

  useEffect(() => {
    ballRef.current = ball;
  }, [ball]);

  useEffect(() => {
    paddleRef.current = paddleX;
  }, [paddleX]);

  useEffect(() => {
    bricksRef.current = bricks;
  }, [bricks]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - PADDLE_WIDTH / 2;
      setPaddleX(Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left - PADDLE_WIDTH / 2;
      setPaddleX(Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x)));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = () => {
      const currentBall = ballRef.current;
      const currentPaddle = paddleRef.current;
      const currentBricks = bricksRef.current;

      // Update trail
      const newTrail = [...currentBall.trail, { x: currentBall.x, y: currentBall.y }].slice(-10);

      // Move ball
      let newX = currentBall.x + currentBall.vx;
      let newY = currentBall.y + currentBall.vy;
      let newVx = currentBall.vx;
      let newVy = currentBall.vy;

      // Wall collision
      if (newX <= BALL_RADIUS || newX >= CANVAS_WIDTH - BALL_RADIUS) {
        newVx = -newVx;
        newX = Math.max(BALL_RADIUS, Math.min(CANVAS_WIDTH - BALL_RADIUS, newX));
      }
      if (newY <= BALL_RADIUS) {
        newVy = -newVy;
        newY = BALL_RADIUS;
      }

      // Paddle collision
      if (
        newY >= CANVAS_HEIGHT - PADDLE_HEIGHT - 30 - BALL_RADIUS &&
        newY <= CANVAS_HEIGHT - 30 &&
        newX >= currentPaddle &&
        newX <= currentPaddle + PADDLE_WIDTH
      ) {
        newVy = -Math.abs(newVy);
        // Add angle based on where ball hits paddle
        const hitPos = (newX - currentPaddle) / PADDLE_WIDTH - 0.5;
        newVx = hitPos * 10;
        newY = CANVAS_HEIGHT - PADDLE_HEIGHT - 30 - BALL_RADIUS;
      }

      // Brick collision
      let hitBrick = false;
      const updatedBricks = currentBricks.map(brick => {
        if (brick.hits >= brick.maxHits) return brick;
        
        if (
          newX + BALL_RADIUS > brick.x &&
          newX - BALL_RADIUS < brick.x + BRICK_WIDTH &&
          newY + BALL_RADIUS > brick.y &&
          newY - BALL_RADIUS < brick.y + BRICK_HEIGHT
        ) {
          hitBrick = true;
          const newHits = brick.hits + 1;
          const points = (brick.maxHits - brick.hits) * 10;
          
          setScore(prev => {
            const newScore = prev + points;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('breakout-high-score', newScore.toString());
            }
            return newScore;
          });

          // Determine collision side
          const overlapLeft = newX + BALL_RADIUS - brick.x;
          const overlapRight = brick.x + BRICK_WIDTH - (newX - BALL_RADIUS);
          const overlapTop = newY + BALL_RADIUS - brick.y;
          const overlapBottom = brick.y + BRICK_HEIGHT - (newY - BALL_RADIUS);

          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          if (minOverlapX < minOverlapY) {
            newVx = -newVx;
          } else {
            newVy = -newVy;
          }

          return { ...brick, hits: newHits };
        }
        return brick;
      });

      if (hitBrick) {
        setBricks(updatedBricks);
        bricksRef.current = updatedBricks;
      }

      // Check win
      const remainingBricks = updatedBricks.filter(b => b.hits < b.maxHits);
      if (remainingBricks.length === 0) {
        nextLevel();
        return;
      }

      // Ball out of bounds
      if (newY >= CANVAS_HEIGHT) {
        const newLives = livesRef.current - 1;
        setLives(newLives);
        livesRef.current = newLives;
        
        if (newLives <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          return;
        }
        
        resetBall();
        return;
      }

      // Speed increase
      const speed = Math.sqrt(newVx * newVx + newVy * newVy);
      const maxSpeed = 8 + level;
      if (speed < maxSpeed) {
        newVx *= 1.0001;
        newVy *= 1.0001;
      }

      setBall({
        x: newX,
        y: newY,
        vx: newVx,
        vy: newVy,
        trail: newTrail,
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver, highScore, resetBall, nextLevel, level]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Bricks
    bricks.forEach(brick => {
      if (brick.hits >= brick.maxHits) return;
      
      const opacity = 1 - (brick.hits / brick.maxHits) * 0.5;
      const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x + BRICK_WIDTH, brick.y + BRICK_HEIGHT);
      
      // Parse color classes to actual colors
      const colorMap: Record<string, [string, string]> = {
        'from-red-500 to-red-700': ['#ef4444', '#b91c1c'],
        'from-orange-500 to-orange-700': ['#f97316', '#c2410c'],
        'from-yellow-500 to-yellow-700': ['#eab308', '#a16207'],
        'from-green-500 to-green-700': ['#22c55e', '#15803d'],
        'from-blue-500 to-blue-700': ['#3b82f6', '#1d4ed8'],
        'from-purple-500 to-purple-700': ['#a855f7', '#7e22ce'],
      };
      
      const colors = colorMap[brick.color] || ['#888', '#666'];
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      ctx.globalAlpha = opacity;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
      ctx.fill();
      
      // Glow
      ctx.shadowColor = colors[0];
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Hit indicator
      if (brick.maxHits > 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          String(brick.maxHits - brick.hits),
          brick.x + BRICK_WIDTH / 2,
          brick.y + BRICK_HEIGHT / 2 + 4
        );
      }
      
      ctx.globalAlpha = 1;
    });

    // Ball trail
    ball.trail.forEach((pos, i) => {
      const alpha = i / ball.trail.length * 0.5;
      const radius = BALL_RADIUS * (i / ball.trail.length);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
      ctx.fill();
    });

    // Ball
    const ballGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_RADIUS);
    ballGradient.addColorStop(0, '#fff');
    ballGradient.addColorStop(1, '#a855f7');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = ballGradient;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Paddle
    const paddleY = CANVAS_HEIGHT - PADDLE_HEIGHT - 30;
    const paddleGradient = ctx.createLinearGradient(paddleX, paddleY, paddleX, paddleY + PADDLE_HEIGHT);
    paddleGradient.addColorStop(0, '#60a5fa');
    paddleGradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = paddleGradient;
    ctx.beginPath();
    ctx.roundRect(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [ball, bricks, paddleX]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Score Display */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-3xl font-bold text-primary">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Level</p>
          <p className="text-3xl font-bold text-foreground">{level}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Lives</p>
          <p className="text-3xl font-bold text-red-500">{'❤️'.repeat(lives)}</p>
        </div>
        <div className="text-center flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-muted-foreground">Best</p>
            <p className="text-2xl font-bold text-yellow-500">{highScore}</p>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(139, 92, 246, 0.3)' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-2xl border-2 border-border"
        />

        {/* Game Over Overlay */}
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
            className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
          >
            <h2 className="text-3xl font-bold text-foreground">Breakout</h2>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      {isPlaying && !gameOver && (
        <div className="flex gap-4">
          <Button onClick={() => setIsPlaying(!isPlaying)} variant="outline" size="lg" className="gap-2">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isPlaying ? 'Pause' : 'Resume'}
          </Button>
          <Button onClick={startGame} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="w-5 h-5" />
            Restart
          </Button>
        </div>
      )}

      {/* Mobile Controls */}
      <HorizontalControls
        onLeft={() => setPaddleX(prev => Math.max(0, prev - 30))}
        onRight={() => setPaddleX(prev => Math.min(CANVAS_WIDTH - PADDLE_WIDTH, prev + 30))}
      />

      <p className="text-sm text-muted-foreground hidden md:block">
        Move mouse or touch to control paddle
      </p>
    </div>
  );
}
