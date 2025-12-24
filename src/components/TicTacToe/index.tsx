import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import GameBoard from "./GameBoard";
import GameStatus from "./GameStatus";
import ScoreBoard from "./ScoreBoard";
import GameControls from "./GameControls";

const WINNING_COMBINATIONS = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];

const TicTacToe = () => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const checkWinner = useCallback((squares: (string | null)[]): { winner: string | null; line: number[] | null } => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: combination };
      }
    }
    return { winner: null, line: null };
  }, []);

  const { winner, line } = checkWinner(board);
  const isDraw = !winner && board.every((cell) => cell !== null);
  const gameOver = !!winner || isDraw;

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinningLine(result.line);
      setScores((prev) => ({
        ...prev,
        [result.winner as 'X' | 'O']: prev[result.winner as 'X' | 'O'] + 1,
      }));
    } else if (newBoard.every((cell) => cell !== null)) {
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
    } else {
      setCurrentPlayer((prev) => (prev === 'X' ? 'O' : 'X'));
    }
  }, [board, currentPlayer, gameOver, checkWinner]);

  const handleRestart = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinningLine(null);
  }, []);

  const handleResetScores = useCallback(() => {
    setScores({ X: 0, O: 0, draws: 0 });
    handleRestart();
  }, [handleRestart]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 30, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"
          animate={{ 
            x: [0, -50, 0], 
            y: [0, -30, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/5 blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Title */}
        <motion.h1
          className="text-4xl sm:text-5xl font-light text-center text-foreground tracking-tight"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Tic Tac Toe
        </motion.h1>

        {/* Game Status */}
        <GameStatus
          currentPlayer={currentPlayer}
          winner={winner}
          isDraw={isDraw}
        />

        {/* Game Board */}
        <GameBoard
          board={board}
          winningLine={winningLine || line}
          onCellClick={handleCellClick}
        />

        {/* Score Board */}
        <ScoreBoard scores={scores} />

        {/* Game Controls */}
        <GameControls
          onRestart={handleRestart}
          onResetScores={handleResetScores}
          gameOver={gameOver}
        />
      </motion.div>
    </div>
  );
};

export default TicTacToe;
