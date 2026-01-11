import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LiveBet {
  id: string;
  game_type: string;
  bet_amount: number;
  payout: number;
  multiplier: number;
  result: string;
  created_at: string;
  user_id: string | null;
}

export const LiveBetFeed = () => {
  const [bets, setBets] = useState<LiveBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial bets
  useEffect(() => {
    const fetchBets = async () => {
      const { data, error } = await supabase
        .from("game_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setBets(data);
      }
      setIsLoading(false);
    };

    fetchBets();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("live-bets")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_history",
        },
        (payload) => {
          const newBet = payload.new as LiveBet;
          setBets((prev) => [newBet, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatGameName = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Live Bets</h2>
          <span className="flex items-center gap-1.5 ml-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-text-muted">Live</span>
          </span>
        </div>
        <div className="bg-surface rounded-xl p-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Live Bets</h2>
        <span className="flex items-center gap-1.5 ml-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-text-muted">Live</span>
        </span>
      </div>

      <div className="bg-surface rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-text-dim font-medium px-4 py-3">Game</th>
                <th className="text-left text-text-dim font-medium px-4 py-3 hidden sm:table-cell">Player</th>
                <th className="text-right text-text-dim font-medium px-4 py-3">Bet</th>
                <th className="text-right text-text-dim font-medium px-4 py-3">Multiplier</th>
                <th className="text-right text-text-dim font-medium px-4 py-3">Payout</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {bets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                      No bets yet. Be the first to play!
                    </td>
                  </tr>
                ) : (
                  bets.map((bet, index) => (
                    <motion.tr
                      key={bet.id}
                      layout
                      initial={{ opacity: 0, y: -20, backgroundColor: "hsl(0 72% 51% / 0.1)" }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        backgroundColor: "transparent",
                        transition: { duration: 0.3, delay: index * 0.02 }
                      }}
                      exit={{ opacity: 0, x: -20 }}
                      className="border-b border-border last:border-0 hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatGameName(bet.game_type)}</span>
                          <span className="text-[10px] text-text-dim">{getTimeAgo(bet.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                        Hidden
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${bet.bet_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={bet.result === "win" ? "text-casino-win" : "text-text-dim"}>
                          {bet.result === "win" ? `${bet.multiplier.toFixed(2)}x` : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={bet.result === "win" ? "text-casino-win font-medium" : "text-text-dim"}>
                          {bet.result === "win" ? `+$${bet.payout.toFixed(2)}` : "-"}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default LiveBetFeed;