import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Gamepad2, Trophy, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    totalScores: 0,
    activeRooms: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, gamesRes, scoresRes, roomsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('games').select('id', { count: 'exact', head: true }),
          supabase.from('game_scores').select('id', { count: 'exact', head: true }),
          supabase.from('game_rooms').select('id', { count: 'exact', head: true }).eq('status', 'waiting'),
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalGames: gamesRes.count || 0,
          totalScores: scoresRes.count || 0,
          activeRooms: roomsRes.count || 0,
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
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { title: 'Games Played', value: stats.totalGames, icon: Gamepad2, color: 'text-green-500' },
    { title: 'Leaderboard Entries', value: stats.totalScores, icon: Trophy, color: 'text-yellow-500' },
    { title: 'Active Rooms', value: stats.activeRooms, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? '...' : stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              Use the sidebar to navigate to different management sections.
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>Users</strong> - Manage user accounts, roles, and bans</li>
              <li>• <strong>Games</strong> - Configure game settings and rules</li>
              <li>• <strong>Leaderboards</strong> - View and moderate high scores</li>
              <li>• <strong>Settings</strong> - Global app configuration</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database</span>
                <span className="text-green-500 font-medium">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Authentication</span>
                <span className="text-green-500 font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Realtime</span>
                <span className="text-green-500 font-medium">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
