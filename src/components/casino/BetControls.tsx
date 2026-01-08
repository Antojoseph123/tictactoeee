import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BetControlsProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  balance: number;
  minBet?: number;
  maxBet?: number;
  disabled?: boolean;
}

export const BetControls = ({ 
  betAmount, 
  setBetAmount, 
  balance, 
  minBet = 1, 
  maxBet = 1000,
  disabled = false 
}: BetControlsProps) => {
  const presetMultipliers = [0.5, 2];
  const presetAmounts = [1, 5, 10, 25, 50, 100];

  const adjustBet = (delta: number) => {
    const newAmount = Math.max(minBet, Math.min(maxBet, Math.min(balance, betAmount + delta)));
    setBetAmount(newAmount);
  };

  const multiplyBet = (multiplier: number) => {
    const newAmount = Math.max(minBet, Math.min(maxBet, Math.min(balance, Math.floor(betAmount * multiplier))));
    setBetAmount(newAmount);
  };

  const setPresetAmount = (amount: number) => {
    setBetAmount(Math.min(balance, amount));
  };

  const setMaxBet = () => {
    setBetAmount(Math.min(balance, maxBet));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustBet(-1)}
          disabled={disabled || betAmount <= minBet}
          className="h-10 w-10"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setBetAmount(Math.max(minBet, Math.min(maxBet, Math.min(balance, val))));
            }}
            disabled={disabled}
            className="w-full h-10 pl-7 pr-3 text-center font-bold bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustBet(1)}
          disabled={disabled || betAmount >= Math.min(balance, maxBet)}
          className="h-10 w-10"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {presetMultipliers.map((mult) => (
          <Button
            key={mult}
            variant="secondary"
            size="sm"
            onClick={() => multiplyBet(mult)}
            disabled={disabled}
            className="flex-1 min-w-[60px]"
          >
            {mult}x
          </Button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={setMaxBet}
          disabled={disabled}
          className="flex-1 min-w-[60px]"
        >
          Max
        </Button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {presetAmounts.map((amount) => (
          <motion.button
            key={amount}
            onClick={() => setPresetAmount(amount)}
            disabled={disabled || amount > balance}
            className="px-3 py-1 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ${amount}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
