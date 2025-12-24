import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ArrowLeft, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { soundManager } from "@/utils/sounds";

interface OnlineLobbyProps {
  room: {
    room_code: string;
    host_name: string;
    guest_name: string | null;
    status: string;
  } | null;
  isHost: boolean;
  loading: boolean;
  error: string | null;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  onBack: () => void;
}

const OnlineLobby = ({
  room,
  isHost,
  loading,
  error,
  onCreateRoom,
  onJoinRoom,
  onBack,
}: OnlineLobbyProps) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCopyCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      toast.success('Room code copied!');
      soundManager.playClick();
    }
  };

  const handleCreate = () => {
    if (name.trim()) {
      soundManager.playClick();
      onCreateRoom(name.trim());
    }
  };

  const handleJoin = () => {
    if (name.trim() && roomCode.trim()) {
      soundManager.playClick();
      onJoinRoom(roomCode.trim().toUpperCase(), name.trim());
    }
  };

  // Waiting room view
  if (room && room.status === 'waiting') {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-light text-foreground">Waiting for Player</h2>
          <p className="text-muted-foreground">Share the room code with your friend</p>
        </div>

        <motion.div
          className="glass-panel rounded-2xl p-6 text-center"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <p className="text-sm text-muted-foreground mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono tracking-widest text-primary">
              {room.room_code}
            </span>
            <motion.button
              onClick={handleCopyCode}
              className="glass-button rounded-lg p-2"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Copy className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Waiting for opponent...</span>
        </div>

        <motion.button
          onClick={onBack}
          className="glass-button rounded-xl px-6 py-3 flex items-center gap-2 mx-auto text-muted-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Cancel
        </motion.button>
      </motion.div>
    );
  }

  // Selection view
  if (mode === 'select') {
    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-light text-foreground">Online Multiplayer</h2>
          <p className="text-muted-foreground">Create or join a game room</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            onClick={() => { setMode('create'); soundManager.playClick(); }}
            className="glass-panel rounded-2xl p-6 text-center hover:bg-card/10 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <span className="font-medium text-foreground">Create Room</span>
            <p className="text-xs text-muted-foreground mt-1">Host a new game</p>
          </motion.button>

          <motion.button
            onClick={() => { setMode('join'); soundManager.playClick(); }}
            className="glass-panel rounded-2xl p-6 text-center hover:bg-card/10 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
            <span className="font-medium text-foreground">Join Room</span>
            <p className="text-xs text-muted-foreground mt-1">Enter a room code</p>
          </motion.button>
        </div>

        <motion.button
          onClick={onBack}
          className="glass-button rounded-xl px-6 py-3 flex items-center gap-2 mx-auto text-muted-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>
      </motion.div>
    );
  }

  // Create room form
  if (mode === 'create') {
    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h2 className="text-2xl font-light text-center text-foreground">Create Room</h2>

        <div className="glass-panel rounded-2xl p-4">
          <label className="block text-sm text-muted-foreground mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-card/10 border border-border/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            maxLength={20}
          />
        </div>

        {error && (
          <p className="text-destructive text-sm text-center">{error}</p>
        )}

        <div className="flex gap-3">
          <motion.button
            onClick={() => { setMode('select'); soundManager.playClick(); }}
            className="glass-button rounded-xl px-6 py-3 flex-1 text-muted-foreground"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </motion.button>
          <motion.button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="glass-button rounded-xl px-6 py-3 flex-1 text-primary disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create'}
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Join room form
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <h2 className="text-2xl font-light text-center text-foreground">Join Room</h2>

      <div className="glass-panel rounded-2xl p-4 space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">Room Code</label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-letter code"
            className="w-full bg-card/10 border border-border/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono tracking-widest text-center text-xl"
            maxLength={6}
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-card/10 border border-border/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            maxLength={20}
          />
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm text-center">{error}</p>
      )}

      <div className="flex gap-3">
        <motion.button
          onClick={() => { setMode('select'); soundManager.playClick(); }}
          className="glass-button rounded-xl px-6 py-3 flex-1 text-muted-foreground"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>
        <motion.button
          onClick={handleJoin}
          disabled={!name.trim() || roomCode.length !== 6 || loading}
          className="glass-button rounded-xl px-6 py-3 flex-1 text-secondary disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Join'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default OnlineLobby;
