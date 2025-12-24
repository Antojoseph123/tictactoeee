import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { MobileControls } from '../MobileControls';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 24;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'from-cyan-400 to-cyan-600' },
  O: { shape: [[1, 1], [1, 1]], color: 'from-yellow-400 to-yellow-600' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'from-purple-400 to-purple-600' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'from-green-400 to-green-600' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'from-red-400 to-red-600' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'from-blue-400 to-blue-600' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'from-orange-400 to-orange-600' },
};

type TetrominoType = keyof typeof TETROMINOS;
type Board = (string | null)[][];

interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
}

const createEmptyBoard = (): Board => 
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));

const getRandomTetromino = (): TetrominoType => {
  const types = Object.keys(TETROMINOS) as TetrominoType[];
  return types[Math.floor(Math.random() * types.length)];
};

export function TetrisGame() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType>(getRandomTetromino());
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [clearingLines, setClearingLines] = useState<number[]>([]);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tetris-high-score');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const spawnPiece = useCallback(() => {
    const type = nextPiece;
    const shape = TETROMINOS[type].shape;
    const piece: Piece = {
      type,
      shape,
      x: Math.floor((BOARD_WIDTH - shape[0].length) / 2),
      y: 0,
    };
    setNextPiece(getRandomTetromino());
    return piece;
  }, [nextPiece]);

  const isValidMove = useCallback((piece: Piece, boardState: Board): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && boardState[newY][newX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  const rotatePiece = useCallback((piece: Piece): Piece => {
    const newShape = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    );
    return { ...piece, shape: newShape };
  }, []);

  const mergePieceToBoard = useCallback((piece: Piece, boardState: Board): Board => {
    const newBoard = boardState.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.y + y >= 0) {
          newBoard[piece.y + y][piece.x + x] = TETROMINOS[piece.type].color;
        }
      }
    }
    return newBoard;
  }, []);

  const clearLines = useCallback((boardState: Board): { newBoard: Board; linesCleared: number; clearedIndices: number[] } => {
    const clearedIndices: number[] = [];
    const newBoard = boardState.filter((row, index) => {
      const isFull = row.every(cell => cell !== null);
      if (isFull) clearedIndices.push(index);
      return !isFull;
    });
    
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    
    return { newBoard, linesCleared, clearedIndices };
  }, []);

  const dropPiece = useCallback(() => {
    if (!currentPiece || !isPlaying || gameOver) return;

    const newPiece = { ...currentPiece, y: currentPiece.y + 1 };
    
    if (isValidMove(newPiece, board)) {
      setCurrentPiece(newPiece);
    } else {
      // Lock piece
      const mergedBoard = mergePieceToBoard(currentPiece, board);
      const { newBoard, linesCleared, clearedIndices } = clearLines(mergedBoard);
      
      if (linesCleared > 0) {
        setClearingLines(clearedIndices);
        setTimeout(() => {
          setClearingLines([]);
          setBoard(newBoard);
          
          const points = [0, 100, 300, 500, 800][linesCleared] * level;
          setScore(prev => {
            const newScore = prev + points;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('tetris-high-score', newScore.toString());
            }
            return newScore;
          });
          setLines(prev => {
            const newLines = prev + linesCleared;
            setLevel(Math.floor(newLines / 10) + 1);
            return newLines;
          });
          
          confetti({
            particleCount: linesCleared * 30,
            spread: 70,
            origin: { y: 0.6 },
          });
        }, 300);
      } else {
        setBoard(newBoard);
      }

      // Spawn new piece
      const newSpawnedPiece = spawnPiece();
      if (!isValidMove(newSpawnedPiece, linesCleared > 0 ? board : mergedBoard)) {
        setGameOver(true);
        setIsPlaying(false);
        setCurrentPiece(null);
      } else {
        setCurrentPiece(newSpawnedPiece);
      }
    }
  }, [currentPiece, board, isPlaying, gameOver, isValidMove, mergePieceToBoard, clearLines, spawnPiece, level, highScore]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      const speed = Math.max(100, 800 - (level - 1) * 80);
      gameLoopRef.current = setInterval(dropPiece, speed);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [isPlaying, gameOver, dropPiece, level]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPiece || !isPlaying || gameOver) return;

      let newPiece: Piece;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          newPiece = { ...currentPiece, x: currentPiece.x - 1 };
          if (isValidMove(newPiece, board)) setCurrentPiece(newPiece);
          break;
        case 'ArrowRight':
        case 'd':
          newPiece = { ...currentPiece, x: currentPiece.x + 1 };
          if (isValidMove(newPiece, board)) setCurrentPiece(newPiece);
          break;
        case 'ArrowDown':
        case 's':
          dropPiece();
          break;
        case 'ArrowUp':
        case 'w':
          newPiece = rotatePiece(currentPiece);
          if (isValidMove(newPiece, board)) setCurrentPiece(newPiece);
          break;
        case ' ':
          // Hard drop
          let hardDropPiece = { ...currentPiece };
          while (isValidMove({ ...hardDropPiece, y: hardDropPiece.y + 1 }, board)) {
            hardDropPiece.y += 1;
          }
          setCurrentPiece(hardDropPiece);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPiece, board, isPlaying, gameOver, isValidMove, rotatePiece, dropPiece]);

  const startGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setCurrentPiece(spawnPiece());
    setIsPlaying(true);
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Render current piece on board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] && currentPiece.y + y >= 0) {
            displayBoard[currentPiece.y + y][currentPiece.x + x] = TETROMINOS[currentPiece.type].color;
          }
        }
      }
    }

    return displayBoard;
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 p-6">
      {/* Game Info */}
      <div className="flex flex-row lg:flex-col gap-4 lg:w-32">
        <div className="glass-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-2xl font-bold text-primary">{score}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Level</p>
          <p className="text-2xl font-bold text-foreground">{level}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Lines</p>
          <p className="text-2xl font-bold text-foreground">{lines}</p>
        </div>
        <div className="glass-card p-4 text-center flex items-center gap-2 justify-center">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <div>
            <p className="text-sm text-muted-foreground">Best</p>
            <p className="text-xl font-bold text-yellow-500">{highScore}</p>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex flex-col items-center gap-4">
        <div 
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: BOARD_WIDTH * CELL_SIZE + 4,
            height: BOARD_HEIGHT * CELL_SIZE + 4,
            background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.3)',
            border: '2px solid hsl(var(--border))',
          }}
        >
          {/* Grid */}
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

          {/* Board Cells */}
          {renderBoard().map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <motion.div
                  key={`${x}-${y}`}
                  className={`relative ${cell ? `bg-gradient-to-br ${cell}` : ''}`}
                  animate={{
                    opacity: clearingLines.includes(y) ? [1, 0, 1, 0] : 1,
                    scale: clearingLines.includes(y) ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    boxShadow: cell ? 'inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.3)' : 'none',
                    borderRadius: cell ? '4px' : '0',
                    margin: cell ? '1px' : '0',
                  }}
                >
                  {cell && (
                    <div 
                      className="absolute inset-0 rounded opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          ))}

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
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          {!isPlaying && !gameOver ? (
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          ) : !gameOver ? (
            <>
              <Button onClick={() => setIsPlaying(!isPlaying)} variant="outline" size="lg" className="gap-2">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Pause' : 'Resume'}
              </Button>
              <Button onClick={startGame} variant="outline" size="lg" className="gap-2">
                <RotateCcw className="w-5 h-5" />
                Restart
              </Button>
            </>
        ) : null}
        </div>

        {/* Mobile Controls */}
        <MobileControls
          onUp={() => {
            if (!currentPiece || !isPlaying || gameOver) return;
            const rotated = rotatePiece(currentPiece);
            if (isValidMove(rotated, board)) setCurrentPiece(rotated);
          }}
          onDown={() => dropPiece()}
          onLeft={() => {
            if (!currentPiece || !isPlaying || gameOver) return;
            const newPiece = { ...currentPiece, x: currentPiece.x - 1 };
            if (isValidMove(newPiece, board)) setCurrentPiece(newPiece);
          }}
          onRight={() => {
            if (!currentPiece || !isPlaying || gameOver) return;
            const newPiece = { ...currentPiece, x: currentPiece.x + 1 };
            if (isValidMove(newPiece, board)) setCurrentPiece(newPiece);
          }}
          showRotate
          onRotate={() => {
            if (!currentPiece || !isPlaying || gameOver) return;
            const rotated = rotatePiece(currentPiece);
            if (isValidMove(rotated, board)) setCurrentPiece(rotated);
          }}
          onAction={() => {
            if (!currentPiece || !isPlaying || gameOver) return;
            let hardDropPiece = { ...currentPiece };
            while (isValidMove({ ...hardDropPiece, y: hardDropPiece.y + 1 }, board)) {
              hardDropPiece.y += 1;
            }
            setCurrentPiece(hardDropPiece);
          }}
        />

        <p className="text-sm text-muted-foreground text-center hidden md:block">
          Arrow keys to move • Up/W to rotate • Space for hard drop
        </p>
      </div>

      {/* Next Piece Preview */}
      <div className="glass-card p-4">
        <p className="text-sm text-muted-foreground mb-2 text-center">Next</p>
        <div className="w-20 h-20 flex items-center justify-center">
          {TETROMINOS[nextPiece].shape.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`${cell ? `bg-gradient-to-br ${TETROMINOS[nextPiece].color}` : ''}`}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: cell ? '2px' : '0',
                    margin: '1px',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
