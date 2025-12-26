import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { soundManager } from '@/utils/sounds';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type Player = 'X' | 'O' | null;
type SmallBoard = Player[];
type BigBoard = SmallBoard[];

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

interface UltimateGameState {
  id: string;
  boards: BigBoard;
  boardWinners: Player[];
  activeBoard: number | null;
  current_player: 'X' | 'O';
  winner: string | null;
}

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const checkWinner = (board: Player[]): Player => {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

const isBoardFull = (board: Player[]): boolean => {
  return board.every(cell => cell !== null);
};

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Flatten 9x9 boards to 81-element array for storage
const flattenBoards = (boards: BigBoard): string[] => {
  const flat: string[] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      flat.push(boards[i][j] ?? 'null');
    }
  }
  return flat;
};

// Unflatten 81-element array back to 9x9 boards
const unflattenBoards = (flat: string[]): BigBoard => {
  const boards: BigBoard = [];
  for (let i = 0; i < 9; i++) {
    const board: SmallBoard = [];
    for (let j = 0; j < 9; j++) {
      const val = flat[i * 9 + j];
      board.push(val === 'null' || val === null ? null : val as Player);
    }
    boards.push(board);
  }
  return boards;
};

export const useUltimateOnlineGame = () => {
  const { user } = useAuth();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [game, setGame] = useState<UltimateGameState | null>(null);
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
      
      // Create initial 81-cell board (all null)
      const initialBoard = Array(81).fill('null');
      const initialMoves = {
        moves: [],
        boardWinners: Array(9).fill(null),
        activeBoard: null,
        gameType: 'ultimate'
      };
      
      // Create the game first
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          player_x: hostName,
          game_mode: 'online',
          room_code: roomCode,
          user_id: user.id,
          board: initialBoard,
          moves: initialMoves as unknown as Json,
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
        boards: Array(9).fill(null).map(() => Array(9).fill(null)),
        boardWinners: Array(9).fill(null),
        activeBoard: null,
        current_player: 'X',
        winner: null,
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

      // Check if this is an Ultimate game
      if (roomData.game_id) {
        const { data: gameCheck } = await supabase
          .from('games')
          .select('moves')
          .eq('id', roomData.game_id)
          .maybeSingle();
        
        const moves = gameCheck?.moves as { gameType?: string } | null;
        if (!moves || moves.gameType !== 'ultimate') {
          setError('This room is for regular Tic Tac Toe');
          setLoading(false);
          return;
        }
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
          const movesData = gameData.moves as { 
            boardWinners?: (string | null)[];
            activeBoard?: number | null;
          } | null;
          
          setGame({
            id: gameData.id,
            boards: unflattenBoards(gameData.board || []),
            boardWinners: (movesData?.boardWinners || Array(9).fill(null)) as Player[],
            activeBoard: movesData?.activeBoard ?? null,
            current_player: gameData.current_player as 'X' | 'O',
            winner: gameData.winner,
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
      .channel(`ultimate-room-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          console.log('Ultimate Room update:', payload);
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
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          console.log('Ultimate Game update:', payload);
          if (payload.new) {
            const gameData = payload.new as {
              id: string;
              board: string[];
              current_player: string;
              winner: string | null;
              moves: Json;
            };
            
            const movesData = gameData.moves as { 
              boardWinners?: (string | null)[];
              activeBoard?: number | null;
            } | null;
            
            setGame(prev => {
              if (!prev || prev.id !== gameData.id) return prev;
              
              return {
                id: gameData.id,
                boards: unflattenBoards(gameData.board),
                boardWinners: (movesData?.boardWinners || Array(9).fill(null)) as Player[],
                activeBoard: movesData?.activeBoard ?? null,
                current_player: gameData.current_player as 'X' | 'O',
                winner: gameData.winner,
              };
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Ultimate realtime subscription status:', status);
      });

    channelRef.current = channel;
  }, []);

  // Make a move
  const makeMove = useCallback(async (boardIndex: number, cellIndex: number) => {
    if (!game || !room) return false;
    
    // Determine if it's this player's turn
    const mySymbol = isHost ? 'X' : 'O';
    if (game.current_player !== mySymbol) return false;
    if (game.boards[boardIndex][cellIndex] !== null) return false;
    if (game.winner) return false;
    if (game.boardWinners[boardIndex]) return false;
    if (game.activeBoard !== null && game.activeBoard !== boardIndex) return false;

    // Make the move
    const newBoards = game.boards.map((board, i) => 
      i === boardIndex 
        ? board.map((cell, j) => j === cellIndex ? mySymbol as Player : cell)
        : [...board]
    );

    // Check if this small board is won
    const newBoardWinners = [...game.boardWinners];
    const smallBoardWinner = checkWinner(newBoards[boardIndex]);
    if (smallBoardWinner) {
      newBoardWinners[boardIndex] = smallBoardWinner;
    }

    // Check if the big board is won
    const bigBoardWinner = checkWinner(newBoardWinners);
    
    // Check for draw
    const allBoardsDecided = newBoardWinners.every((w, i) => 
      w !== null || isBoardFull(newBoards[i])
    );
    const isDraw = allBoardsDecided && !bigBoardWinner;

    // Determine next active board
    let nextActiveBoard: number | null = cellIndex;
    if (newBoardWinners[nextActiveBoard] || isBoardFull(newBoards[nextActiveBoard])) {
      nextActiveBoard = null;
    }

    const nextPlayer = mySymbol === 'X' ? 'O' : 'X';
    const winner = bigBoardWinner || (isDraw ? 'draw' : null);

    try {
      await supabase
        .from('games')
        .update({
          board: flattenBoards(newBoards),
          current_player: nextPlayer,
          moves: {
            gameType: 'ultimate',
            boardWinners: newBoardWinners,
            activeBoard: nextActiveBoard,
          } as unknown as Json,
          winner: winner,
          completed_at: winner ? new Date().toISOString() : null,
        })
        .eq('id', game.id);

      // Update local state immediately for responsive feel
      setGame({
        ...game,
        boards: newBoards,
        boardWinners: newBoardWinners,
        activeBoard: nextActiveBoard,
        current_player: nextPlayer,
        winner: winner,
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