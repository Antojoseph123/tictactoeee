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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <CasinoNav />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="px-6 py-24 text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-semibold text-foreground mb-4 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Built for players who<br />understand variance.
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground text-lg max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Demo mode. No real money.
          </motion.p>
        </section>

        {/* Balance */}
        <div className="max-w-4xl mx-auto px-6">
          <BalanceBar balance={balance} onReset={resetBalance} />
        </div>

        {/* Games Grid */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-6">
            Select Game
          </h2>
          
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
                <game.icon className="w-8 h-8 text-muted-foreground mb-4" />
                <span className="text-lg font-medium text-foreground">{game.name}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center">
          <p className="text-xs text-muted-foreground">
            Demo platform. For entertainment only.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CasinoHome;
