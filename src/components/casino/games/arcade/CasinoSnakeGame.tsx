import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Trophy, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { MobileControls } from '@/components/games/MobileControls';
import { BetControls } from '../../BetControls';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

interface CasinoSnakeGameProps {
  balance: number;
  onBet: (amount: number) => Promise<boolean>;
  onWin: (amount: number) => void;
}

const useResponsiveCellSize = () => {
  const [cellSize, setCellSize] = useState(20);
  
  useEffect(() => {
    const updateSize = () => {
      const maxBoardSize = Math.min(window.innerWidth - 48, 400);
      setCellSize(Math.floor(maxBoardSize / GRID_SIZE));
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return cellSize;
};

// Payout table - multiplier based on score
const getMultiplier = (score: number): number => {
  if (score >= 200) return 10;
  if (score >= 150) return 5;
  if (score >= 100) return 3;
  if (score >= 50) return 1.5;
  if (score >= 30) return 1;
  return 0;
};

export function CasinoSnakeGame({ balance, onBet, onWin }: CasinoSnakeGameProps) {
  const CELL_SIZE = useResponsiveCellSize();
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [betAmount, setBetAmount] = useState(5);
  const [hasBet, setHasBet] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generateFood = useCallback(() => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(s => s.x === newFood.x && s.y === newFood.y));
    return newFood;
  }, [snake]);

  const createParticles = (x: number, y: number) => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: x * CELL_SIZE + CELL_SIZE / 2,
      y: y * CELL_SIZE + CELL_SIZE / 2,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 500);
  };

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      
      switch (directionRef.current) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      if (prevSnake.some(s => s.x === head.x && s.y === head.y)) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        createParticles(food.x, food.y);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      const speed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
      gameLoopRef.current = setInterval(moveSnake, speed);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [isPlaying, gameOver, moveSnake, score]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (directionRef.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
          if (directionRef.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
          if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
          if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Handle game over - calculate winnings
  useEffect(() => {
    if (gameOver && hasBet) {
      const multiplier = getMultiplier(score);
      const payout = Math.floor(betAmount * multiplier);
      setWinAmount(payout);
      
      if (payout > 0) {
        onWin(payout);
        confetti({
          particleCount: 50 + payout,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00ff88', '#00ffff', '#ff00ff'],
        });
      }
    }
  }, [gameOver, hasBet, score, betAmount, onWin]);

  const startGame = async () => {
    const success = await onBet(betAmount);
    if (!success) return;
    
    setHasBet(true);
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setWinAmount(0);
    setIsPlaying(true);
  };

  const resetGame = () => {
    setHasBet(false);
    setGameOver(false);
    setScore(0);
    setWinAmount(0);
  };

  const togglePause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold flex items-center gap-2 justify-center">
          🐍 Casino Snake
        </h3>
        <p className="text-sm text-muted-foreground">Score big to win big!</p>
      </div>

      {/* Payout Table */}
      <div className="grid grid-cols-5 gap-2 text-xs text-center mb-2">
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">30+</div>
          <div className="text-muted-foreground">1x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">50+</div>
          <div className="text-muted-foreground">1.5x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">100+</div>
          <div className="text-muted-foreground">3x</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="font-bold">150+</div>
          <div className="text-muted-foreground">5x</div>
        </div>
        <div className="p-2 bg-primary/20 rounded border border-primary">
          <div className="font-bold">200+</div>
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

      {/* Game Board */}
      <div 
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
          boxShadow: '0 0 60px rgba(0, 255, 136, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.3)',
          border: '2px solid hsl(var(--border))',
        }}
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        />

        {snake.map((segment, index) => (
          <motion.div
            key={`${segment.x}-${segment.y}-${index}`}
            className="absolute rounded-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
              background: index === 0 
                ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                : `linear-gradient(135deg, rgba(0, 255, 136, ${1 - index * 0.03}) 0%, rgba(0, 204, 106, ${1 - index * 0.03}) 100%)`,
              boxShadow: index === 0 
                ? '0 0 20px rgba(0, 255, 136, 0.8), 0 0 40px rgba(0, 255, 136, 0.4)'
                : '0 0 10px rgba(0, 255, 136, 0.5)',
            }}
          />
        ))}

        <motion.div
          className="absolute rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            boxShadow: [
              '0 0 20px rgba(255, 0, 136, 0.8)',
              '0 0 40px rgba(255, 0, 136, 1)',
              '0 0 20px rgba(255, 0, 136, 0.8)',
            ],
          }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
            left: food.x * CELL_SIZE + 2,
            top: food.y * CELL_SIZE + 2,
            background: 'linear-gradient(135deg, #ff0088 0%, #ff00ff 100%)',
          }}
        />

        <AnimatePresence>
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full bg-primary"
              initial={{ x: particle.x, y: particle.y, scale: 1, opacity: 1 }}
              animate={{ 
                x: particle.x + (Math.random() - 0.5) * 60,
                y: particle.y + (Math.random() - 0.5) * 60,
                scale: 0,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ boxShadow: '0 0 10px hsl(var(--primary))' }}
            />
          ))}
        </AnimatePresence>

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
              {winAmount > 0 ? (
                <motion.p 
                  className="text-2xl font-bold text-green-500"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  Won ${winAmount}! 🎉
                </motion.p>
              ) : (
                <p className="text-lg text-red-500">No win - Score 30+ to win</p>
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
      ) : !gameOver ? (
        <div className="flex gap-4">
          <Button onClick={togglePause} variant="outline" size="lg" className="gap-2">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isPlaying ? 'Pause' : 'Resume'}
          </Button>
        </div>
      ) : null}

      {hasBet && !gameOver && (
        <MobileControls
          onUp={() => directionRef.current !== 'DOWN' && setDirection('UP')}
          onDown={() => directionRef.current !== 'UP' && setDirection('DOWN')}
          onLeft={() => directionRef.current !== 'RIGHT' && setDirection('LEFT')}
          onRight={() => directionRef.current !== 'LEFT' && setDirection('RIGHT')}
        />
      )}

      <p className="text-sm text-muted-foreground hidden md:block">
        Use arrow keys or WASD to move
      </p>
    </div>
  );
}
