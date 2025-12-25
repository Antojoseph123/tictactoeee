import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GameRoom {
  id: string;
  room_code: string;
  host_name: string;
  guest_name: string | null;
  status: string;
  created_at: string;
}

interface GameRecord {
  id: string;
  player_x: string;
  player_o: string;
  winner: string | null;
  game_mode: string;
  created_at: string;
  completed_at: string | null;
  board: string[];
}

const AdminGames = () => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [roomsRes, gamesRes] = await Promise.all([
        supabase.from('game_rooms').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('games').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (gamesRes.error) throw gamesRes.error;

      setRooms(roomsRes.data || []);
      setGames(gamesRes.data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to load game data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase.from('game_rooms').delete().eq('id', roomId);
      if (error) throw error;
      toast.success('Room deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  const handleViewGame = (game: GameRecord) => {
    setSelectedGame(game);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">Waiting</Badge>;
      case 'playing':
        return <Badge className="bg-green-500/20 text-green-500">Playing</Badge>;
      case 'finished':
        return <Badge variant="outline">Finished</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Game Management</h1>

      {/* Active Rooms */}
      <Card>
        <CardHeader>
          <CardTitle>Active Game Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No active rooms</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Code</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-mono">{room.room_code}</TableCell>
                    <TableCell>{room.host_name}</TableCell>
                    <TableCell>{room.guest_name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(room.status)}</TableCell>
                    <TableCell>{format(new Date(room.created_at), 'MMM d, HH:mm')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRoom(room.id)}
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

      {/* Recent Games */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No games recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player X</TableHead>
                  <TableHead>Player O</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Played</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>{game.player_x}</TableCell>
                    <TableCell>{game.player_o}</TableCell>
                    <TableCell>
                      {game.winner === 'draw' ? (
                        <Badge variant="outline">Draw</Badge>
                      ) : game.winner ? (
                        <Badge className="bg-primary/20 text-primary">{game.winner}</Badge>
                      ) : (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{game.game_mode}</TableCell>
                    <TableCell>{format(new Date(game.created_at), 'MMM d, HH:mm')}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleViewGame(game)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Details</DialogTitle>
            <DialogDescription>View the final board state</DialogDescription>
          </DialogHeader>

          {selectedGame && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Player X:</span>{' '}
                  <span className="font-medium">{selectedGame.player_x}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Player O:</span>{' '}
                  <span className="font-medium">{selectedGame.player_o}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Winner:</span>{' '}
                  <span className="font-medium">{selectedGame.winner || 'None'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mode:</span>{' '}
                  <span className="font-medium capitalize">{selectedGame.game_mode}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 w-48 mx-auto">
                {selectedGame.board.map((cell, i) => (
                  <div
                    key={i}
                    className="aspect-square flex items-center justify-center bg-muted rounded text-2xl font-bold"
                  >
                    {cell || '-'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGames;
