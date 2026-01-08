import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dices, TrendingUp, Bomb, Target, Circle, Spade } from "lucide-react";
import CasinoNav from "@/components/casino/CasinoNav";
import BalanceBar from "@/components/casino/BalanceBar";
import { useCasinoBalance } from "@/hooks/useCasinoBalance";

interface CasinoGame {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

const games: CasinoGame[] = [
  { id: "dice", name: "Dice", icon: Dices, description: "Roll the odds" },
  { id: "crash", name: "Crash", icon: TrendingUp, description: "Time your exit" },
  { id: "mines", name: "Mines", icon: Bomb, description: "Navigate the field" },
  { id: "plinko", name: "Plinko", icon: Circle, description: "Watch it fall" },
  { id: "roulette", name: "Roulette", icon: Target, description: "Spin the wheel" },
  { id: "blackjack", name: "Blackjack", icon: Spade, description: "Beat the dealer" },
];

const CasinoHome = () => {
  const navigate = useNavigate();
  const { balance, isLoading, resetBalance } = useCasinoBalance();

  const handleGameSelect = (gameId: string) => {
    navigate(`/play/${gameId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <CasinoNav />
      
      <main className="pt-24">
        {/* Hero */}
        <section className="px-6 py-24 md:py-32 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Decorative line */}
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-strong to-transparent" />
              <span className="text-accent text-xs tracking-[0.3em] uppercase font-medium">Est. 2024</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-strong to-transparent" />
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-text tracking-tight leading-[1.1]">
              Built for players<br />
              <span className="text-text-muted">who understand risk.</span>
            </h1>
            
            <p className="text-text-muted text-lg md:text-xl max-w-xl leading-relaxed">
              No distractions. No demos. Just precision casino games with real variance.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
              <motion.button
                onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative px-10 py-5 font-semibold text-lg overflow-hidden rounded-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Button background with gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary-muted" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {/* Shine effect */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative text-white">Enter Casino</span>
              </motion.button>
              
              <button
                onClick={() => navigate("/auth")}
                className="text-text-dim text-sm hover:text-text-muted transition-colors underline underline-offset-4 decoration-text-dim/30"
              >
                Sign in to track balance
              </button>
            </div>
          </motion.div>
        </section>

        {/* Balance */}
        <div className="max-w-5xl mx-auto px-6">
          <BalanceBar balance={balance} onReset={resetBalance} />
        </div>

        {/* Games Grid */}
        <section id="games" className="max-w-5xl mx-auto px-6 py-20">
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-3 tracking-tight">
              Casino Games
            </h2>
            <p className="text-text-muted">
              Core mechanics. Transparent odds. Designed to scale.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game, index) => (
              <motion.button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="group relative p-8 text-left rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Icon container */}
                <div className="relative mb-6 w-14 h-14 rounded-xl bg-surface-elevated border border-border flex items-center justify-center group-hover:border-primary/20 transition-colors">
                  <game.icon className="w-6 h-6 text-text-muted group-hover:text-accent transition-colors duration-300" />
                </div>
                
                <h3 className="relative text-xl font-semibold text-text mb-1 group-hover:text-white transition-colors">
                  {game.name}
                </h3>
                <p className="relative text-sm text-text-dim group-hover:text-text-muted transition-colors">
                  {game.description}
                </p>

                {/* Arrow indicator */}
                <div className="absolute top-8 right-8 text-text-dim opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  →
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-border">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8 text-text-dim text-sm">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-casino-win" />
                Provably fair
              </span>
              <span>Instant play</span>
              <span>No downloads</span>
            </div>
            <p className="text-text-dim text-sm">
              © 2024 GameHub Casino
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CasinoHome;
