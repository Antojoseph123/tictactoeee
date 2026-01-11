import { useNavigate } from "react-router-dom";
import { Dices, TrendingUp, Bomb, Circle, Target, Spade, Home, Gamepad2, Gift, Search, Wallet, ChevronDown, Menu, X, Star, Users, Settings, HelpCircle, Globe } from "lucide-react";
import { useCasinoBalance } from "@/hooks/useCasinoBalance";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { motion } from "framer-motion";

interface CasinoGame {
  id: string;
  name: string;
  icon: React.ElementType;
  category: string;
  players?: number;
}

const games: CasinoGame[] = [
  { id: "dice", name: "Dice", icon: Dices, category: "originals", players: 142 },
  { id: "crash", name: "Crash", icon: TrendingUp, category: "originals", players: 89 },
  { id: "mines", name: "Mines", icon: Bomb, category: "originals", players: 56 },
  { id: "plinko", name: "Plinko", icon: Circle, category: "originals", players: 34 },
  { id: "roulette", name: "Roulette", icon: Target, category: "table", players: 78 },
  { id: "blackjack", name: "Blackjack", icon: Spade, category: "table", players: 112 },
];

const sidebarNav = [
  { icon: Home, label: "Casino", href: "/" },
  { icon: Gift, label: "Promotions", href: "#" },
  { icon: Star, label: "VIP Club", href: "#" },
  { icon: Users, label: "Affiliate", href: "#" },
];

const sidebarFooter = [
  { icon: HelpCircle, label: "Live Support" },
  { icon: Globe, label: "English" },
];

