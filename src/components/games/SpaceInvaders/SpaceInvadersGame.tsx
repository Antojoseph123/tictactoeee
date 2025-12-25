import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { HorizontalControls } from '../MobileControls';

// Responsive sizing
const useResponsiveCanvas = () => {
  const [size, setSize] = useState({ width: 500, height: 600 });
  
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 48, 500);
      const aspectRatio = 500 / 600;
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

const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 8;
const ALIEN_WIDTH = 35;
const ALIEN_HEIGHT = 25;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 12;

interface Alien {
  x: number;
  y: number;
  alive: boolean;
  type: number;
}

interface Bullet {
  x: number;
  y: number;
  isPlayer: boolean;
}

export function SpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = useResponsiveCanvas();
  const [playerX, setPlayerX] = useState(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [aliens, setAliens] = useState<Alien[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [alienDirection, setAlienDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  
  const playerXRef = useRef(playerX);
  const aliensRef = useRef(aliens);
  const bulletsRef = useRef(bullets);
  const alienDirectionRef = useRef(alienDirection);
  const animationRef = useRef<number>();
  const lastAlienMoveRef = useRef(0);
  const lastAlienShootRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('invaders-high-score');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
  useEffect(() => { aliensRef.current = aliens; }, [aliens]);
  useEffect(() => { bulletsRef.current = bullets; }, [bullets]);
  useEffect(() => { alienDirectionRef.current = alienDirection; }, [alienDirection]);

  const createAliens = useCallback((lvl: number) => {
    const newAliens: Alien[] = [];
    for (let row = 0; row < ALIEN_ROWS; row++) {
      for (let col = 0; col < ALIEN_COLS; col++) {
        newAliens.push({
          x: col * (ALIEN_WIDTH + 15) + 50,
          y: row * (ALIEN_HEIGHT + 15) + 60,
          alive: true,
          type: row < 2 ? 2 : row < 4 ? 1 : 0,
        });
      }
    }
    return newAliens;
  }, []);

  const startGame = useCallback(() => {
    setPlayerX(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2);
    setAliens(createAliens(1));
    setBullets([]);
    setAlienDirection(1);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setWon(false);
    setIsPlaying(true);
  }, [createAliens]);

  const shoot = useCallback(() => {
    if (!isPlaying || gameOver) return;
    const playerBullets = bulletsRef.current.filter(b => b.isPlayer);
    if (playerBullets.length < 3) {
      setBullets(prev => [...prev, {
        x: playerXRef.current + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: CANVAS_HEIGHT - 60,
        isPlayer: true,
      }]);
    }
  }, [isPlaying, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          setPlayerX(prev => Math.max(0, prev - 15));
          break;
        case 'ArrowRight':
        case 'd':
          setPlayerX(prev => Math.min(CANVAS_WIDTH - PLAYER_WIDTH, prev + 15));
          break;
        case ' ':
        case 'ArrowUp':
          e.preventDefault();
          shoot();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, shoot]);

  // Touch controls
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      
      if (x < CANVAS_WIDTH / 3) {
        setPlayerX(prev => Math.max(0, prev - 20));
      } else if (x > (CANVAS_WIDTH * 2) / 3) {
        setPlayerX(prev => Math.min(CANVAS_WIDTH - PLAYER_WIDTH, prev + 20));
      } else {
        shoot();
      }
    };

    canvasRef.current?.addEventListener('touchstart', handleTouchStart);
    return () => canvasRef.current?.removeEventListener('touchstart', handleTouchStart);
  }, [shoot]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = (timestamp: number) => {
      const currentAliens = aliensRef.current;
      const currentBullets = bulletsRef.current;
      const currentDirection = alienDirectionRef.current;

      // Move bullets
      let updatedBullets = currentBullets
        .map(b => ({
          ...b,
          y: b.isPlayer ? b.y - 8 : b.y + 4,
        }))
        .filter(b => b.y > 0 && b.y < CANVAS_HEIGHT);

      // Move aliens
      let updatedAliens = [...currentAliens];
      let newDirection = currentDirection;
      
      if (timestamp - lastAlienMoveRef.current > Math.max(100, 500 - level * 50)) {
        lastAlienMoveRef.current = timestamp;
        
        const aliveAliens = updatedAliens.filter(a => a.alive);
        const leftMost = Math.min(...aliveAliens.map(a => a.x));
        const rightMost = Math.max(...aliveAliens.map(a => a.x + ALIEN_WIDTH));
        
        if (rightMost >= CANVAS_WIDTH - 20 && currentDirection > 0) {
          newDirection = -1;
          updatedAliens = updatedAliens.map(a => ({ ...a, y: a.y + 20 }));
        } else if (leftMost <= 20 && currentDirection < 0) {
          newDirection = 1;
          updatedAliens = updatedAliens.map(a => ({ ...a, y: a.y + 20 }));
        } else {
          updatedAliens = updatedAliens.map(a => ({
            ...a,
            x: a.x + currentDirection * 10,
          }));
        }
        
        setAlienDirection(newDirection);
      }

      // Alien shooting
      if (timestamp - lastAlienShootRef.current > Math.max(500, 2000 - level * 200)) {
        lastAlienShootRef.current = timestamp;
        const aliveAliens = updatedAliens.filter(a => a.alive);
        if (aliveAliens.length > 0) {
          const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
          updatedBullets.push({
            x: shooter.x + ALIEN_WIDTH / 2,
            y: shooter.y + ALIEN_HEIGHT,
            isPlayer: false,
          });
        }
      }

      // Collision detection - player bullets vs aliens
      const hitAliens: number[] = [];
      updatedBullets = updatedBullets.filter(bullet => {
        if (!bullet.isPlayer) return true;
        
        for (let i = 0; i < updatedAliens.length; i++) {
          const alien = updatedAliens[i];
          if (
            alien.alive &&
            bullet.x >= alien.x &&
            bullet.x <= alien.x + ALIEN_WIDTH &&
            bullet.y >= alien.y &&
            bullet.y <= alien.y + ALIEN_HEIGHT
          ) {
            hitAliens.push(i);
            const points = (alien.type + 1) * 10;
            setScore(prev => {
              const newScore = prev + points;
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('invaders-high-score', newScore.toString());
              }
              return newScore;
            });
            return false;
          }
        }
        return true;
      });

      updatedAliens = updatedAliens.map((a, i) => ({
        ...a,
        alive: hitAliens.includes(i) ? false : a.alive,
      }));

      // Collision detection - alien bullets vs player
      const playerHit = updatedBullets.some(b => 
        !b.isPlayer &&
        b.x >= playerXRef.current &&
        b.x <= playerXRef.current + PLAYER_WIDTH &&
        b.y >= CANVAS_HEIGHT - 50 &&
        b.y <= CANVAS_HEIGHT - 50 + PLAYER_HEIGHT
      );

      if (playerHit) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }

      // Check win
      const aliveCount = updatedAliens.filter(a => a.alive).length;
      if (aliveCount === 0) {
        const newLevel = level + 1;
        setLevel(newLevel);
        setAliens(createAliens(newLevel));
        setBullets([]);
        setAlienDirection(1);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        return;
      }

      // Check lose (aliens reached bottom)
      if (updatedAliens.some(a => a.alive && a.y + ALIEN_HEIGHT >= CANVAS_HEIGHT - 80)) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }

      setAliens(updatedAliens);
      setBullets(updatedBullets);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver, level, createAliens, highScore]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 100; i++) {
      const x = (i * 37) % CANVAS_WIDTH;
      const y = (i * 23) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Aliens
    const alienColors = ['#22c55e', '#eab308', '#ef4444'];
    aliens.forEach(alien => {
      if (!alien.alive) return;
      
      const color = alienColors[alien.type];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      
      // Draw alien shape
      ctx.beginPath();
      ctx.moveTo(alien.x + ALIEN_WIDTH / 2, alien.y);
      ctx.lineTo(alien.x + ALIEN_WIDTH, alien.y + ALIEN_HEIGHT * 0.6);
      ctx.lineTo(alien.x + ALIEN_WIDTH * 0.8, alien.y + ALIEN_HEIGHT);
      ctx.lineTo(alien.x + ALIEN_WIDTH * 0.2, alien.y + ALIEN_HEIGHT);
      ctx.lineTo(alien.x, alien.y + ALIEN_HEIGHT * 0.6);
      ctx.closePath();
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(alien.x + ALIEN_WIDTH * 0.35, alien.y + ALIEN_HEIGHT * 0.5, 4, 0, Math.PI * 2);
      ctx.arc(alien.x + ALIEN_WIDTH * 0.65, alien.y + ALIEN_HEIGHT * 0.5, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    });

    // Player
    const playerGradient = ctx.createLinearGradient(playerX, CANVAS_HEIGHT - 50, playerX, CANVAS_HEIGHT - 50 + PLAYER_HEIGHT);
    playerGradient.addColorStop(0, '#3b82f6');
    playerGradient.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = playerGradient;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 15;
    
    // Player ship shape
    ctx.beginPath();
    ctx.moveTo(playerX + PLAYER_WIDTH / 2, CANVAS_HEIGHT - 50);
    ctx.lineTo(playerX + PLAYER_WIDTH, CANVAS_HEIGHT - 50 + PLAYER_HEIGHT);
    ctx.lineTo(playerX, CANVAS_HEIGHT - 50 + PLAYER_HEIGHT);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;

    // Bullets
    bullets.forEach(bullet => {
      if (bullet.isPlayer) {
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6';
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
      }
      ctx.shadowBlur = 10;
      ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    });
    ctx.shadowBlur = 0;
  }, [aliens, bullets, playerX]);

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
        <div className="text-center flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-muted-foreground">Best</p>
            <p className="text-2xl font-bold text-yellow-500">{highScore}</p>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(59, 130, 246, 0.3)' }}>
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
            <h2 className="text-3xl font-bold text-foreground">Space Invaders</h2>
            <p className="text-muted-foreground">Defend Earth from the alien invasion!</p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          </motion.div>
        )}
      </div>

      {/* Mobile Controls */}
      <HorizontalControls
        onLeft={() => setPlayerX(prev => Math.max(0, prev - 20))}
        onRight={() => setPlayerX(prev => Math.min(CANVAS_WIDTH - PLAYER_WIDTH, prev + 20))}
        onAction={shoot}
      />

      <p className="text-sm text-muted-foreground hidden md:block">
        Arrow keys or A/D to move • Space to shoot
      </p>
    </div>
  );
}
