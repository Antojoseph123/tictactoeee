import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScoreSubmitDialogProps {
  isOpen: boolean;
  score: number;
  onSubmit: (playerName: string) => void;
  onSkip: () => void;
  isNewHighScore?: boolean;
}

export function ScoreSubmitDialog({ 
  isOpen, 
  score, 
  onSubmit, 
  onSkip,
  isNewHighScore = false 
}: ScoreSubmitDialogProps) {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(playerName.trim() || 'Anonymous');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card p-6 max-w-sm w-full"
          >
            {isNewHighScore && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h2 className="text-2xl font-bold text-yellow-500">New High Score!</h2>
              </div>
            )}
            
            <div className="text-center mb-6">
              <p className="text-muted-foreground">Your Score</p>
              <p className="text-4xl font-bold text-primary">{score.toLocaleString()}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Enter your name for the leaderboard
                </label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  maxLength={20}
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onSkip} className="flex-1">
                  Skip
                </Button>
                <Button type="submit" className="flex-1">
                  Submit
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
