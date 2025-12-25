import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_SIZE = 30;
const GRAVITY = 0.35;
const JUMP_FORCE = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const PIPE_SPEED = 2.5;

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

export function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bird, setBird] = useState<Bird>({ y: CANVAS_HEIGHT / 2, velocity: 0, rotation: 0 });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  
  const birdRef = useRef(bird);
  const pipesRef = useRef(pipes);
  const scoreRef = useRef(score);
  const animationRef = useRef<number>();

  useEffect(() => {
    const saved = localStorage.getItem('flappy-high-score');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    birdRef.current = bird;
  }, [bird]);

  useEffect(() => {
    pipesRef.current = pipes;
  }, [pipes]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const jump = useCallback(() => {
    if (!isPlaying || gameOver) return;
    setBird(prev => ({
      ...prev,
      velocity: JUMP_FORCE,
    }));
  }, [isPlaying, gameOver]);

  const startGame = useCallback(() => {
    setBird({ y: CANVAS_HEIGHT / 2, velocity: 0, rotation: 0 });
    setPipes([{ x: CANVAS_WIDTH + 100, topHeight: 100 + Math.random() * 200, passed: false }]);
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };

    const handleClick = () => {
      if (!isPlaying && !gameOver) {
        startGame();
      } else {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvasRef.current?.addEventListener('click', handleClick);
    canvasRef.current?.addEventListener('touchstart', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvasRef.current?.removeEventListener('click', handleClick);
      canvasRef.current?.removeEventListener('touchstart', handleClick);
    };
  }, [isPlaying, gameOver, jump, startGame]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = () => {
      const currentBird = birdRef.current;
      const currentPipes = pipesRef.current;

      // Update bird
      const newVelocity = currentBird.velocity + GRAVITY;
      const newY = currentBird.y + newVelocity;
      const newRotation = Math.min(90, Math.max(-30, newVelocity * 3));

      // Check bounds
      if (newY <= 0 || newY >= CANVAS_HEIGHT - BIRD_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
          localStorage.setItem('flappy-high-score', scoreRef.current.toString());
        }
        return;
      }

      // Update pipes
      const updatedPipes = currentPipes
        .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
        .filter(pipe => pipe.x > -PIPE_WIDTH);

      // Add new pipe
      if (updatedPipes.length === 0 || updatedPipes[updatedPipes.length - 1].x < CANVAS_WIDTH - 250) {
        updatedPipes.push({
          x: CANVAS_WIDTH,
          topHeight: 80 + Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 160),
          passed: false,
        });
      }

      // Collision detection
      const birdLeft = 80;
      const birdRight = 80 + BIRD_SIZE;
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
            if (scoreRef.current > highScore) {
              setHighScore(scoreRef.current);
              localStorage.setItem('flappy-high-score', scoreRef.current.toString());
            }
            return;
          }
        }

        // Score
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
  }, [isPlaying, gameOver, highScore]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(0.5, '#1e3a5f');
    skyGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars (parallax layer 1)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
      const x = ((i * 37 + parallaxOffset * 0.2) % CANVAS_WIDTH);
      const y = (i * 13) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mountains (parallax layer 2)
    ctx.fillStyle = 'rgba(30, 58, 95, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
      const offset = (x + parallaxOffset * 0.5) % CANVAS_WIDTH;
      const height = 100 + Math.sin(offset * 0.02) * 50;
      ctx.lineTo(x, CANVAS_HEIGHT - height);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // City (parallax layer 3)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      const offset = (x + parallaxOffset) % CANVAS_WIDTH;
      const height = 50 + Math.abs(Math.sin(offset * 0.1)) * 80;
      ctx.fillRect(offset - 20, CANVAS_HEIGHT - height, 35, height);
      
      // Windows
      ctx.fillStyle = 'rgba(250, 204, 21, 0.6)';
      for (let wy = CANVAS_HEIGHT - height + 10; wy < CANVAS_HEIGHT - 10; wy += 15) {
        for (let wx = offset - 15; wx < offset + 15; wx += 12) {
          if (Math.random() > 0.3) {
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
      }
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    }

    // Ground
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);

    // Pipes
    pipes.forEach(pipe => {
      // Top pipe
      const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      pipeGradient.addColorStop(0, '#22c55e');
      pipeGradient.addColorStop(0.5, '#4ade80');
      pipeGradient.addColorStop(1, '#15803d');
      
      ctx.fillStyle = pipeGradient;
      ctx.beginPath();
      ctx.roundRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight, [0, 0, 8, 8]);
      ctx.fill();
      
      // Top pipe cap
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);

      // Bottom pipe
      ctx.beginPath();
      ctx.roundRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.topHeight - PIPE_GAP, [8, 8, 0, 0]);
      ctx.fill();
      
      // Bottom pipe cap
      ctx.fillRect(pipe.x - 5, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 10, 20);

      // Glow
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Bird
    ctx.save();
    ctx.translate(80 + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2);
    ctx.rotate((bird.rotation * Math.PI) / 180);
    
    // Bird body
    const birdGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, BIRD_SIZE / 2);
    birdGradient.addColorStop(0, '#fbbf24');
    birdGradient.addColorStop(1, '#f59e0b');
    ctx.fillStyle = birdGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Glow
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(10, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(BIRD_SIZE / 2 - 5, 0);
    ctx.lineTo(BIRD_SIZE / 2 + 8, 3);
    ctx.lineTo(BIRD_SIZE / 2 - 5, 6);
    ctx.closePath();
    ctx.fill();
    
    // Wing
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.ellipse(-5, 5, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, [bird, pipes, parallaxOffset]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
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

      {/* Game Canvas */}
      <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(250, 204, 21, 0.2)' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-2xl border-2 border-border cursor-pointer"
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
            <h2 className="text-3xl font-bold text-foreground">Flappy Bird</h2>
            <p className="text-muted-foreground">Tap or press Space to fly!</p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          </motion.div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Tap, click, or press Space to fly
      </p>
    </div>
  );
}
