import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Gamepad2, Grid3X3, Puzzle, Zap, Target, 
  Bird, Rocket, Brain, Hammer, Play, ArrowRight, ArrowLeft, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { soundManager } from "@/utils/sounds";
import DynamicIsland from "@/components/layout/DynamicIsland";
import ThemeToggle from "@/components/TicTacToe/ThemeToggle";
import SoundToggle from "@/components/TicTacToe/SoundToggle";

interface Game {
  id: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  color: string;
  available: boolean;
  featured?: boolean;
}

const games: Game[] = [
  {
    id: "tictactoe",
    title: "Tic Tac Toe",
    tagline: "Classic strategy. Redefined.",
    icon: Grid3X3,
    color: "from-blue-500 to-cyan-400",
    available: true,
    featured: true,
  },
  {
    id: "snake",
    title: "Snake",
    tagline: "Neon glow. Endless chase.",
    icon: Zap,
    color: "from-green-500 to-emerald-400",
    available: true,
  },
  {
    id: "tetris",
    title: "Tetris",
    tagline: "Glass blocks. Perfect fit.",
    icon: Puzzle,
    color: "from-purple-500 to-pink-400",
    available: true,
  },
  {
    id: "breakout",
    title: "Breakout",
    tagline: "Physics-powered destruction.",
    icon: Target,
    color: "from-orange-500 to-red-400",
    available: true,
  },
  {
    id: "flappybird",
    title: "Flappy Bird",
    tagline: "One tap. Infinite challenge.",
    icon: Bird,
    color: "from-yellow-500 to-orange-400",
    available: true,
  },
  {
    id: "pong",
    title: "Pong",
    tagline: "Retro glory. Neon paddles.",
    icon: Gamepad2,
    color: "from-cyan-500 to-blue-400",
    available: true,
  },
  {
    id: "spaceinvaders",
    title: "Space Invaders",
    tagline: "Defend. Destroy. Survive.",
    icon: Rocket,
    color: "from-indigo-500 to-purple-400",
    available: true,
  },
  {
    id: "simonsays",
    title: "Simon Says",
    tagline: "Memory. Melody. Mastery.",
    icon: Brain,
    color: "from-pink-500 to-rose-400",
    available: true,
  },
  {
    id: "whackamole",
    title: "Whack-a-Mole",
    tagline: "Quick reflexes required.",
    icon: Hammer,
    color: "from-amber-500 to-yellow-400",
    available: true,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
} as const;

const GameHub = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleGameClick = (game: Game) => {
    soundManager.playClick();
    navigate(`/play/${game.id}`);
  };

  const featuredGame = games.find((g) => g.featured);

  const scrollToArcadeCollection = () => {
    soundManager.playClick();
    const el = document.getElementById("arcade-collection");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen smooth-scroll">
      <DynamicIsland />
      <ThemeToggle />
      <SoundToggle />
      
      {/* Back to Home Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 rounded-full glass-button"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* Hero Section - Apple Style */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{ background: "var(--gradient-hero)" }}
        />

        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className="feature-badge mb-6 inline-block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            GameHub Arcade
          </motion.span>

          <h1 className="hero-title mb-6">
            Play.
            <br />
            <span className="titanium-text">Compete.</span>
            <br />
            Dominate.
          </h1>

          <p className="hero-subtitle max-w-xl mx-auto mb-10">
            A collection of beautifully crafted arcade games.
            Built with precision. Designed for champions.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={() => navigate("/play/tictactoe")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-5 h-5" />
              Play Now
            </motion.button>
            <motion.button
              onClick={scrollToArcadeCollection}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-button text-foreground font-medium text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Arcade Collection
              <ChevronDown className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => navigate("/games")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-button text-foreground font-medium text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View All Games
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          type="button"
          onClick={scrollToArcadeCollection}
          aria-label="Scroll to arcade collection"
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </motion.button>
      </section>

      {/* Featured Game Section */}
      {featuredGame && (
        <section className="px-6 py-20">
          <motion.div
            className="max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="bento-card overflow-hidden cursor-pointer group"
              onClick={() => handleGameClick(featuredGame)}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex flex-col lg:flex-row items-center gap-8 p-8 lg:p-12">
                <div className="flex-1">
                  <span className="text-sm font-medium text-primary mb-2 block">Featured</span>
                  <h2 className="text-4xl lg:text-5xl font-semibold text-foreground mb-4">
                    {featuredGame.title}
                  </h2>
                  <p className="text-xl text-muted-foreground mb-6">
                    {featuredGame.tagline}
                  </p>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="font-medium">Play Now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
                <div 
                  className={`w-40 h-40 lg:w-56 lg:h-56 rounded-3xl bg-gradient-to-br ${featuredGame.color} flex items-center justify-center`}
                >
                  <featuredGame.icon className="w-20 h-20 lg:w-28 lg:h-28 text-white" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* Bento Grid Games */}
      <section id="arcade-collection" className="px-6 py-20">
        <motion.div
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2
            className="text-3xl lg:text-4xl font-semibold text-foreground text-center mb-4"
            variants={itemVariants}
          >
            The Arcade Collection
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-center mb-12 max-w-xl mx-auto"
            variants={itemVariants}
          >
            Classic games, reimagined with stunning visuals and modern mechanics.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.filter(g => !g.featured).map((game, index) => (
              <motion.div
                key={game.id}
                variants={itemVariants}
                className="bento-card cursor-pointer group"
                onClick={() => handleGameClick(game)}
              >
                <div 
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4`}
                >
                  <game.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {game.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {game.tagline}
                </p>
                <motion.button
                  className={`w-full py-2.5 px-4 rounded-xl bg-gradient-to-r ${game.color} text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGameClick(game);
                  }}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Now</span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20 border-t border-border">
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {[
            { label: "Games", value: "9" },
            { label: "Players", value: "1K+" },
            { label: "Matches", value: "50K+" },
            { label: "Countries", value: "25+" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl lg:text-5xl font-semibold titanium-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>Built with ❤️ using React, Framer Motion & Lovable Cloud</p>
        </div>
      </footer>
    </div>
  );
};

export default GameHub;
