import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dices, TrendingUp, Bomb, Circle, Target, Spade, Shield, Zap, BarChart3, ChevronRight } from "lucide-react";
import CasinoNav from "@/components/casino/CasinoNav";
import BalanceBar from "@/components/casino/BalanceBar";
import { useCasinoBalance } from "@/hooks/useCasinoBalance";

interface CasinoGame {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  multiplier: string;
}

const games: CasinoGame[] = [
  { id: "dice", name: "Dice", icon: Dices, description: "Roll the odds", multiplier: "Up to 99x" },
  { id: "crash", name: "Crash", icon: TrendingUp, description: "Time your exit", multiplier: "Unlimited" },
  { id: "mines", name: "Mines", icon: Bomb, description: "Navigate the field", multiplier: "Up to 24x" },
  { id: "plinko", name: "Plinko", icon: Circle, description: "Watch it fall", multiplier: "Up to 1000x" },
  { id: "roulette", name: "Roulette", icon: Target, description: "Spin the wheel", multiplier: "Up to 36x" },
  { id: "blackjack", name: "Blackjack", icon: Spade, description: "Beat the dealer", multiplier: "2.5x" },
];

const features = [
  { icon: Shield, title: "Provably Fair", description: "Every outcome verifiable on-chain" },
  { icon: Zap, title: "Instant Payouts", description: "No waiting, no limits" },
  { icon: BarChart3, title: "Real Variance", description: "True randomness, true odds" },
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
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <CasinoNav />
      
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary glow */}
        <div className="hero-glow top-[-200px] left-1/2 -translate-x-1/2" />
        {/* Secondary glow */}
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(42 65% 55% / 0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
            top: '60%',
            right: '-10%',
          }}
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(0 0% 100% / 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(0 0% 100% / 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      
      <main className="relative pt-32">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 glass-card"
            >
              <span className="w-2 h-2 rounded-full bg-casino-win animate-pulse" />
              <span className="text-sm font-medium text-text-muted">Live Demo Mode</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-text tracking-tight leading-[1.05] mb-8">
              Built for players<br />
              <span className="text-gradient-gold">who understand risk.</span>
            </h1>
            
            <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
              No distractions. No demos. Just precision casino games with real variance. 
              Experience the future of online gaming.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-cta text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Enter Casino
                  <ChevronRight className="w-5 h-5" />
                </span>
              </motion.button>
              
              <button
                onClick={() => navigate("/auth")}
                className="px-6 py-4 text-text-muted text-sm font-medium hover:text-text transition-colors"
              >
                Sign in to track balance →
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats Bar */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <motion.div 
            className="glass-panel p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "$2.4M+", label: "Total Wagered" },
                { value: "50K+", label: "Games Played" },
                { value: "99.1%", label: "Payout Rate" },
                { value: "24/7", label: "Uptime" },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <p className="text-3xl md:text-4xl font-bold text-text mb-1">{stat.value}</p>
                  <p className="text-sm text-text-dim">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Balance */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          <BalanceBar balance={balance} onReset={resetBalance} />
        </div>

        {/* Games Grid */}
        <section id="games" className="max-w-6xl mx-auto px-6 py-20">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-label mb-4 block">Our Games</span>
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4 tracking-tight">
              Casino Games
            </h2>
            <p className="text-text-muted text-lg max-w-xl mx-auto">
              Core mechanics. Transparent odds. Designed to scale.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {games.map((game, index) => (
              <motion.button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="game-card-premium p-8 text-left group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                {/* Icon container */}
                <div className="relative mb-6 w-16 h-16 rounded-2xl bg-surface-elevated/50 border border-border flex items-center justify-center group-hover:border-primary/30 transition-all duration-500">
                  <game.icon className="w-7 h-7 text-text-muted group-hover:text-accent transition-colors duration-500" />
                  {/* Icon glow */}
                  <div className="absolute inset-0 rounded-2xl bg-accent/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                </div>
                
                <div className="relative">
                  <h3 className="text-2xl font-semibold text-text mb-2 group-hover:text-white transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-sm text-text-dim mb-4 group-hover:text-text-muted transition-colors">
                    {game.description}
                  </p>
                  
                  {/* Multiplier badge */}
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-elevated/50 border border-border">
                    <span className="text-xs font-medium text-accent">{game.multiplier}</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="absolute top-8 right-8 text-text-dim opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-label mb-4 block">Why Choose Us</span>
            <h2 className="text-4xl md:text-5xl font-bold text-text tracking-tight">
              Built Different
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="feature-card text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">{feature.title}</h3>
                <p className="text-text-muted">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <motion.div 
            className="glass-panel p-12 md:p-16 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Ready to play?
            </h2>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Start with $1,000 in demo credits. No sign up required.
            </p>
            <motion.button
              onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-cta text-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">Start Playing</span>
            </motion.button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-16 border-t border-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-primary to-primary-muted flex items-center justify-center">
                  <span className="text-white font-bold">G</span>
                </div>
                <span className="text-xl font-semibold text-text">
                  Game<span className="text-primary">Hub</span>
                </span>
              </div>

              {/* Links */}
              <div className="flex items-center gap-8 text-sm text-text-dim">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-casino-win" />
                  Provably fair
                </span>
                <span>Instant play</span>
                <span>No downloads</span>
              </div>

              {/* Copyright */}
              <p className="text-text-dim text-sm">
                © 2024 GameHub
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CasinoHome;