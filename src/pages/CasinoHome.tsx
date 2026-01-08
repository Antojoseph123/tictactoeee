import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dices, TrendingUp, Bomb, Target } from "lucide-react";
import CasinoNav from "@/components/casino/CasinoNav";
import BalanceBar from "@/components/casino/BalanceBar";
import { useCasinoBalance } from "@/hooks/useCasinoBalance";

interface CasinoGame {
  id: string;
  name: string;
  icon: React.ElementType;
}

const games: CasinoGame[] = [
  { id: "dice", name: "Dice", icon: Dices },
  { id: "crash", name: "Crash", icon: TrendingUp },
  { id: "mines", name: "Mines", icon: Bomb },
  { id: "plinko", name: "Plinko", icon: Target },
  { id: "roulette", name: "Roulette", icon: Target },
  { id: "blackjack", name: "Blackjack", icon: Target },
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
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <CasinoNav />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="px-6 py-32 text-center max-w-2xl mx-auto">
          <motion.h1 
            className="text-4xl md:text-5xl font-semibold text-text mb-6 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Built for players who understand risk.
          </motion.h1>
          
          <motion.p 
            className="text-text-muted text-lg mb-12 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            No distractions. No demos. Just precision casino games with real variance.
          </motion.p>

          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <button
              onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary text-lg"
            >
              Enter Casino
            </button>
            
            <button
              onClick={() => navigate("/auth")}
              className="text-text-dim text-sm hover:text-text-muted transition-colors"
            >
              Sign in to track balance
            </button>
          </motion.div>
        </section>

        {/* Balance */}
        <div className="max-w-4xl mx-auto px-6">
          <BalanceBar balance={balance} onReset={resetBalance} />
        </div>

        {/* Games Grid */}
        <section id="games" className="max-w-4xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-2">
              Casino Games
            </h2>
            <p className="text-text-muted text-sm">
              Core mechanics. Transparent odds. Designed to scale.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {games.map((game, index) => (
              <motion.button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="game-card p-6 text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <game.icon className="w-8 h-8 text-text-muted mb-4" />
                <span className="text-lg font-medium text-text">{game.name}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 text-center border-t border-border">
          <p className="text-text-dim text-sm">
            Provably fair · Instant play · No downloads
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CasinoHome;
