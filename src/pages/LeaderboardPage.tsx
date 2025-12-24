import { motion } from "framer-motion";
import DynamicIsland from "@/components/layout/DynamicIsland";
import Leaderboard from "@/components/TicTacToe/Leaderboard";
import ThemeToggle from "@/components/TicTacToe/ThemeToggle";
import SoundToggle from "@/components/TicTacToe/SoundToggle";
import { useNavigate } from "react-router-dom";

const LeaderboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <DynamicIsland />
      <ThemeToggle />
      <SoundToggle />

      <div className="pt-24 pb-16 px-6">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              Leaderboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Top players ranked by wins
            </p>
          </motion.div>

          <Leaderboard onBack={() => navigate("/")} />
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
