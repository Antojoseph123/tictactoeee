import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Dices, TrendingUp, Bomb } from 'lucide-react';
import { CasinoHeader } from '@/components/casino/CasinoHeader';
import { SlotsGame } from '@/components/casino/games/SlotsGame';
import { BlackjackGame } from '@/components/casino/games/BlackjackGame';
import { RouletteGame } from '@/components/casino/games/RouletteGame';
import { CrashGame } from '@/components/casino/games/CrashGame';
import { DiceGame } from '@/components/casino/games/DiceGame';
import { MinesGame } from '@/components/casino/games/MinesGame';
import { CasinoSnakeGame } from '@/components/casino/games/arcade/CasinoSnakeGame';
import { CasinoFlappyBirdGame } from '@/components/casino/games/arcade/CasinoFlappyBirdGame';
import { CasinoWhackAMoleGame } from '@/components/casino/games/arcade/CasinoWhackAMoleGame';
import { CasinoSimonSaysGame } from '@/components/casino/games/arcade/CasinoSimonSaysGame';
import { useCasinoBalance } from '@/hooks/useCasinoBalance';
import { soundManager } from '@/utils/sounds';
import ThemeToggle from '@/components/TicTacToe/ThemeToggle';
import SoundToggle from '@/components/TicTacToe/SoundToggle';

type CasinoGame = 'slots' | 'blackjack' | 'roulette' | 'crash' | 'dice' | 'mines' | 'snake' | 'flappy' | 'whack' | 'simon';

const games: { id: CasinoGame; name: string; icon: React.ReactNode; color: string }[] = [
  { id: 'slots', name: 'Slots', icon: '🎰', color: 'from-yellow-500 to-amber-500' },
  { id: 'blackjack', name: 'Blackjack', icon: '🃏', color: 'from-green-500 to-emerald-500' },
  { id: 'roulette', name: 'Roulette', icon: '🎡', color: 'from-amber-500 to-orange-500' },
  { id: 'crash', name: 'Crash', icon: <TrendingUp className="w-6 h-6" />, color: 'from-red-500 to-pink-500' },
  { id: 'dice', name: 'Dice', icon: <Dices className="w-6 h-6" />, color: 'from-blue-500 to-indigo-500' },
  { id: 'mines', name: 'Mines', icon: <Bomb className="w-6 h-6" />, color: 'from-cyan-500 to-teal-500' },
  { id: 'snake', name: 'Snake', icon: '🐍', color: 'from-lime-500 to-green-600' },
  { id: 'flappy', name: 'Flappy Bird', icon: '🐦', color: 'from-sky-400 to-blue-500' },
  { id: 'whack', name: 'Whack-a-Mole', icon: '🔨', color: 'from-orange-500 to-red-500' },
  { id: 'simon', name: 'Simon Says', icon: '🎵', color: 'from-purple-500 to-pink-500' },
];

const Casino = () => {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<CasinoGame | null>(null);
  const { balance, totalWagered, totalWon, isLoading, placeBet, addWinnings, resetBalance } = useCasinoBalance();

  const handleBack = () => {
    soundManager.playClick();
    if (selectedGame) {
      setSelectedGame(null);
    } else {
      navigate('/');
    }
  };

  const renderGame = () => {
    const props = {
      balance,
      onBet: placeBet,
      onWin: addWinnings,
    };

    switch (selectedGame) {
      case 'slots':
        return <SlotsGame {...props} />;
      case 'blackjack':
        return <BlackjackGame {...props} />;
      case 'roulette':
        return <RouletteGame {...props} />;
      case 'crash':
        return <CrashGame {...props} />;
      case 'dice':
        return <DiceGame {...props} />;
      case 'mines':
        return <MinesGame {...props} />;
      case 'snake':
        return <CasinoSnakeGame {...props} />;
      case 'flappy':
        return <CasinoFlappyBirdGame {...props} />;
      case 'whack':
        return <CasinoWhackAMoleGame {...props} />;
      case 'simon':
        return <CasinoSimonSaysGame {...props} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm">
        <motion.button
          onClick={handleBack}
          className="p-3 rounded-full glass-button text-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        
        <h1 className="text-xl font-bold text-foreground">
          🎰 Casino {selectedGame && `- ${games.find(g => g.id === selectedGame)?.name}`}
        </h1>
        
        <div className="flex items-center gap-2">
          <SoundToggle className="glass-button rounded-full p-3" />
          <ThemeToggle className="glass-button rounded-full p-3" />
        </div>
      </div>

      {/* Content */}
      <div className="pt-24 px-4 pb-8 max-w-4xl mx-auto">
        {/* Balance Header */}
        <CasinoHeader
          balance={balance}
          totalWagered={totalWagered}
          totalWon={totalWon}
          onReset={resetBalance}
        />

        {/* Demo Notice */}
        <motion.div 
          className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm text-muted-foreground">
            🎮 <span className="text-primary font-medium">Demo Mode</span> - Playing with virtual currency. No real money involved.
          </p>
        </motion.div>

        {/* Game Selection or Active Game */}
        <AnimatePresence mode="wait">
          {!selectedGame ? (
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">Choose a Game</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {games.map((game) => (
                  <motion.button
                    key={game.id}
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedGame(game.id);
                    }}
                    className={`p-6 rounded-2xl bg-gradient-to-br ${game.color} text-white flex flex-col items-center gap-3 shadow-lg`}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-4xl">{typeof game.icon === 'string' ? game.icon : game.icon}</span>
                    <span className="font-bold text-lg">{game.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6"
            >
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {renderGame()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Casino;
