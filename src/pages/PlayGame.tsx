import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import TicTacToe from "@/components/TicTacToe";
import { SnakeGame } from "@/components/games/Snake/SnakeGame";
import { TetrisGame } from "@/components/games/Tetris/TetrisGame";
import { BreakoutGame } from "@/components/games/Breakout/BreakoutGame";
import { FlappyBirdGame } from "@/components/games/FlappyBird/FlappyBirdGame";
import { PongGame } from "@/components/games/Pong/PongGame";
import { SpaceInvadersGame } from "@/components/games/SpaceInvaders/SpaceInvadersGame";
import { SimonSaysGame } from "@/components/games/SimonSays/SimonSaysGame";
import { WhackAMoleGame } from "@/components/games/WhackAMole/WhackAMoleGame";
import { UltimateTicTacToeGame } from "@/components/games/UltimateTicTacToe/UltimateTicTacToeGame";
import DynamicIsland from "@/components/layout/DynamicIsland";
import ThemeToggle from "@/components/TicTacToe/ThemeToggle";
import SoundToggle from "@/components/TicTacToe/SoundToggle";
import { soundManager } from "@/utils/sounds";

const gameComponents: Record<string, React.ComponentType> = {
  tictactoe: TicTacToe,
  ultimatetictactoe: UltimateTicTacToeGame,
  snake: SnakeGame,
  tetris: TetrisGame,
  breakout: BreakoutGame,
  flappybird: FlappyBirdGame,
  pong: PongGame,
  spaceinvaders: SpaceInvadersGame,
  simonsays: SimonSaysGame,
  whackamole: WhackAMoleGame,
};

const PlayGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    soundManager.playClick();
    navigate("/games");
  };

  const GameComponent = gameId ? gameComponents[gameId] : null;

  if (!GameComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <DynamicIsland />
        <ThemeToggle />
        <SoundToggle />
        
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-semibold text-foreground mb-4">
            Game Not Found
          </h1>
          <p className="text-muted-foreground mb-8">
            This game doesn't exist yet.
          </p>
          <motion.button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-button text-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Games
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with controls */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        <motion.button
          onClick={handleBack}
          className="p-3 rounded-full glass-button text-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        
        <div className="flex items-center gap-2">
          <SoundToggle className="glass-button rounded-full p-3" />
          <ThemeToggle className="glass-button rounded-full p-3" />
        </div>
      </div>

      {/* Game content with top padding for header */}
      <div className="pt-20">
        <GameComponent />
      </div>
    </div>
  );
};

export default PlayGame;
