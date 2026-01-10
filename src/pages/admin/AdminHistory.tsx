import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Trash2, RefreshCw, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import type { Json } from '@/integrations/supabase/types';

interface HistoryEntry {
  id: string;
  user_id: string;
  game_type: string;
  bet_amount: number;
  multiplier: number;
  payout: number;
  profit: number;
  result: string;
  game_data: Json;
  created_at: string;
  profiles?: {
    username: string;
  };
}

interface Stats {
  totalBets: number;
  totalWagered: number;
  totalPayout: number;
  totalProfit: number;
  houseEdge: number;
}

const GAME_TYPES = [
  { value: 'all', label: 'All Games' },
  { value: 'dice', label: 'Dice' },
  { value: 'crash', label: 'Crash' },
  { value: 'mines', label: 'Mines' },
  { value: 'plinko', label: 'Plinko' },
  { value: 'roulette', label: 'Roulette' },
  { value: 'blackjack', label: 'Blackjack' },
];

const AdminHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [stats, setStats] = useState<Stats>({
    totalBets: 0,
    totalWagered: 0,
    totalPayout: 0,
    totalProfit: 0,
    houseEdge: 0,
  });
  const { toast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('game_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (gameFilter !== 'all') {
        query = query.eq('game_type', gameFilter);
      }

      const { data: historyData, error: historyError } = await query;

      if (historyError) throw historyError;

      // Fetch usernames separately
      const userIds = [...new Set((historyData || []).map(h => h.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profilesMap = new Map((profilesData || []).map(p => [p.user_id, p.username]));

      const enrichedHistory = (historyData || []).map(h => ({
        ...h,
        profiles: { username: profilesMap.get(h.user_id) || 'Guest' }
      })) as HistoryEntry[];
      
      setHistory(enrichedHistory);

      // Calculate stats
      const totalBets = historyData?.length || 0;
      const totalWagered = historyData?.reduce((sum, h) => sum + Number(h.bet_amount), 0) || 0;
      const totalPayout = historyData?.reduce((sum, h) => sum + Number(h.payout), 0) || 0;
      const totalProfit = totalWagered - totalPayout;
      const houseEdge = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;

      setStats({
        totalBets,
        totalWagered,
        totalPayout,
        totalProfit,
        houseEdge,
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch game history',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [gameFilter]);

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('game_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory((prev) => prev.filter((h) => h.id !== id));
      toast({
        title: 'Deleted',
        description: 'History entry deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        variant: 'destructive',
      });
    }
  };

  const handleClearAllHistory = async () => {
    try {
      let query = supabase.from('game_history').delete();
      
      if (gameFilter !== 'all') {
        query = query.eq('game_type', gameFilter);
      } else {
        query = query.gte('created_at', '1970-01-01');
      }

      const { error } = await query;

      if (error) throw error;

      setHistory([]);
      toast({
        title: 'Cleared',
        description: `All ${gameFilter === 'all' ? '' : gameFilter + ' '}history cleared`,
      });
      fetchHistory();
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear history',
        variant: 'destructive',
      });
    }
  };

  const filteredHistory = history.filter((entry) => {
    if (!search) return true;
    const username = entry.profiles?.username?.toLowerCase() || '';
    return (
      username.includes(search.toLowerCase()) ||
      entry.game_type.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 lg:w-6 lg:h-6" />
            Bet History
          </h1>
          <p className="text-muted-foreground text-sm">View and manage all bets</p>
        </div>
        <Button onClick={fetchHistory} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-4">
        <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
          <p className="text-xs text-muted-foreground">Total Bets</p>
          <p className="text-lg lg:text-2xl font-bold">{stats.totalBets.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
          <p className="text-xs text-muted-foreground">Total Wagered</p>
          <p className="text-lg lg:text-2xl font-bold text-primary">${stats.totalWagered.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
          <p className="text-xs text-muted-foreground">Payouts</p>
          <p className="text-lg lg:text-2xl font-bold text-orange-400">${stats.totalPayout.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
          <p className="text-xs text-muted-foreground">House Profit</p>
          <p className={`text-lg lg:text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 lg:p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-muted-foreground">House Edge</p>
          <p className={`text-lg lg:text-2xl font-bold ${stats.houseEdge >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.houseEdge.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by player or game..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Filter by game" />
          </SelectTrigger>
          <SelectContent>
            {GAME_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full sm:w-auto">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Bet History</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {gameFilter === 'all' ? 'ALL' : gameFilter} bet history.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAllHistory}>
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* History Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Game</TableHead>
              <TableHead className="text-right">Bet</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Multi</TableHead>
              <TableHead className="text-right hidden md:table-cell">Payout</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="hidden lg:table-cell">Result</TableHead>
              <TableHead className="hidden lg:table-cell">Time</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No history found
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-sm">
                    {entry.profiles?.username || 'Guest'}
                  </TableCell>
                  <TableCell className="capitalize text-sm">{entry.game_type}</TableCell>
                  <TableCell className="text-right text-sm">${Number(entry.bet_amount).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm hidden sm:table-cell">{Number(entry.multiplier).toFixed(2)}x</TableCell>
                  <TableCell className="text-right text-sm hidden md:table-cell">${Number(entry.payout).toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-semibold text-sm ${
                    Number(entry.profit) > 0 ? 'text-green-400' : Number(entry.profit) < 0 ? 'text-red-400' : ''
                  }`}>
                    {Number(entry.profit) >= 0 ? '+' : ''}${Number(entry.profit).toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      entry.result === 'win' 
                        ? 'bg-green-500/20 text-green-400' 
                        : entry.result === 'push'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                    }`}>
                      {entry.result.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminHistory;