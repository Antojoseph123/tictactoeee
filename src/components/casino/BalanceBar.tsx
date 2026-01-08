import { RefreshCw, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface BalanceBarProps {
  balance: number;
  onReset: () => void;
}

export const BalanceBar = ({ balance, onReset }: BalanceBarProps) => {
  return (
    <div className="relative rounded-2xl bg-surface border border-border p-6">
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-t-2xl" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Icon container */}
          <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center">
            <Wallet className="w-5 h-5 text-accent" />
          </div>
          
          <div>
            <span className="text-xs text-text-dim uppercase tracking-[0.15em] font-medium">
              Demo Balance
            </span>
            <motion.p 
              key={balance}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-text tabular-nums"
            >
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </motion.p>
          </div>
        </div>
        
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-elevated border border-transparent hover:border-border transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset to $1,000</span>
        </button>
      </div>
    </div>
  );
};

export default BalanceBar;
