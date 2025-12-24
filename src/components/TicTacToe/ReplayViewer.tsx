import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import type { GameRecord } from "@/hooks/useGameHistory";
import { soundManager } from "@/utils/sounds";
import GameBoard from "./GameBoard";

interface ReplayViewerProps {
  game: GameRecord;
  onBack: () => void;
}

const ReplayViewer = ({ game, onBack }: ReplayViewerProps) => {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));

  // Build board state up to current move
  useEffect(() => {
    const newBoard: (string | null)[] = Array(9).fill(null);
    for (let i = 0; i < currentMoveIndex; i++) {
      const move = game.moves[i];
      if (move) {
        newBoard[move.index] = move.player;
      }
    }
    setBoard(newBoard);
  }, [currentMoveIndex, game.moves]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;
    
    if (currentMoveIndex >= game.moves.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentMoveIndex(prev => prev + 1);
      soundManager.playClick();
    }, 800);

    return () => clearTimeout(timer);
  }, [isPlaying, currentMoveIndex, game.moves.length]);

  const handlePlayPause = () => {
    soundManager.playClick();
    if (currentMoveIndex >= game.moves.length) {
      setCurrentMoveIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepBack = () => {
    soundManager.playClick();
    setIsPlaying(false);
    setCurrentMoveIndex(prev => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    soundManager.playClick();
    setIsPlaying(false);
    setCurrentMoveIndex(prev => Math.min(game.moves.length, prev + 1));
  };

  const handleReset = () => {
    soundManager.playClick();
    setIsPlaying(false);
    setCurrentMoveIndex(0);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center">
        <h2 className="text-2xl font-light text-foreground">
          {game.player_x} vs {game.player_o}
        </h2>
        <p className="text-muted-foreground text-sm">
          {game.winner === 'draw' ? 'Draw' : `${game.winner === 'X' ? game.player_x : game.player_o} won`}
        </p>
      </div>

      <GameBoard
        board={board}
        winningLine={currentMoveIndex >= game.moves.length ? getWinningLine(board) : null}
        onCellClick={() => {}}
      />

      {/* Playback controls */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-center gap-4">
          <motion.button
            onClick={handleReset}
            className="glass-button rounded-lg p-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

          <motion.button
            onClick={handleStepBack}
            className="glass-button rounded-lg p-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={currentMoveIndex === 0}
          >
            <SkipBack className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={handlePlayPause}
            className="glass-button rounded-xl p-3"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-primary" />
            ) : (
              <Play className="w-6 h-6 text-primary" />
            )}
          </motion.button>

          <motion.button
            onClick={handleStepForward}
            className="glass-button rounded-lg p-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={currentMoveIndex >= game.moves.length}
          >
            <SkipForward className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(currentMoveIndex / game.moves.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            {currentMoveIndex}/{game.moves.length}
          </span>
        </div>
      </div>

      <motion.button
        onClick={() => { soundManager.playClick(); onBack(); }}
        className="glass-button rounded-xl px-6 py-3 flex items-center gap-2 mx-auto text-muted-foreground"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Back to History
      </motion.button>
    </motion.div>
  );
};

// Helper to get winning line
const getWinningLine = (board: (string | null)[]): number[] | null => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
};

export default ReplayViewer;
