import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy, Info, User, Bot, History as HistoryIcon, LogIn, Settings, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '@/utils/sounds';
import { triggerWinCelebration } from '@/utils/confetti';
import { getUltimateAIMove, type Difficulty } from '@/utils/ultimateAiOpponent';
import { useAuth } from '@/contexts/AuthContext';
import { AVATARS } from '@/components/TicTacToe/avatars';
import ThemeToggle from '@/components/TicTacToe/ThemeToggle';
import SoundToggle from '@/components/TicTacToe/SoundToggle';
import Leaderboard from '@/components/TicTacToe/Leaderboard';

type Player = 'X' | 'O' | null;
type SmallBoard = Player[];
type BigBoard = SmallBoard[];
type GameMode = 'menu' | 'local' | 'ai' | 'leaderboard' | 'history';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const checkWinner = (board: Player[]): Player => {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

const isBoardFull = (board: Player[]): boolean => {
  return board.every(cell => cell !== null);
};

// Background decorations component
const BackgroundDecorations = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-20 left-10 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
    <div className="absolute bottom-20 right-10 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />
  </div>
);

// Game Mode Selector
const GameModeSelector = ({ 
  onSelectMode, 
  onAuthClick 
}: { 
  onSelectMode: (mode: GameMode, difficulty?: Difficulty) => void;
  onAuthClick: () => void;
}) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const modes = [
    { id: 'local' as GameMode, icon: User, title: 'Local Game', description: 'Play with a friend' },
    { id: 'ai' as GameMode, icon: Bot, title: 'vs AI', description: 'Challenge the computer', showDifficulty: true },
    { id: 'leaderboard' as GameMode, icon: Trophy, title: 'Leaderboard', description: 'Top players' },
    { id: 'history' as GameMode, icon: HistoryIcon, title: 'History', description: 'Past games' },
  ];

  const difficulties: { id: Difficulty; label: string; color: string }[] = [
    { id: 'easy', label: 'Easy', color: 'text-green-400' },
    { id: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { id: 'hard', label: 'Hard', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-4">
      {/* User info / Login button */}
      <motion.div
        className="glass-panel rounded-2xl p-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {user && profile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-2xl">
                {AVATARS[profile.avatar_index || 0]}
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{profile.username}</p>
                <p className="text-xs text-muted-foreground">
                  {profile.wins}W - {profile.losses}L - {profile.draws}D
                </p>
              </div>
            </div>
          </div>
        ) : (
          <motion.button
            onClick={onAuthClick}
            className="w-full flex items-center justify-center gap-2 text-violet-400 py-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn className="w-5 h-5" />
            <span>Sign in to track stats</span>
          </motion.button>
        )}
      </motion.div>

      <motion.h2
        className="text-xl font-light text-center text-foreground"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Choose Game Mode
      </motion.h2>

      <div className="grid grid-cols-2 gap-3">
        {modes.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={mode.id === 'history' ? 'col-span-2' : ''}
          >
            {mode.showDifficulty ? (
              <div className="glass-panel rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <mode.icon className="w-4 h-4 text-violet-400" />
                  <span className="font-medium text-foreground text-sm">{mode.title}</span>
                </div>
                <div className="flex gap-2">
                  {difficulties.map((diff) => (
                    <motion.button
                      key={diff.id}
                      onClick={() => onSelectMode('ai', diff.id)}
                      className={`glass-button rounded-lg px-3 py-1.5 text-xs font-medium flex-1 ${diff.color}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {diff.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <motion.button
                onClick={() => onSelectMode(mode.id)}
                className="glass-panel rounded-2xl p-3 w-full text-left hover:bg-card/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <mode.icon className="w-4 h-4 text-violet-400" />
                  <span className="font-medium text-foreground text-sm">{mode.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Other Games Button */}
      <motion.button
        onClick={() => { soundManager.playClick(); navigate('/games'); }}
        className="glass-panel rounded-2xl p-4 w-full text-left hover:bg-violet-500/10 transition-colors border border-violet-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <span className="font-medium text-foreground">Arcade Games</span>
            <p className="text-xs text-muted-foreground">Play Snake, Tetris & more</p>
          </div>
        </div>
      </motion.button>
    </div>
  );
};

// Ultimate Board Component
const UltimateBoard = ({
  boards,
  boardWinners,
  activeBoard,
  winner,
  isDraw,
  onCellClick,
  disabled,
}: {
  boards: BigBoard;
  boardWinners: Player[];
  activeBoard: number | null;
  winner: Player;
  isDraw: boolean;
  onCellClick: (boardIndex: number, cellIndex: number) => void;
  disabled?: boolean;
}) => {
  const isBoardPlayable = (boardIndex: number) => {
    if (winner || isDraw || disabled) return false;
    if (boardWinners[boardIndex]) return false;
    if (activeBoard === null) return true;
    return activeBoard === boardIndex;
  };

  return (
    <div className="grid grid-cols-3 gap-2 p-3 bg-card/50 backdrop-blur-sm rounded-xl border border-violet-500/20">
      {boards.map((board, boardIndex) => (
        <motion.div
          key={boardIndex}
          className={`
            grid grid-cols-3 gap-0.5 p-1.5 rounded-lg transition-all duration-200
            ${isBoardPlayable(boardIndex) 
              ? 'bg-violet-500/10 ring-2 ring-violet-500/50' 
              : 'bg-muted/30'
            }
            ${boardWinners[boardIndex] === 'X' ? 'bg-blue-500/20' : ''}
            ${boardWinners[boardIndex] === 'O' ? 'bg-rose-500/20' : ''}
          `}
          animate={{
            scale: isBoardPlayable(boardIndex) && !winner ? 1.02 : 1,
          }}
        >
          {boardWinners[boardIndex] ? (
            <div className="col-span-3 row-span-3 flex items-center justify-center min-h-[84px] sm:min-h-[96px]">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-4xl font-bold ${
                  boardWinners[boardIndex] === 'X' ? 'text-blue-400' : 'text-rose-400'
                }`}
              >
                {boardWinners[boardIndex]}
              </motion.span>
            </div>
          ) : (
            board.map((cell, cellIndex) => (
              <motion.button
                key={cellIndex}
                onClick={() => onCellClick(boardIndex, cellIndex)}
                disabled={!isBoardPlayable(boardIndex) || !!cell}
                className={`
                  w-7 h-7 sm:w-8 sm:h-8 rounded text-sm font-bold
                  flex items-center justify-center
                  transition-all duration-150
                  ${cell ? '' : isBoardPlayable(boardIndex) ? 'hover:bg-violet-500/20 cursor-pointer' : 'cursor-not-allowed'}
                  ${cell === 'X' ? 'text-blue-400' : cell === 'O' ? 'text-rose-400' : 'text-transparent'}
                  bg-background/50 border border-border/30
                `}
                whileHover={!cell && isBoardPlayable(boardIndex) ? { scale: 1.1 } : {}}
                whileTap={!cell && isBoardPlayable(boardIndex) ? { scale: 0.95 } : {}}
              >
                {cell || '·'}
              </motion.button>
            ))
          )}
        </motion.div>
      ))}
    </div>
  );
};

