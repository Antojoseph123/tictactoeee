import { useNavigate } from "react-router-dom";
import { Dices, TrendingUp, Bomb, Circle, Target, Spade, Home, Gift, Search, Wallet, ChevronDown, Menu, X, Star, Users, HelpCircle, Crown, Gamepad2 } from "lucide-react";
import { useCasinoBalance } from "@/hooks/useCasinoBalance";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { PromotionsCarousel } from "@/components/casino/PromotionsCarousel";
import { LiveBetFeed } from "@/components/casino/LiveBetFeed";

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
  { icon: Gift, label: "Promotions", href: "#promotions" },
  { icon: Crown, label: "VIP Club", href: "/vip" },
  { icon: Users, label: "Affiliate", href: "#" },
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
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 bottom-0 w-[220px] bg-surface z-50 flex flex-col
        transform transition-transform lg:translate-x-0 border-r border-border
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo - PARADOX */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-muted flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="font-black text-lg tracking-tight">
              PARA<span className="text-primary">DOX</span>
            </span>
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
                onClick={() => {
                  if (item.href.startsWith('/')) {
                    navigate(item.href);
                  } else if (item.href.startsWith('#')) {
                    document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                  }
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  i === 0 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
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
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-elevated hover:text-text transition-colors">
            <HelpCircle className="w-5 h-5" />
            Support
          </button>
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
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary-muted flex items-center justify-center">
                <span className="text-white font-black text-xs">P</span>
              </div>
              <span className="font-black">PARA<span className="text-primary">DOX</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance */}
            <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <button 
                onClick={resetBalance}
                className="text-[10px] text-text-dim hover:text-primary transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Auth */}
            {user ? (
              <button
                onClick={() => navigate("/profile")}
                className="px-4 py-2 bg-surface-elevated hover:bg-surface-hover rounded-lg text-sm font-medium transition-colors border border-border"
              >
                Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="hidden sm:block px-4 py-2 bg-surface-elevated hover:bg-surface-hover rounded-lg text-sm font-medium transition-colors border border-border"
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
          {/* Hero Section - PARADOX style */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface via-surface to-surface-elevated border border-border">
              {/* Red glow effect */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
              
              <div className="relative p-6 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4">
                      <Gamepad2 className="w-3.5 h-3.5" />
                      PARADOX CASINO
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-black mb-4 leading-tight">
                      Enter the <span className="text-primary">Paradox</span>
                    </h1>
                    <p className="text-text-muted mb-6 text-lg">
                      Where risk meets reward. Provably fair games with instant payouts.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => handleGameSelect('dice')}
                        className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
                      >
                        Play Now
                      </button>
                      <button 
                        onClick={() => navigate("/vip")}
                        className="px-6 py-3 bg-surface-elevated hover:bg-surface-hover rounded-xl text-sm font-medium border border-border transition-colors flex items-center gap-2"
                      >
                        <Crown className="w-4 h-4 text-gold" />
                        VIP Club
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border">
                      <p className="text-2xl font-black text-primary">{games.reduce((acc, g) => acc + (g.players || 0), 0)}+</p>
                      <p className="text-xs text-text-dim">Playing now</p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border">
                      <p className="text-2xl font-black text-gold">$100</p>
                      <p className="text-xs text-text-dim">Demo balance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input 
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-surface rounded-xl text-sm outline-none border border-border placeholder:text-text-dim focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Games Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Games</h2>
              </div>
            </div>

            {/* Games grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredGames.map((game, index) => (
                <motion.button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-surface border border-border hover:border-primary/50 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  {/* Game icon/visual */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                      <game.icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-2 left-2">
                    <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
                      <span className="text-primary text-[10px] font-black">P</span>
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <h3 className="font-bold text-sm mb-0.5 text-white">{game.name}</h3>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">{game.category}</p>
                  </div>

                  {/* Players count */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-text-muted">{game.players}</span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </section>

          {/* Promotions */}
          <div id="promotions">
            <PromotionsCarousel />
          </div>

          {/* Live Bets */}
          <LiveBetFeed />

          {/* Footer */}
          <footer className="py-8 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-primary-muted flex items-center justify-center">
                  <span className="text-white font-black text-xs">P</span>
                </div>
                <span className="text-sm font-bold">PARA<span className="text-primary">DOX</span></span>
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