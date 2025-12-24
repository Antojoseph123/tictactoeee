import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import TicTacToe from "@/components/TicTacToe";
import DynamicIsland from "@/components/layout/DynamicIsland";
import ThemeToggle from "@/components/TicTacToe/ThemeToggle";
import SoundToggle from "@/components/TicTacToe/SoundToggle";
import { soundManager } from "@/utils/sounds";

const PlayGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    soundManager.playClick();
    navigate("/");
  };

  // Currently only TicTacToe is available
  if (gameId !== "tictactoe") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DynamicIsland />
        <ThemeToggle />
        <SoundToggle />
        
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-semibold text-foreground mb-4">
            Coming Soon
          </h1>
          <p className="text-muted-foreground mb-8">
            This game is still in development.
          </p>
          <motion.button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-button text-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to GameHub
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return <TicTacToe />;
};

export default PlayGame;
