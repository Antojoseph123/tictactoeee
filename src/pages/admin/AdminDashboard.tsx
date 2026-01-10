import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Activity, Gamepad2 } from 'lucide-react';

interface CasinoStats {
  totalPlayers: number;
  totalWagered: number;
  totalPayouts: number;
  houseProfit: number;
  totalBets: number;
  activePlayers24h: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<CasinoStats>({
    totalPlayers: 0,
    totalWagered: 0,
    totalPayouts: 0,
    houseProfit: 0,
    totalBets: 0,
    activePlayers24h: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentBets, setRecentBets] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total players
        const { count: playerCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        // Get betting stats from game_history
        const { data: historyData } = await supabase
          .from('game_history')
          .select('bet_amount, payout, profit, created_at, user_id');

        const totalWagered = historyData?.reduce((sum, h) => sum + Number(h.bet_amount), 0) || 0;
        const totalPayouts = historyData?.reduce((sum, h) => sum + Number(h.payout), 0) || 0;
        const houseProfit = totalWagered - totalPayouts;
        const totalBets = historyData?.length || 0;

        // Active players in last 24h
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const uniqueUsers = new Set(
          historyData?.filter(h => h.created_at > dayAgo).map(h => h.user_id)
        );

        // Get recent bets
        const { data: recent } = await supabase
          .from('game_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentBets(recent || []);

        setStats({
          totalPlayers: playerCount || 0,
          totalWagered,
          totalPayouts,
          houseProfit,
          totalBets,
          activePlayers24h: uniqueUsers.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      title: 'Total Players', 
      value: stats.totalPlayers.toLocaleString(), 
      icon: Users, 
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    { 
      title: 'Total Wagered', 
      value: `$${stats.totalWagered.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      title: 'Total Payouts', 
      value: `$${stats.totalPayouts.toFixed(2)}`, 
      icon: Activity, 
      color: 'text-orange-400',
      bg: 'bg-orange-500/10'
    },
    { 
      title: 'House Profit', 
      value: `$${stats.houseProfit.toFixed(2)}`, 
      icon: TrendingUp, 
      color: stats.houseProfit >= 0 ? 'text-green-400' : 'text-red-400',
      bg: stats.houseProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
    },
    { 
      title: 'Total Bets', 
      value: stats.totalBets.toLocaleString(), 
      icon: Gamepad2, 
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    { 
      title: 'Active (24h)', 
      value: stats.activePlayers24h.toLocaleString(), 
      icon: Users, 
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Casino overview & statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className={`text-lg lg:text-2xl font-bold ${stat.color}`}>
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Bets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentBets.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bets yet</p>
            ) : (
              recentBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium capitalize">{bet.game_type}</span>
                    <p className="text-xs text-muted-foreground">
                      ${Number(bet.bet_amount).toFixed(2)} bet
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      bet.result === 'win' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {bet.result === 'win' ? '+' : ''}${Number(bet.profit).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">House Edge (Overall)</span>
              <span className={stats.houseProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                {stats.totalWagered > 0
                  ? ((stats.houseProfit / stats.totalWagered) * 100).toFixed(2)
                  : '0.00'}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Bet Size</span>
              <span>
                ${stats.totalBets > 0 ? (stats.totalWagered / stats.totalBets).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Win Rate (Players)</span>
              <span>
                {stats.totalBets > 0
                  ? (
                      (recentBets.filter((b) => b.result === 'win').length / recentBets.length) *
                      100
                    ).toFixed(1)
                  : '0'}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;