import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { Loader2, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';

interface ScoreEntry {
  id: string;
  player_name: string;
  score: number;
  game_id: string;
  created_at: string;
  user_id: string | null;
}

const GAME_IDS = [
  'snake',
  'tetris',
  'breakout',
  'pong',
  'space-invaders',
  'flappy-bird',
  'whack-a-mole',
  'simon-says',
  'tic-tac-toe',
  'ultimate-tic-tac-toe',
];

const AdminLeaderboards = () => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('all');

  const fetchScores = async () => {
    try {
      let query = supabase
        .from('game_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);

      if (selectedGame !== 'all') {
        query = query.eq('game_id', selectedGame);
      }

      const { data, error } = await query;

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error fetching scores:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [selectedGame]);

  const handleDeleteScore = async (scoreId: string) => {
    try {
      const { error } = await supabase.from('game_scores').delete().eq('id', scoreId);
      if (error) throw error;
      toast.success('Score deleted');
      fetchScores();
    } catch (error) {
      console.error('Error deleting score:', error);
      toast.error('Failed to delete score');
    }
  };

  const handleClearGameLeaderboard = async () => {
    if (selectedGame === 'all') {
      toast.error('Please select a specific game first');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear ALL scores for ${selectedGame}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('game_scores').delete().eq('game_id', selectedGame);
      if (error) throw error;
      toast.success(`Leaderboard cleared for ${selectedGame}`);
      fetchScores();
    } catch (error) {
      console.error('Error clearing leaderboard:', error);
      toast.error('Failed to clear leaderboard');
    }
  };

  const filteredScores = scores.filter((score) =>
    score.player_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Leaderboard Management</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Scores</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search player..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by game" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {GAME_IDS.map((game) => (
                    <SelectItem key={game} value={game}>
                      {game.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGame !== 'all' && (
                <Button variant="destructive" onClick={handleClearGameLeaderboard}>
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredScores.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No scores found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScores.map((score, index) => (
                  <TableRow key={score.id}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{score.player_name}</TableCell>
                    <TableCell className="font-mono">{score.score.toLocaleString()}</TableCell>
                    <TableCell className="capitalize">
                      {score.game_id.split('-').join(' ')}
                    </TableCell>
                    <TableCell>{format(new Date(score.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteScore(score.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLeaderboards;
