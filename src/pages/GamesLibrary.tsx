import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Grid3X3, Puzzle, Zap, Target, Bird, Gamepad2, 
  Rocket, Brain, Hammer, ArrowRight, Lock
} from "lucide-react";
import DynamicIsland from "@/components/layout/DynamicIsland";
import ThemeToggle from "@/components/TicTacToe/ThemeToggle";
import SoundToggle from "@/components/TicTacToe/SoundToggle";
import { soundManager } from "@/utils/sounds";

interface Game {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  color: string;
  available: boolean;
}

const games: Game[] = [
  {
    id: "tictactoe",
    title: "Tic Tac Toe",
    tagline: "Classic strategy. Redefined.",
    description: "The timeless game of X's and O's with AI opponents, online multiplayer, and beautiful glass-morphic design.",
    icon: Grid3X3,
    color: "from-blue-500 to-cyan-400",
    available: true,
  },
  {
    id: "snake",
    title: "Snake",
    tagline: "Neon glow. Endless chase.",
    description: "Guide your snake through a neon world. Collect food, grow longer, and avoid colliding with yourself.",
    icon: Zap,
    color: "from-green-500 to-emerald-400",
    available: false,
  },
  {
    id: "tetris",
    title: "Tetris",
    tagline: "Glass blocks. Perfect fit.",
    description: "Stack falling tetrominoes with glass-morphic effects. Clear lines and achieve the highest score.",
    icon: Puzzle,
    color: "from-purple-500 to-pink-400",
    available: false,
  },
  {
    id: "breakout",
    title: "Breakout",
    tagline: "Physics-powered destruction.",
    description: "Bounce the ball to break all bricks. Features multi-hit blocks and realistic physics.",
    icon: Target,
    color: "from-orange-500 to-red-400",
    available: false,
  },
  {
    id: "flappybird",
    title: "Flappy Bird",
    tagline: "One tap. Infinite challenge.",
    description: "Navigate through pipes with precise timing. Features parallax backgrounds and high score tracking.",
    icon: Bird,
    color: "from-yellow-500 to-orange-400",
    available: false,
  },
  {
    id: "pong",
    title: "Pong",
    tagline: "Retro glory. Neon paddles.",
    description: "The original arcade classic with glowing paddles and an AI opponent that adapts to your skill.",
    icon: Gamepad2,
    color: "from-cyan-500 to-blue-400",
    available: false,
  },
  {
    id: "spaceinvaders",
    title: "Space Invaders",
    tagline: "Defend. Destroy. Survive.",
    description: "Protect Earth from waves of alien invaders. Features grid formations and escalating difficulty.",
    icon: Rocket,
    color: "from-indigo-500 to-purple-400",
    available: false,
  },
  {
    id: "simon",
    title: "Simon Says",
    tagline: "Memory. Melody. Mastery.",
    description: "Test your memory with color and sound sequences. Progressive difficulty challenges your limits.",
    icon: Brain,
    color: "from-pink-500 to-rose-400",
    available: false,
  },
  {
    id: "whackamole",
    title: "Whack-a-Mole",
    tagline: "Quick reflexes required.",
    description: "Test your reaction time as moles pop up randomly. Features 3D animations and hammer effects.",
    icon: Hammer,
    color: "from-amber-500 to-yellow-400",
    available: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
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

const GamesLibrary = () => {
  const navigate = useNavigate();

  const handleGameClick = (game: Game) => {
    soundManager.playClick();
    if (game.available) {
      navigate(`/play/${game.id}`);
    }
  };

  return (
    <div className="min-h-screen">
      <DynamicIsland />
      <ThemeToggle />
      <SoundToggle />

      <div className="pt-24 pb-16 px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h1 className="text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              Games Library
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your challenge. Each game is crafted with stunning visuals
              and smooth mechanics.
            </p>
          </motion.div>

          {/* Games Grid */}
          <div className="grid gap-6">
            {games.map((game) => (
              <motion.div
                key={game.id}
                variants={itemVariants}
                className={`bento-card group cursor-pointer ${!game.available ? "opacity-70" : ""}`}
                onClick={() => handleGameClick(game)}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Icon */}
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <game.icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-semibold text-foreground">
                        {game.title}
                      </h3>
                      {!game.available && (
                        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          <Lock className="w-3 h-3" />
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-primary font-medium mb-2">{game.tagline}</p>
                    <p className="text-muted-foreground">{game.description}</p>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {game.available ? (
                      <motion.div
                        className="flex items-center gap-2 text-primary font-medium"
                        whileHover={{ x: 4 }}
                      >
                        <span>Play Now</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        In Development
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GamesLibrary;
