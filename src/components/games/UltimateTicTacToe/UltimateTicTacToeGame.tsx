import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy, Info } from 'lucide-react';
import { soundManager } from '@/utils/sounds';
import { triggerWinCelebration } from '@/utils/confetti';

type Player = 'X' | 'O' | null;
type SmallBoard = Player[];
type BigBoard = SmallBoard[];

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
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

export function UltimateTicTacToeGame() {
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

  const resetGame = useCallback(() => {
    setBoards(Array(9).fill(null).map(() => Array(9).fill(null)));
    setBoardWinners(Array(9).fill(null));
    setCurrentPlayer('X');
    setActiveBoard(null);
    setWinner(null);
    setIsDraw(false);
    soundManager.playClick();
  }, []);

  const handleCellClick = useCallback((boardIndex: number, cellIndex: number) => {
    if (winner || isDraw) return;
    if (activeBoard !== null && activeBoard !== boardIndex) return;
    if (boardWinners[boardIndex]) return;
    if (boards[boardIndex][cellIndex]) return;

    soundManager.playClick();

    const newBoards = boards.map((board, i) => 
      i === boardIndex 
        ? board.map((cell, j) => j === cellIndex ? currentPlayer : cell)
        : [...board]
    );
    setBoards(newBoards);

    // Check if this small board is won
    const newBoardWinners = [...boardWinners];
    const smallBoardWinner = checkWinner(newBoards[boardIndex]);
    if (smallBoardWinner) {
      newBoardWinners[boardIndex] = smallBoardWinner;
      setBoardWinners(newBoardWinners);
      soundManager.playWin();
    } else if (isBoardFull(newBoards[boardIndex])) {
      // Small board is a draw, mark it as null but it's no longer playable
      newBoardWinners[boardIndex] = null;
    }

    // Check if the big board is won
    const bigBoardWinner = checkWinner(newBoardWinners);
    if (bigBoardWinner) {
      setWinner(bigBoardWinner);
      triggerWinCelebration();
      soundManager.playWin();
      setScores(prev => ({
        ...prev,
        [bigBoardWinner]: prev[bigBoardWinner] + 1
      }));
      return;
    }

    // Check for draw on big board
    const allBoardsDecided = newBoardWinners.every((w, i) => 
      w !== null || isBoardFull(newBoards[i])
    );
    if (allBoardsDecided && !bigBoardWinner) {
      setIsDraw(true);
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      return;
    }

    // Set the next active board
    const nextBoard = cellIndex;
    if (newBoardWinners[nextBoard] || isBoardFull(newBoards[nextBoard])) {
      setActiveBoard(null); // Free choice
    } else {
      setActiveBoard(nextBoard);
    }

    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  }, [boards, boardWinners, currentPlayer, activeBoard, winner, isDraw]);

  const isBoardPlayable = (boardIndex: number) => {
    if (winner || isDraw) return false;
    if (boardWinners[boardIndex]) return false;
    if (activeBoard === null) return true;
    return activeBoard === boardIndex;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-lg mx-auto">
      {/* Score Board */}
      <div className="flex items-center gap-6 text-sm">
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
              Player {winner} Wins!
            </span>
          </motion.div>
        ) : isDraw ? (
          <div className="text-muted-foreground font-medium">It's a Draw!</div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current:</span>
            <span className={`font-bold ${currentPlayer === 'X' ? 'text-blue-400' : 'text-rose-400'}`}>
              Player {currentPlayer}
            </span>
            {activeBoard !== null && (
              <span className="text-xs text-muted-foreground">
                (Board {activeBoard + 1})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ultimate Board */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
        {boards.map((board, boardIndex) => (
          <motion.div
            key={boardIndex}
            className={`
              grid grid-cols-3 gap-0.5 p-1.5 rounded-lg transition-all duration-200
              ${isBoardPlayable(boardIndex) 
                ? 'bg-primary/10 ring-2 ring-primary/50' 
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
              <div className="col-span-3 row-span-3 flex items-center justify-center">
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
                  onClick={() => handleCellClick(boardIndex, cellIndex)}
                  disabled={!isBoardPlayable(boardIndex) || !!cell}
                  className={`
                    w-7 h-7 sm:w-8 sm:h-8 rounded text-sm font-bold
                    flex items-center justify-center
                    transition-all duration-150
                    ${cell ? '' : isBoardPlayable(boardIndex) ? 'hover:bg-primary/20 cursor-pointer' : 'cursor-not-allowed'}
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
            className="overflow-hidden"
          >
            <div className="p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 text-sm space-y-2">
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
