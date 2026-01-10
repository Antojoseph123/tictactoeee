import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CasinoNav from "@/components/casino/CasinoNav";
import BalanceBar from "@/components/casino/BalanceBar";
import { useCasinoBalance } from "@/hooks/useCasinoBalance";
import { useGameHistory } from "@/hooks/useGameHistory";
import { GameHistoryPanel } from "@/components/casino/GameHistoryPanel";

// Casino Games
import { DiceGame } from "@/components/casino/games/DiceGame";
import { CrashGame } from "@/components/casino/games/CrashGame";
import { MinesGame } from "@/components/casino/games/MinesGame";
import { RouletteGame } from "@/components/casino/games/RouletteGame";
import { BlackjackGame } from "@/components/casino/games/BlackjackGame";
import { PlinkoGame } from "@/components/casino/games/PlinkoGame";

const gameNames: Record<string, string> = {
  dice: "Dice",
  crash: "Crash",
  mines: "Mines",
  plinko: "Plinko",
  roulette: "Roulette",
  blackjack: "Blackjack",
};

const PlayCasino = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { balance, isLoading, placeBet, addWinnings, resetBalance } = useCasinoBalance();
  const { addHistoryEntry } = useGameHistory();

  const gameName = gameId ? gameNames[gameId] : null;

  const renderGame = () => {
    if (!gameId) return null;

    const props = {
      balance,
      onBet: placeBet,
      onWin: addWinnings,
      onGameComplete: addHistoryEntry,
      gameType: gameId,
    };

    switch (gameId) {
      case "dice":
        return <DiceGame {...props} />;
      case "crash":
        return <CrashGame {...props} />;
      case "mines":
        return <MinesGame {...props} />;
      case "plinko":
        return <PlinkoGame {...props} />;
      case "roulette":
        return <RouletteGame {...props} />;
      case "blackjack":
        return <BlackjackGame {...props} />;
      default:
        return (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">Game loading...</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <CasinoNav />

      <main className="pt-20 px-4 sm:px-6 pb-12">
        {/* Back + Title */}
        <div className="max-w-4xl mx-auto py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          
          {gameName && (
            <h1 className="text-2xl font-semibold text-foreground">{gameName}</h1>
          )}
        </div>

        {/* Balance */}
        <div className="max-w-4xl mx-auto">
          <BalanceBar balance={balance} onReset={resetBalance} />
        </div>

        {/* Game Shell */}
        <div className="max-w-4xl mx-auto mt-6">
          <div className="game-shell">
            {renderGame()}
          </div>
        </div>

        {/* Game History */}
        <div className="max-w-4xl mx-auto mt-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Recent Bets
            </h3>
            <GameHistoryPanel gameType={gameId} maxHeight="250px" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlayCasino;
