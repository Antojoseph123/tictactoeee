import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CasinoHeaderProps {
  balance: number;
  totalWagered: number;
  totalWon: number;
  onReset: () => void;
}

export const CasinoHeader = ({ balance, totalWagered, totalWon, onReset }: CasinoHeaderProps) => {
  const profit = totalWon - totalWagered;

  return (
    <motion.div 
      className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-yellow-500/20">
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-lg font-bold text-foreground">${balance.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-red-500/20">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Wagered</p>
            <p className="text-sm font-medium text-foreground">${totalWagered.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-green-500/20">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Profit</p>
            <p className={`text-sm font-medium ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Reset to $100
      </Button>
    </motion.div>
  );
};
