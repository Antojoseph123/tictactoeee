import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { HorizontalControls } from '../MobileControls';

// Responsive sizing
const useResponsiveCanvas = () => {
  const [size, setSize] = useState({ width: 600, height: 400 });
  
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 48, 600);
      const aspectRatio = 600 / 400;
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

const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const WINNING_SCORE = 7;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
}

export function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = useResponsiveCanvas();
  const [playerY, setPlayerY] = useState(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [aiY, setAiY] = useState(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 5,
    vy: 3,
    trail: [],
  });
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [highScore, setHighScore] = useState(0);
  
  const ballRef = useRef(ball);
  const playerYRef = useRef(playerY);
  const aiYRef = useRef(aiY);
  const animationRef = useRef<number>();

  useEffect(() => {
    const saved = localStorage.getItem('pong-high-score');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => { ballRef.current = ball; }, [ball]);
  useEffect(() => { playerYRef.current = playerY; }, [playerY]);
  useEffect(() => { aiYRef.current = aiY; }, [aiY]);

  const resetBall = useCallback((direction: number = 1) => {
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: direction * 5,
      vy: (Math.random() - 0.5) * 6,
      trail: [],
    });
  }, []);

  const startGame = useCallback(() => {
    setPlayerScore(0);
    setAiScore(0);
    setPlayerY(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    setAiY(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    resetBall(Math.random() > 0.5 ? 1 : -1);
    setGameOver(false);
    setWinner(null);
    setIsPlaying(true);
  }, [resetBall]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top - PADDLE_HEIGHT / 2;
      setPlayerY(Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top - PADDLE_HEIGHT / 2;
      setPlayerY(Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y)));
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
      const currentPlayerY = playerYRef.current;
      const currentAiY = aiYRef.current;

      // Update trail
      const newTrail = [...currentBall.trail, { x: currentBall.x, y: currentBall.y }].slice(-15);

      // Move ball
      let newX = currentBall.x + currentBall.vx;
      let newY = currentBall.y + currentBall.vy;
      let newVx = currentBall.vx;
      let newVy = currentBall.vy;

      // Top/bottom collision
      if (newY <= BALL_SIZE / 2 || newY >= CANVAS_HEIGHT - BALL_SIZE / 2) {
        newVy = -newVy;
        newY = Math.max(BALL_SIZE / 2, Math.min(CANVAS_HEIGHT - BALL_SIZE / 2, newY));
      }

      // Player paddle collision
      if (
        newX - BALL_SIZE / 2 <= 30 + PADDLE_WIDTH &&
        newX + BALL_SIZE / 2 >= 30 &&
        newY >= currentPlayerY &&
        newY <= currentPlayerY + PADDLE_HEIGHT
      ) {
        newVx = Math.abs(newVx) * 1.05;
        const hitPos = (newY - currentPlayerY) / PADDLE_HEIGHT - 0.5;
        newVy = hitPos * 10;
        newX = 30 + PADDLE_WIDTH + BALL_SIZE / 2;
      }

      // AI paddle collision
      if (
        newX + BALL_SIZE / 2 >= CANVAS_WIDTH - 30 - PADDLE_WIDTH &&
        newX - BALL_SIZE / 2 <= CANVAS_WIDTH - 30 &&
        newY >= currentAiY &&
        newY <= currentAiY + PADDLE_HEIGHT
      ) {
        newVx = -Math.abs(newVx) * 1.05;
        const hitPos = (newY - currentAiY) / PADDLE_HEIGHT - 0.5;
        newVy = hitPos * 10;
        newX = CANVAS_WIDTH - 30 - PADDLE_WIDTH - BALL_SIZE / 2;
      }

      // Score
      if (newX < 0) {
        setAiScore(prev => {
          const newScore = prev + 1;
          if (newScore >= WINNING_SCORE) {
            setGameOver(true);
            setIsPlaying(false);
            setWinner('ai');
          }
          return newScore;
        });
        resetBall(-1);
        return;
      }
      if (newX > CANVAS_WIDTH) {
        setPlayerScore(prev => {
          const newScore = prev + 1;
          if (newScore >= WINNING_SCORE) {
            setGameOver(true);
            setIsPlaying(false);
            setWinner('player');
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('pong-high-score', newScore.toString());
            }
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
          return newScore;
        });
        resetBall(1);
        return;
      }

      // AI movement
      const aiCenter = currentAiY + PADDLE_HEIGHT / 2;
      const aiSpeed = 4;
      let newAiY = currentAiY;
      
      if (aiCenter < newY - 10) {
        newAiY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, currentAiY + aiSpeed);
      } else if (aiCenter > newY + 10) {
        newAiY = Math.max(0, currentAiY - aiSpeed);
      }
      setAiY(newAiY);

      // Speed cap
      const maxSpeed = 12;
      newVx = Math.max(-maxSpeed, Math.min(maxSpeed, newVx));
      newVy = Math.max(-maxSpeed, Math.min(maxSpeed, newVy));

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
  }, [isPlaying, gameOver, resetBall, highScore]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
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

    // Center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player paddle (neon cyan)
    const playerGradient = ctx.createLinearGradient(30, playerY, 30 + PADDLE_WIDTH, playerY);
    playerGradient.addColorStop(0, '#00ffff');
    playerGradient.addColorStop(1, '#0099cc');
    ctx.fillStyle = playerGradient;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(30, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();

    // AI paddle (neon magenta)
    const aiGradient = ctx.createLinearGradient(CANVAS_WIDTH - 30 - PADDLE_WIDTH, aiY, CANVAS_WIDTH - 30, aiY);
    aiGradient.addColorStop(0, '#ff00ff');
    aiGradient.addColorStop(1, '#cc0099');
    ctx.fillStyle = aiGradient;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(CANVAS_WIDTH - 30 - PADDLE_WIDTH, aiY, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Ball trail
    ball.trail.forEach((pos, i) => {
      const alpha = i / ball.trail.length * 0.6;
      const radius = BALL_SIZE / 2 * (i / ball.trail.length);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    });

    // Ball
    const ballGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_SIZE / 2);
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(1, '#a855f7');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = ballGradient;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Scores
    ctx.font = 'bold 48px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.fillText(playerScore.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
    ctx.fillText(aiScore.toString(), (CANVAS_WIDTH * 3) / 4, 60);
  }, [ball, playerY, aiY, playerScore, aiScore]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Score Display */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-sm text-cyan-400">You</p>
          <p className="text-4xl font-bold text-cyan-400">{playerScore}</p>
        </div>
        <div className="text-2xl text-muted-foreground">vs</div>
        <div className="text-center">
          <p className="text-sm text-pink-400">AI</p>
          <p className="text-4xl font-bold text-pink-400">{aiScore}</p>
        </div>
        <div className="text-center flex items-center gap-2 ml-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-muted-foreground">Best</p>
            <p className="text-xl font-bold text-yellow-500">{highScore}</p>
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
              <h2 className="text-3xl font-bold text-foreground">
                {winner === 'player' ? 'You Win!' : 'AI Wins!'}
              </h2>
              <p className="text-xl text-muted-foreground">
                {playerScore} - {aiScore}
              </p>
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
            <h2 className="text-3xl font-bold text-foreground">Pong</h2>
            <p className="text-muted-foreground">First to {WINNING_SCORE} wins!</p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          </motion.div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex flex-col items-center gap-2 md:hidden">
        <HorizontalControls
          onLeft={() => setPlayerY(prev => Math.max(0, prev - 25))}
          onRight={() => setPlayerY(prev => Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, prev + 25))}
        />
        <p className="text-xs text-muted-foreground">
          Use ← → to move paddle up/down
        </p>
      </div>

      <p className="text-sm text-muted-foreground hidden md:block">
        Move mouse to control paddle
      </p>
    </div>
  );
}
