import { useNavigate } from "react-router-dom";
import { Dices, TrendingUp, Bomb, Circle, Target, Spade, Home, Gamepad2, Trophy, Gift, Settings, Search, Wallet, ChevronDown, Menu, X } from "lucide-react";
import { useCasinoBalance } from "@/hooks/useCasinoBalance";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface CasinoGame {
  id: string;
  name: string;
  icon: React.ElementType;
  category: string;
}

const games: CasinoGame[] = [
  { id: "dice", name: "Dice", icon: Dices, category: "originals" },
  { id: "crash", name: "Crash", icon: TrendingUp, category: "originals" },
  { id: "mines", name: "Mines", icon: Bomb, category: "originals" },
  { id: "plinko", name: "Plinko", icon: Circle, category: "originals" },
  { id: "roulette", name: "Roulette", icon: Target, category: "table" },
  { id: "blackjack", name: "Blackjack", icon: Spade, category: "table" },
];

const categories = [
  { id: "all", label: "All Games" },
  { id: "originals", label: "Originals" },
  { id: "table", label: "Table Games" },
];

const sidebarNav = [
  { icon: Home, label: "Lobby", active: true },
  { icon: Gamepad2, label: "Casino" },
  { icon: Trophy, label: "Leaderboard" },
  { icon: Gift, label: "Promotions" },
];

const CasinoHome = () => {
  const navigate = useNavigate();
  const { balance, isLoading, resetBalance } = useCasinoBalance();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleGameSelect = (gameId: string) => {
    navigate(`/play/${gameId}`);
  };

  const filteredGames = activeCategory === "all" 
    ? games 
    : games.filter(g => g.category === activeCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 bottom-0 w-56 bg-bg border-r border-border z-50
        transform transition-transform lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-semibold text-lg">GameHub</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-surface rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {sidebarNav.map((item) => (
              <button
                key={item.label}
                className={`nav-item w-full ${item.active ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="h-px bg-border my-4" />

          {/* Game categories in sidebar */}
          <div className="space-y-1">
            <p className="text-xs text-text-dim uppercase tracking-wider px-3 py-2">Games</p>
            {games.slice(0, 4).map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="nav-item w-full"
              >
                <game.icon className="w-5 h-5" />
                {game.name}
              </button>
            ))}
          </div>
        </div>

        {/* Balance at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-dim">Balance</span>
            <button 
              onClick={resetBalance}
              className="text-xs text-primary hover:text-primary-hover"
            >
              Reset
            </button>
          </div>
          <p className="text-lg font-semibold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 h-14 bg-bg border-b border-border px-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-surface rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-surface rounded-lg w-64">
              <Search className="w-4 h-4 text-text-dim" />
              <input 
                type="text"
                placeholder="Search games..."
                className="bg-transparent text-sm outline-none flex-1 placeholder:text-text-dim"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance */}
            <div className="balance-chip">
              <Wallet className="w-4 h-4 text-primary" />
              <span>${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <ChevronDown className="w-3 h-3 text-text-dim" />
            </div>

            {/* Auth */}
            {user ? (
              <button
                onClick={() => navigate("/profile")}
                className="btn-secondary"
              >
                Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="btn-secondary hidden sm:block"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="btn-primary"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          {/* Hero banner */}
          <div className="bg-surface rounded-xl p-6 lg:p-8 mb-6">
            <div className="max-w-xl">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Play Casino Games
              </h1>
              <p className="text-text-muted mb-4">
                Original games with provably fair outcomes. Start with $1,000 demo balance.
              </p>
              <button 
                onClick={() => handleGameSelect('dice')}
                className="btn-primary"
              >
                Play Now
              </button>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`category-pill whitespace-nowrap ${activeCategory === cat.id ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Games grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredGames.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="game-tile p-4 text-left group"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <game.icon className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
                </div>
                
                <h3 className="font-semibold text-sm mb-0.5">{game.name}</h3>
                <p className="text-xs text-text-dim capitalize">{game.category}</p>
              </button>
            ))}
          </div>

          {/* Recent bets section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Recent Bets</h2>
            <div className="bg-surface rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-text-dim font-medium px-4 py-3">Game</th>
                    <th className="text-left text-text-dim font-medium px-4 py-3 hidden sm:table-cell">Player</th>
                    <th className="text-right text-text-dim font-medium px-4 py-3">Bet</th>
                    <th className="text-right text-text-dim font-medium px-4 py-3">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { game: "Dice", player: "Hidden", bet: 50, payout: 98.50, win: true },
                    { game: "Crash", player: "Hidden", bet: 100, payout: 0, win: false },
                    { game: "Mines", player: "Hidden", bet: 25, payout: 62.50, win: true },
                    { game: "Plinko", player: "Hidden", bet: 10, payout: 0, win: false },
                    { game: "Blackjack", player: "Hidden", bet: 200, payout: 400, win: true },
                  ].map((bet, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-elevated/50">
                      <td className="px-4 py-3 font-medium">{bet.game}</td>
                      <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{bet.player}</td>
                      <td className="px-4 py-3 text-right">${bet.bet.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={bet.win ? 'text-primary' : 'text-text-dim'}>
                          {bet.win ? `+$${bet.payout.toFixed(2)}` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 py-6 border-t border-border text-center">
            <p className="text-sm text-text-dim">
              Made with ❤️ by <span className="text-primary font-medium">Albin Antony</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default CasinoHome;