export function UltimateTicTacToeGame() {
  const navigate = useNavigate();
  const { user, profile, updateStats } = useAuth();

  // Game state
  const [boards, setBoards] = useState<BigBoard>(() => 
    Array(9).fill(null).map(() => Array(9).fill(null))
  );
  const [boardWinners, setBoardWinners] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [activeBoard, setActiveBoard] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [gameEnded, setGameEnded] = useState(false);

  // Mode state
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  // Refs for AI
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetGame = useCallback(() => {
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    setBoards(Array(9).fill(null).map(() => Array(9).fill(null)));
    setBoardWinners(Array(9).fill(null));
    setCurrentPlayer('X');
    setActiveBoard(null);
    setWinner(null);
    setIsDraw(false);
    setGameEnded(false);
    setIsAIThinking(false);
    soundManager.playClick();
  }, []);

  const handleBackToMenu = useCallback(() => {
    soundManager.playClick();
    resetGame();
    setGameMode('menu');
  }, [resetGame]);

  const handleSelectMode = useCallback((mode: GameMode, difficulty?: Difficulty) => {
    soundManager.playClick();
    setGameMode(mode);
    if (difficulty) {
      setAiDifficulty(difficulty);
    }
    resetGame();
  }, [resetGame]);

  const handleAuthClick = useCallback(() => {
    soundManager.playClick();
    navigate('/auth');
  }, [navigate]);

  // Make AI move - accepts current state to avoid stale closures
  const makeAIMove = useCallback((
    currentBoards: BigBoard,
    currentBoardWinners: Player[],
    currentActiveBoard: number | null
  ) => {
    const move = getUltimateAIMove(currentBoards, currentBoardWinners, currentActiveBoard, aiDifficulty);
    
    if (!move) {
      setIsAIThinking(false);
      return;
    }

    const { boardIndex, cellIndex } = move;
    
    const newBoards = currentBoards.map((board, i) => 
      i === boardIndex 
        ? board.map((cell, j) => j === cellIndex ? 'O' as Player : cell)
        : [...board]
    );
    setBoards(newBoards);
    soundManager.playMoveO();

    // Check if this small board is won
    const newBoardWinners = [...currentBoardWinners];
    const smallBoardWinner = checkWinner(newBoards[boardIndex]);
    if (smallBoardWinner) {
      newBoardWinners[boardIndex] = smallBoardWinner;
      setBoardWinners(newBoardWinners);
      soundManager.playWin();
    }

    // Check if the big board is won
    const bigBoardWinner = checkWinner(newBoardWinners);
    if (bigBoardWinner) {
      setWinner(bigBoardWinner);
      setIsAIThinking(false);
      return;
    }

    // Check for draw
    const allBoardsDecided = newBoardWinners.every((w, i) => 
      w !== null || isBoardFull(newBoards[i])
    );
    if (allBoardsDecided) {
      setIsDraw(true);
      setIsAIThinking(false);
      return;
    }

    // Set the next active board
    const nextBoard = cellIndex;
    if (newBoardWinners[nextBoard] || isBoardFull(newBoards[nextBoard])) {
      setActiveBoard(null);
    } else {
      setActiveBoard(nextBoard);
    }

    setCurrentPlayer('X');
    setIsAIThinking(false);
  }, [aiDifficulty]);

  // Handle game end
  useEffect(() => {
    if ((winner || isDraw) && !gameEnded && gameMode !== 'menu') {
      setGameEnded(true);
      
      if (winner) {
        triggerWinCelebration();
        soundManager.playWin();
        setScores(prev => ({
          ...prev,
          [winner]: prev[winner as 'X' | 'O'] + 1
        }));

        if (user && gameMode === 'ai') {
          if (winner === 'X') {
            updateStats('win');
          } else {
            updateStats('loss');
          }
        }
      } else if (isDraw) {
        soundManager.playDraw();
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        if (user && gameMode === 'ai') {
          updateStats('draw');
        }
      }
    }
  }, [winner, isDraw, gameEnded, gameMode, user, updateStats]);

  const handleCellClick = useCallback((boardIndex: number, cellIndex: number) => {
    if (winner || isDraw) return;
    if (activeBoard !== null && activeBoard !== boardIndex) return;
    if (boardWinners[boardIndex]) return;
    if (boards[boardIndex][cellIndex]) return;
    if (gameMode === 'ai' && currentPlayer === 'O') return;
    if (isAIThinking) return; // Prevent clicks while AI is thinking

    soundManager.playClick();

    const newBoards = boards.map((board, i) => 
      i === boardIndex 
        ? board.map((cell, j) => j === cellIndex ? currentPlayer : cell)
        : [...board]
    );
    setBoards(newBoards);

    if (currentPlayer === 'X') {
      soundManager.playMoveX();
    } else {
      soundManager.playMoveO();
    }

    // Check if this small board is won
    const newBoardWinners = [...boardWinners];
    const smallBoardWinner = checkWinner(newBoards[boardIndex]);
    if (smallBoardWinner) {
      newBoardWinners[boardIndex] = smallBoardWinner;
      setBoardWinners(newBoardWinners);
      soundManager.playWin();
    }

    // Check if the big board is won
    const bigBoardWinner = checkWinner(newBoardWinners);
    if (bigBoardWinner) {
      setWinner(bigBoardWinner);
      return;
    }

    // Check for draw on big board
    const allBoardsDecided = newBoardWinners.every((w, i) => 
      w !== null || isBoardFull(newBoards[i])
    );
    if (allBoardsDecided && !bigBoardWinner) {
      setIsDraw(true);
      return;
    }

    // Set the next active board
    const nextBoard = cellIndex;
    let newActiveBoard: number | null;
    if (newBoardWinners[nextBoard] || isBoardFull(newBoards[nextBoard])) {
      newActiveBoard = null;
    } else {
      newActiveBoard = nextBoard;
    }
    setActiveBoard(newActiveBoard);

    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);

    // Schedule AI move if in AI mode - pass current state directly
    if (gameMode === 'ai' && nextPlayer === 'O') {
      setIsAIThinking(true);
      const delay = aiDifficulty === 'easy' ? 600 : aiDifficulty === 'medium' ? 500 : 400;
      
      // Capture current state for the AI
      const boardsForAI = newBoards;
      const winnersForAI = newBoardWinners;
      const activeBoardForAI = newActiveBoard;
      
      aiTimerRef.current = setTimeout(() => {
        makeAIMove(boardsForAI, winnersForAI, activeBoardForAI);
      }, delay);
    }
  }, [boards, boardWinners, currentPlayer, activeBoard, winner, isDraw, gameMode, aiDifficulty, makeAIMove, isAIThinking]);

  // Render leaderboard
  if (gameMode === 'leaderboard') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <BackgroundDecorations />
        <motion.div
          className="relative z-10 w-full max-w-md space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl font-light text-center text-foreground tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Ultimate Tic Tac Toe
          </motion.h1>
          <Leaderboard onBack={handleBackToMenu} />
        </motion.div>
      </div>
    );
  }

  // Render history (coming soon)
  if (gameMode === 'history') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <BackgroundDecorations />
        <motion.div
          className="relative z-10 w-full max-w-md space-y-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl font-light text-foreground tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Ultimate Tic Tac Toe
          </motion.h1>
          <div className="glass-panel rounded-2xl p-8">
            <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Game history coming soon!</p>
          </div>
          <Button variant="outline" onClick={handleBackToMenu} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    );
  }

  // Render mode selector
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <BackgroundDecorations />
        <motion.div
          className="relative z-10 w-full max-w-md space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl font-light text-center text-foreground tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Ultimate Tic Tac Toe
          </motion.h1>
          <GameModeSelector 
            onSelectMode={handleSelectMode}
            onAuthClick={handleAuthClick}
          />
        </motion.div>
      </div>
    );
  }

  // Render game
  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-lg mx-auto">
      <BackgroundDecorations />
      
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Menu
        </Button>
        <span className="text-sm text-muted-foreground">
          {gameMode === 'ai' ? `vs AI (${aiDifficulty})` : 'Local Game'}
        </span>
      </div>

      {/* Score Board */}
      <div className="flex items-center gap-6 text-sm glass-panel rounded-xl px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-bold">X</span>
          <span className="text-muted-foreground">{scores.X}</span>
        </div>
        <div className="text-muted-foreground">Draws: {scores.draws}</div>
        <div className="flex items-center gap-2">
          <span className="text-rose-400 font-bold">O</span>
          <span className="text-muted-foreground">{scores.O}</span>
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        {winner ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 text-lg font-bold"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className={winner === 'X' ? 'text-blue-400' : 'text-rose-400'}>
              {gameMode === 'ai' && winner === 'O' ? 'AI Wins!' : `Player ${winner} Wins!`}
            </span>
          </motion.div>
        ) : isDraw ? (
          <div className="text-muted-foreground font-medium">It's a Draw!</div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current:</span>
            <span className={`font-bold ${currentPlayer === 'X' ? 'text-blue-400' : 'text-rose-400'}`}>
              {gameMode === 'ai' && currentPlayer === 'O' ? 'AI' : `Player ${currentPlayer}`}
            </span>
            {isAIThinking && (
              <motion.span
                className="text-xs text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                (thinking...)
              </motion.span>
            )}
            {activeBoard !== null && (
              <span className="text-xs text-muted-foreground">
                (Board {activeBoard + 1})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ultimate Board */}
      <UltimateBoard
        boards={boards}
        boardWinners={boardWinners}
        activeBoard={activeBoard}
        winner={winner}
        isDraw={isDraw}
        onCellClick={handleCellClick}
        disabled={isAIThinking}
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={resetGame}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          New Game
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRules(!showRules)}
          className="gap-2"
        >
          <Info className="w-4 h-4" />
          Rules
        </Button>
      </div>

      {/* Rules Panel */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden w-full"
          >
            <div className="p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-violet-500/20 text-sm space-y-2">
              <h3 className="font-bold text-foreground">How to Play Ultimate Tic Tac Toe</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Win small boards to claim them with your symbol</li>
                <li>Your move determines which board your opponent plays in</li>
                <li>If sent to a won/full board, opponent can play anywhere</li>
                <li>Win 3 small boards in a row to win the game!</li>
                <li>Highlighted boards show where you can play</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
