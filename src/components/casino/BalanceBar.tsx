import { RefreshCw, Wallet } from "lucide-react";

interface BalanceBarProps {
  balance: number;
  onReset: () => void;
}

export const BalanceBar = ({ balance, onReset }: BalanceBarProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-xs text-text-dim block">Balance</span>
          <p className="text-xl font-bold tabular-nums">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-elevated transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Reset</span>
      </button>
    </div>
  );
};

export default BalanceBar;
