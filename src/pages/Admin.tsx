import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Database, Users, Settings, FileText, 
  BarChart3, Shield, ArrowLeft, RefreshCw, Download,
  ChevronRight, Search, Filter, MoreVertical
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/TicTacToe/ThemeToggle";

interface Profile {
  id: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  games_played: number;
  created_at: string;
}

interface Game {
  id: string;
  game_mode: string;
  winner: string | null;
  created_at: string;
  completed_at: string | null;
}

type AdminTab = "overview" | "users" | "games" | "settings" | "logs";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, gamesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("wins", { ascending: false }).limit(50),
        supabase.from("games").select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (gamesRes.data) setGames(gamesRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: "overview" as AdminTab, label: "Overview", icon: LayoutDashboard },
    { id: "users" as AdminTab, label: "Users", icon: Users },
    { id: "games" as AdminTab, label: "Games", icon: Database },
    { id: "logs" as AdminTab, label: "Logs", icon: FileText },
    { id: "settings" as AdminTab, label: "Settings", icon: Settings },
  ];

  const stats = [
    { 
      label: "Total Users", 
      value: profiles.length.toString(),
      change: "+12%",
      icon: Users,
    },
    { 
      label: "Total Games", 
      value: games.length.toString(),
      change: "+8%",
      icon: Database,
    },
    { 
      label: "Active Today", 
      value: "23",
      change: "+5%",
      icon: BarChart3,
    },
    { 
      label: "Completion Rate", 
      value: `${Math.round((games.filter(g => g.completed_at).length / Math.max(games.length, 1)) * 100)}%`,
      change: "+2%",
      icon: Shield,
    },
  ];

  const filteredProfiles = profiles.filter(p => 
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGames = games.filter(g => 
    g.game_mode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex">
      <ThemeToggle />
      
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Admin</h2>
              <p className="text-xs text-sidebar-foreground/60">GameHub Control</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === item.id
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <motion.button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to App</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground capitalize">
              {activeTab}
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your GameHub platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={fetchData}
              className="glass-button rounded-xl px-4 py-2 flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </motion.button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="admin-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-semibold text-foreground mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-green-500 mt-3">{stat.change} from last week</p>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="admin-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Games</h3>
              <div className="space-y-3">
                {games.slice(0, 5).map((game) => (
                  <div 
                    key={game.id} 
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Database className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{game.game_mode}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(game.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      game.winner === 'X' 
                        ? 'bg-blue-500/10 text-blue-500'
                        : game.winner === 'O'
                        ? 'bg-orange-500/10 text-orange-500'
                        : game.winner === 'draw'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {game.winner || 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <motion.button
                className="glass-button rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Filter className="w-4 h-4" />
                Filter
              </motion.button>
              <motion.button
                className="glass-button rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
            </div>

            {/* Users Table */}
            <div className="admin-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Username</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Games</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Wins</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Losses</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Win Rate</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((profile) => (
                      <tr key={profile.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-4 px-4">
                          <span className="font-medium text-foreground">{profile.username}</span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{profile.games_played}</td>
                        <td className="py-4 px-4 text-green-500">{profile.wins}</td>
                        <td className="py-4 px-4 text-red-500">{profile.losses}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {profile.games_played > 0 
                            ? `${Math.round((profile.wins / profile.games_played) * 100)}%`
                            : '0%'
                          }
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-sm">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button className="p-2 hover:bg-muted rounded-lg">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Games Tab */}
        {activeTab === "games" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="admin-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Mode</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Winner</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Started</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGames.slice(0, 20).map((game) => (
                      <tr key={game.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                          {game.id.slice(0, 8)}...
                        </td>
                        <td className="py-4 px-4">
                          <span className="capitalize text-foreground">{game.game_mode}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            game.winner === 'X' 
                              ? 'bg-blue-500/10 text-blue-500'
                              : game.winner === 'O'
                              ? 'bg-orange-500/10 text-orange-500'
                              : game.winner === 'draw'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {game.winner || 'In Progress'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-sm">
                          {new Date(game.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-sm">
                          {game.completed_at 
                            ? new Date(game.completed_at).toLocaleString()
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="admin-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">System Logs</h3>
              <div className="space-y-2 font-mono text-sm">
                {[
                  { time: "12:45:32", level: "INFO", message: "User logged in successfully" },
                  { time: "12:44:18", level: "INFO", message: "Game completed: X wins" },
                  { time: "12:43:05", level: "DEBUG", message: "Database query executed (profiles)" },
                  { time: "12:42:51", level: "INFO", message: "New user registered" },
                  { time: "12:41:22", level: "WARN", message: "Rate limit approaching for API" },
                  { time: "12:40:10", level: "INFO", message: "Room created: ABC123" },
                  { time: "12:39:45", level: "DEBUG", message: "Realtime subscription active" },
                  { time: "12:38:30", level: "INFO", message: "Game started: online mode" },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-4 py-2 border-b border-border/50">
                    <span className="text-muted-foreground">{log.time}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.level === 'INFO' 
                        ? 'bg-blue-500/10 text-blue-500'
                        : log.level === 'WARN'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : log.level === 'ERROR'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl"
          >
            <div className="admin-card">
              <h3 className="text-lg font-semibold text-foreground mb-6">General Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    defaultValue="GameHub Arcade"
                    className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Max Players per Room
                  </label>
                  <input
                    type="number"
                    defaultValue="2"
                    className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Enable Registration</p>
                    <p className="text-sm text-muted-foreground">Allow new users to sign up</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Disable access for non-admins</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-destructive transition-colors peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>

            <motion.button
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Save Changes
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Admin;