const CasinoHome = () => {
  const navigate = useNavigate();
  const { balance, isLoading, resetBalance } = useCasinoBalance();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleGameSelect = (gameId: string) => {
    navigate(`/play/${gameId}`);
  };

  const filteredGames = searchQuery 
    ? games.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : games;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 bottom-0 w-[220px] bg-surface z-50 flex flex-col
        transform transition-transform lg:translate-x-0 border-r border-border
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Stake</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-surface-elevated rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {sidebarNav.map((item, i) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  i === 0 
                    ? 'bg-surface-elevated text-text' 
                    : 'text-text-muted hover:bg-surface-elevated hover:text-text'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="h-px bg-border my-4" />

          {/* Games Section */}
          <div>
            <p className="text-xs text-text-dim uppercase tracking-wider px-3 mb-2 font-medium">
              Originals
            </p>
            <div className="space-y-1">
              {games.filter(g => g.category === 'originals').map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-elevated hover:text-text transition-colors"
                >
                  <game.icon className="w-5 h-5" />
                  {game.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-text-dim uppercase tracking-wider px-3 mb-2 font-medium">
              Table Games
            </p>
            <div className="space-y-1">
              {games.filter(g => g.category === 'table').map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-elevated hover:text-text transition-colors"
                >
                  <game.icon className="w-5 h-5" />
                  {game.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Nav */}
        <div className="border-t border-border p-3 space-y-1">
          {sidebarFooter.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-elevated hover:text-text transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-[220px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 h-16 bg-bg/95 backdrop-blur-sm border-b border-border px-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-surface rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-bold">Stake</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance */}
            <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <ChevronDown className="w-3.5 h-3.5 text-text-dim" />
            </div>

            {/* Auth */}
            {user ? (
              <button
                onClick={() => navigate("/profile")}
                className="px-4 py-2 bg-surface-elevated hover:bg-surface-hover rounded-lg text-sm font-medium transition-colors"
              >
                Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="hidden sm:block px-4 py-2 bg-surface-elevated hover:bg-surface-hover rounded-lg text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-sm font-semibold text-white transition-colors"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Hero Section - Stake style */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Main hero */}
              <div className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2c38] to-[#0f1923] p-6 lg:p-8">
                <div className="relative z-10 max-w-md">
                  <h1 className="text-2xl lg:text-4xl font-bold mb-3">
                    World's Largest Online Casino
                  </h1>
                  <p className="text-text-muted mb-6">
                    Provably fair games with instant payouts. Start with $1,000 demo balance.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => navigate("/auth")}
                      className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg text-sm font-semibold text-white transition-colors"
                    >
                      Register
                    </button>
                    <div className="flex items-center gap-2 text-xs text-text-dim">
                      <span>Or sign up with</span>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center hover:bg-surface-elevated cursor-pointer transition-colors">
                          <span className="text-lg">G</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Background decoration */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20">
                  <div className="absolute inset-0 bg-gradient-to-l from-primary/30 to-transparent" />
                </div>
              </div>

              {/* Side cards - like Casino/Sports on Stake */}
              <div className="flex lg:flex-col gap-4 lg:w-64">
                <div 
                  onClick={() => handleGameSelect('dice')}
                  className="flex-1 relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-4 cursor-pointer hover:border-primary/40 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Casino</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span>{games.reduce((acc, g) => acc + (g.players || 0), 0).toLocaleString()} playing</span>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 p-4 cursor-pointer hover:border-accent/40 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-accent" />
                    <span className="font-semibold">Sports</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span>Coming soon</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search bar - Stake style */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center">
              <button className="px-4 py-2 bg-surface-elevated rounded-lg text-sm font-medium flex items-center gap-2">
                Casino
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input 
                type="text"
                placeholder="Search your game"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-surface rounded-lg text-sm outline-none placeholder:text-text-dim focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Trending Games Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Trending Games</h2>
              </div>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-elevated flex items-center justify-center transition-colors">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <button className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-elevated flex items-center justify-center transition-colors">
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>

            {/* Games grid - Stake style cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredGames.map((game, index) => (
                <motion.button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-surface-elevated to-surface"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  {/* Game icon/visual */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      game.category === 'originals' 
                        ? 'bg-gradient-to-br from-primary/30 to-primary/10' 
                        : 'bg-gradient-to-br from-accent/30 to-accent/10'
                    }`}>
                      <game.icon className={`w-8 h-8 ${
                        game.category === 'originals' ? 'text-primary' : 'text-accent'
                      }`} />
                    </div>
                  </div>

                  {/* Stake badge */}
                  <div className="absolute top-2 left-2">
                    <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-[10px] font-bold">S</span>
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="font-semibold text-sm mb-0.5 text-white">{game.name}</h3>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">{game.category}</p>
                  </div>

                  {/* Players count */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] text-text-muted">{game.players} playing</span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Live Bets</h2>
            </div>

            <div className="bg-surface rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-text-dim font-medium px-4 py-3">Game</th>
                    <th className="text-left text-text-dim font-medium px-4 py-3 hidden sm:table-cell">Player</th>
                    <th className="text-right text-text-dim font-medium px-4 py-3">Bet</th>
                    <th className="text-right text-text-dim font-medium px-4 py-3">Multiplier</th>
                    <th className="text-right text-text-dim font-medium px-4 py-3">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { game: "Dice", player: "Hidden", bet: 50, multiplier: 1.97, payout: 98.50, win: true },
                    { game: "Crash", player: "Hidden", bet: 100, multiplier: 0, payout: 0, win: false },
                    { game: "Mines", player: "Hidden", bet: 25, multiplier: 2.5, payout: 62.50, win: true },
                    { game: "Plinko", player: "Hidden", bet: 10, multiplier: 0, payout: 0, win: false },
                    { game: "Blackjack", player: "Hidden", bet: 200, multiplier: 2, payout: 400, win: true },
                  ].map((bet, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium">{bet.game}</span>
                      </td>
                      <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{bet.player}</td>
                      <td className="px-4 py-3 text-right font-medium">${bet.bet.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={bet.win ? 'text-primary' : 'text-text-dim'}>
                          {bet.win ? `${bet.multiplier.toFixed(2)}x` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={bet.win ? 'text-primary font-medium' : 'text-text-dim'}>
                          {bet.win ? `$${bet.payout.toFixed(2)}` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-8 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className="text-sm text-text-muted">© 2024 Stake Clone</span>
              </div>
              <p className="text-sm text-text-dim">
                Made with ❤️ by <span className="text-primary font-medium">Albin Antony</span>
              </p>
              <div className="flex items-center gap-4 text-xs text-text-dim">
                <span>Provably fair</span>
                <span>·</span>
                <span>Instant play</span>
                <span>·</span>
                <span>No downloads</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default CasinoHome;