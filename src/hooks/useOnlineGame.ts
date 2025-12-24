import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { soundManager } from '@/utils/sounds';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

interface GameRoom {
  id: string;
  room_code: string;
  host_id: string;
  guest_id: string | null;
  host_name: string;
  guest_name: string | null;
  game_id: string | null;
  status: string;
}

interface GameState {
  id: string;
  board: (string | null)[];
  current_player: string;
  winner: string | null;
  moves: { index: number; player: string }[];
}

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useOnlineGame = () => {
  const { user } = useAuth();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRoom(null);
    setGame(null);
    setIsHost(false);
    setError(null);
  }, []);

  // Create a new room
  const createRoom = useCallback(async (hostName: string) => {
    if (!user) {
      setError('You must be logged in to create a room');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const roomCode = generateRoomCode();
      
      // Create the game first
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          player_x: hostName,
          game_mode: 'online',
          room_code: roomCode,
          user_id: user.id,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          host_id: user.id,
          host_name: hostName,
          game_id: gameData.id,
          status: 'waiting',
        })
        .select()
        .single();

      if (roomError) throw roomError;

      setRoom(roomData as GameRoom);
      setGame({
        id: gameData.id,
        board: Array(9).fill(null),
        current_player: 'X',
        winner: null,
        moves: [],
      });
      setIsHost(true);
      setPlayerName(hostName);
      
      // Subscribe to room changes
      subscribeToRoom(roomCode);
      
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Join an existing room
  const joinRoom = useCallback(async (roomCode: string, guestName: string) => {
    if (!user) {
      setError('You must be logged in to join a room');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Find the room
      const { data: roomData, error: findError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .maybeSingle();

      if (findError) throw findError;
      if (!roomData) {
        setError('Room not found');
        setLoading(false);
        return;
      }

      if (roomData.status !== 'waiting') {
        setError('Game already in progress');
        setLoading(false);
        return;
      }

      if (roomData.guest_id) {
        setError('Room is full');
        setLoading(false);
        return;
      }

      // Update room with guest info
      const { error: updateRoomError } = await supabase
        .from('game_rooms')
        .update({
          guest_id: user.id,
          guest_name: guestName,
          status: 'playing',
        })
        .eq('id', roomData.id);

      if (updateRoomError) throw updateRoomError;

      // Update game with player O name
      if (roomData.game_id) {
        await supabase
          .from('games')
          .update({ player_o: guestName })
          .eq('id', roomData.game_id);
      }

      // Fetch game state
      if (roomData.game_id) {
        const { data: gameData } = await supabase
          .from('games')
          .select('*')
          .eq('id', roomData.game_id)
          .single();

        if (gameData) {
          setGame({
            id: gameData.id,
            board: (gameData.board || []).map(cell => cell === 'null' ? null : cell),
            current_player: gameData.current_player,
            winner: gameData.winner,
            moves: Array.isArray(gameData.moves) ? gameData.moves as { index: number; player: string }[] : [],
          });
        }
      }

      setRoom({
        ...roomData,
        guest_id: user.id,
        guest_name: guestName,
        status: 'playing',
      } as GameRoom);
      setIsHost(false);
      setPlayerName(guestName);
      
      soundManager.playJoin();
      subscribeToRoom(roomCode.toUpperCase());
      
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to realtime updates
  const subscribeToRoom = useCallback((roomCode: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          console.log('Room update:', payload);
          if (payload.new) {
            const newRoom = payload.new as GameRoom;
            setRoom(newRoom);
            
            if (newRoom.status === 'playing' && payload.old && (payload.old as GameRoom).status === 'waiting') {
              soundManager.playJoin();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
        },
        (payload) => {
          console.log('Game update:', payload);
          if (payload.new) {
            const gameData = payload.new as {
              id: string;
              board: string[];
              current_player: string;
              winner: string | null;
              moves: Json;
            };
            
            setGame(prev => {
              if (!prev || prev.id !== gameData.id) return prev;
              
              return {
                id: gameData.id,
                board: gameData.board.map(cell => cell === 'null' ? null : cell),
                current_player: gameData.current_player,
                winner: gameData.winner,
                moves: Array.isArray(gameData.moves) ? gameData.moves as { index: number; player: string }[] : [],
              };
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  // Make a move
  const makeMove = useCallback(async (index: number) => {
    if (!game || !room) return false;
    
    // Determine if it's this player's turn
    const mySymbol = isHost ? 'X' : 'O';
    if (game.current_player !== mySymbol) return false;
    if (game.board[index] !== null) return false;
    if (game.winner) return false;

    const newBoard = [...game.board];
    newBoard[index] = mySymbol;
    
    const newMoves = [...game.moves, { index, player: mySymbol }];
    const nextPlayer = mySymbol === 'X' ? 'O' : 'X';

    // Check for winner
    const winner = checkWinner(newBoard);
    const isDraw = !winner && newBoard.every(cell => cell !== null);

    try {
      await supabase
        .from('games')
        .update({
          board: newBoard.map(cell => cell ?? 'null'),
          current_player: nextPlayer,
          moves: newMoves as unknown as Json,
          winner: winner || (isDraw ? 'draw' : null),
          completed_at: winner || isDraw ? new Date().toISOString() : null,
        })
        .eq('id', game.id);

      // Update local state immediately for responsive feel
      setGame({
        ...game,
        board: newBoard,
        current_player: nextPlayer,
        winner: winner || (isDraw ? 'draw' : null),
        moves: newMoves,
      });

      return true;
    } catch (err) {
      console.error('Error making move:', err);
      return false;
    }
  }, [game, room, isHost]);

  // Leave the room
  const leaveRoom = useCallback(async () => {
    if (room) {
      if (isHost) {
        // Delete the room and game
        await supabase.from('game_rooms').delete().eq('id', room.id);
        if (room.game_id) {
          await supabase.from('games').delete().eq('id', room.game_id);
        }
      } else {
        // Just remove guest from room
        await supabase
          .from('game_rooms')
          .update({ guest_id: null, guest_name: null, status: 'waiting' })
          .eq('id', room.id);
      }
    }
    cleanup();
  }, [room, isHost, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    room,
    game,
    isHost,
    playerName,
    error,
    loading,
    mySymbol: isHost ? 'X' : 'O',
    isMyTurn: game ? (isHost ? game.current_player === 'X' : game.current_player === 'O') : false,
    createRoom,
    joinRoom,
    makeMove,
    leaveRoom,
  };
};

// Helper function
const checkWinner = (board: (string | null)[]): string | null => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};
