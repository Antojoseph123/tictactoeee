import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import GameBoard from "./GameBoard";
import GameStatus from "./GameStatus";
import ScoreBoard from "./ScoreBoard";
import GameControls from "./GameControls";
import GameModeSelector, { type GameMode } from "./GameModeSelector";
import OnlineLobby from "./OnlineLobby";
import GameHistory from "./GameHistory";
import ReplayViewer from "./ReplayViewer";
import SoundToggle from "./SoundToggle";
import { soundManager } from "@/utils/sounds";
import { getAIMove, type Difficulty } from "@/utils/aiOpponent";
import { useGameHistory, type GameRecord } from "@/hooks/useGameHistory";
import { useOnlineGame } from "@/hooks/useOnlineGame";

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const TicTacToe = () => {
  // Game state
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [moves, setMoves] = useState<{ index: number; player: string }[]>([]);

  // Mode state
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [replayGame, setReplayGame] = useState<GameRecord | null>(null);

  // Hooks
  const { games, loading: historyLoading, saveGame, clearHistory } = useGameHistory();
  const onlineGame = useOnlineGame();

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

  // Handle game end
  useEffect(() => {
    if (gameOver && gameMode && gameMode !== 'online' && gameMode !== 'history') {
      if (winner) {
        soundManager.playWin();
        setWinningLine(line);
        setScores((prev) => ({
          ...prev,
          [winner as 'X' | 'O']: prev[winner as 'X' | 'O'] + 1,
        }));
      } else if (isDraw) {
        soundManager.playDraw();
        setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      }

      // Save game to history
      if (moves.length > 0) {
        saveGame(
          board,
          moves,
          winner || 'draw',
          gameMode,
          'Player 1',
          gameMode === 'ai' ? `AI (${aiDifficulty})` : 'Player 2',
          gameMode === 'ai' ? aiDifficulty : undefined
        );
      }
    }
  }, [gameOver, winner, isDraw]);

  // AI move logic
  useEffect(() => {
    if (gameMode !== 'ai' || gameOver || currentPlayer !== 'O' || isAIThinking) return;

    setIsAIThinking(true);
    const timer = setTimeout(() => {
      const aiMoveIndex = getAIMove(board, aiDifficulty);
      handleCellClick(aiMoveIndex, true);
      setIsAIThinking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPlayer, gameMode, gameOver, isAIThinking, board, aiDifficulty]);

  const handleCellClick = useCallback((index: number, isAI = false) => {
    if (board[index] || gameOver) return;
    if (gameMode === 'ai' && currentPlayer === 'O' && !isAI) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setMoves(prev => [...prev, { index, player: currentPlayer }]);

    // Play sound
    if (currentPlayer === 'X') {
      soundManager.playMoveX();
    } else {
      soundManager.playMoveO();
    }

    const result = checkWinner(newBoard);
    if (!result.winner && !newBoard.every(cell => cell !== null)) {
      setCurrentPlayer((prev) => (prev === 'X' ? 'O' : 'X'));
    }
  }, [board, currentPlayer, gameOver, checkWinner, gameMode]);

  // Online game move handler
  const handleOnlineMove = useCallback(async (index: number) => {
    if (!onlineGame.room || onlineGame.room.status !== 'playing') return;
    if (!onlineGame.isMyTurn) {
      soundManager.playError();
      return;
    }

    const success = await onlineGame.makeMove(index);
    if (success) {
      if (onlineGame.mySymbol === 'X') {
        soundManager.playMoveX();
      } else {
        soundManager.playMoveO();
      }
    }
  }, [onlineGame]);

  const handleRestart = useCallback(() => {
    soundManager.playClick();
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinningLine(null);
    setMoves([]);
    setIsAIThinking(false);
  }, []);

  const handleResetScores = useCallback(() => {
    soundManager.playClick();
    setScores({ X: 0, O: 0, draws: 0 });
    handleRestart();
  }, [handleRestart]);

  const handleSelectMode = useCallback((mode: GameMode, difficulty?: Difficulty) => {
    soundManager.playClick();
    setGameMode(mode);
    if (difficulty) {
      setAiDifficulty(difficulty);
    }
    handleRestart();
  }, [handleRestart]);

  const handleBackToMenu = useCallback(() => {
    soundManager.playClick();
    setGameMode(null);
    handleRestart();
    onlineGame.leaveRoom();
  }, [handleRestart, onlineGame]);

  // Render online game
  if (gameMode === 'online') {
    // Show lobby if no room or waiting
    if (!onlineGame.room || onlineGame.room.status === 'waiting') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
          <BackgroundDecorations />
          <SoundToggle />
          <motion.div
            className="relative z-10 w-full max-w-md space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl font-light text-center text-foreground tracking-tight"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Tic Tac Toe
            </motion.h1>
            <OnlineLobby
              room={onlineGame.room}
              isHost={onlineGame.isHost}
              loading={onlineGame.loading}
              error={onlineGame.error}
              onCreateRoom={onlineGame.createRoom}
              onJoinRoom={onlineGame.joinRoom}
              onBack={handleBackToMenu}
            />
          </motion.div>
        </div>
      );
    }

    // Show game
    if (onlineGame.game) {
      const onlineWinner = onlineGame.game.winner;
      const onlineIsDraw = onlineWinner === 'draw';
      const onlineGameOver = !!onlineWinner;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
          <BackgroundDecorations />
          <SoundToggle />
          <motion.div
            className="relative z-10 w-full max-w-md space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl font-light text-center text-foreground tracking-tight"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Tic Tac Toe
            </motion.h1>

            {/* Room info */}
            <motion.div
              className="glass-panel rounded-2xl p-3 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex justify-between items-center text-sm">
                <span className="marker-x">{onlineGame.room.host_name} (X)</span>
                <span className="text-muted-foreground">vs</span>
                <span className="marker-o">{onlineGame.room.guest_name} (O)</span>
              </div>
            </motion.div>

            <GameStatus
              currentPlayer={onlineGame.game.current_player as 'X' | 'O'}
              winner={onlineWinner === 'draw' ? null : onlineWinner}
              isDraw={onlineIsDraw}
            />

            {!onlineGameOver && (
              <motion.p
                className="text-center text-sm text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {onlineGame.isMyTurn ? "Your turn!" : "Waiting for opponent..."}
              </motion.p>
            )}

            <GameBoard
              board={onlineGame.game.board}
              winningLine={onlineGameOver && !onlineIsDraw ? getWinningLine(onlineGame.game.board) : null}
              onCellClick={handleOnlineMove}
            />

            <motion.button
              onClick={handleBackToMenu}
              className="glass-button rounded-xl px-6 py-3 flex items-center gap-2 mx-auto text-muted-foreground"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              Leave Game
            </motion.button>
          </motion.div>
        </div>
      );
    }
  }

  // Render history view
  if (gameMode === 'history') {
    if (replayGame) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
          <BackgroundDecorations />
          <SoundToggle />
          <motion.div
            className="relative z-10 w-full max-w-md space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ReplayViewer game={replayGame} onBack={() => setReplayGame(null)} />
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <BackgroundDecorations />
        <SoundToggle />
        <motion.div
          className="relative z-10 w-full max-w-md space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl font-light text-center text-foreground tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Tic Tac Toe
          </motion.h1>
          <GameHistory
            games={games}
            loading={historyLoading}
            onBack={handleBackToMenu}
            onClearHistory={clearHistory}
            onReplay={setReplayGame}
          />
        </motion.div>
      </div>
    );
  }

  // Render mode selector
  if (!gameMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <BackgroundDecorations />
        <SoundToggle />
        <motion.div
          className="relative z-10 w-full max-w-md space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl font-light text-center text-foreground tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Tic Tac Toe
          </motion.h1>
          <GameModeSelector onSelectMode={handleSelectMode} />
        </motion.div>
      </div>
    );
  }

  // Render local/AI game
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <BackgroundDecorations />
      <SoundToggle />

      <motion.div
        className="relative z-10 w-full max-w-md space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-4">
          <motion.button
            onClick={handleBackToMenu}
            className="glass-button rounded-full p-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <motion.h1
            className="text-4xl sm:text-5xl font-light text-center text-foreground tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Tic Tac Toe
          </motion.h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {gameMode === 'ai' && (
          <motion.p
            className="text-center text-sm text-muted-foreground capitalize"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            vs AI ({aiDifficulty})
          </motion.p>
        )}

        <GameStatus
          currentPlayer={currentPlayer}
          winner={winner}
          isDraw={isDraw}
        />

        {gameMode === 'ai' && isAIThinking && !gameOver && (
          <motion.p
            className="text-center text-sm text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            AI is thinking...
          </motion.p>
        )}

        <GameBoard
          board={board}
          winningLine={winningLine || line}
          onCellClick={handleCellClick}
        />

        <ScoreBoard scores={scores} />

        <GameControls
          onRestart={handleRestart}
          onResetScores={handleResetScores}
          gameOver={gameOver}
        />
      </motion.div>
    </div>
  );
};

// Background decorations component
const BackgroundDecorations = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
      animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"
      animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/5 blur-3xl"
      animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

// Helper function
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

export default TicTacToe;
