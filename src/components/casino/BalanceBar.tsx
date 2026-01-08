import { RefreshCw, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface BalanceBarProps {
  balance: number;
  onReset: () => void;
}

export const BalanceBar = ({ balance, onReset }: BalanceBarProps) => {
  return (
    <div className="balance-display-premium p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* Icon container with glow */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-accent" />
            </div>
            {/* Subtle glow */}
            <div className="absolute inset-0 rounded-2xl bg-accent/20 blur-xl opacity-50" />
          </div>
          
          <div>
            <span className="text-xs text-text-dim uppercase tracking-[0.2em] font-medium block mb-1">
              Demo Balance
            </span>
            <motion.p 
              key={balance}
              initial={{ scale: 1.05, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold text-text tabular-nums"
            >
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </motion.p>
          </div>
        </div>
        
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-text bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset to $1,000</span>
        </button>
      </div>
    </div>
  );
};

export default BalanceBar;
