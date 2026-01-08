import { RefreshCw } from "lucide-react";

interface BalanceBarProps {
  balance: number;
  onReset: () => void;
}

export const BalanceBar = ({ balance, onReset }: BalanceBarProps) => {
  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-border">
      <div className="flex items-center gap-6">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Balance</span>
          <p className="text-xl font-semibold text-foreground">
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>
      
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reset
      </button>
    </div>
  );
};

export default BalanceBar;
