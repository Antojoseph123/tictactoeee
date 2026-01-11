import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Star, Gem, Trophy, Gift, Zap, Shield, ArrowLeft, Lock, Check, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCasinoBalance } from "@/hooks/useCasinoBalance";

interface VIPTier {
  name: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  wagerRequired: number;
  rakeback: string;
  benefits: string[];
  exclusive?: boolean;
}

const vipTiers: VIPTier[] = [
  {
    name: "Bronze",
    icon: Shield,
    color: "text-amber-600",
    bgGradient: "from-amber-900/30 to-amber-900/5",
    wagerRequired: 0,
    rakeback: "5%",
    benefits: ["Basic support", "Weekly bonus", "Daily challenges"],
  },
  {
    name: "Silver",
    icon: Star,
    color: "text-gray-400",
    bgGradient: "from-gray-500/30 to-gray-500/5",
    wagerRequired: 10000,
    rakeback: "7%",
    benefits: ["Priority support", "Increased limits", "Monthly bonus", "Exclusive games"],
  },
  {
    name: "Gold",
    icon: Crown,
    color: "text-yellow-500",
    bgGradient: "from-yellow-500/30 to-yellow-500/5",
    wagerRequired: 50000,
    rakeback: "10%",
    benefits: ["VIP support", "Higher limits", "Weekly drops", "Custom rewards", "Birthday bonus"],
  },
  {
    name: "Platinum",
    icon: Gem,
    color: "text-cyan-400",
    bgGradient: "from-cyan-400/30 to-cyan-400/5",
    wagerRequired: 250000,
    rakeback: "12%",
    benefits: ["24/7 VIP host", "Instant withdrawals", "Exclusive events", "Personalized gifts", "Loss rebate"],
    exclusive: true,
  },
  {
    name: "Diamond",
    icon: Trophy,
    color: "text-primary",
    bgGradient: "from-primary/30 to-primary/5",
    wagerRequired: 1000000,
    rakeback: "15%",
    benefits: ["Private host", "Unlimited limits", "Bespoke rewards", "Luxury experiences", "Invite-only events"],
    exclusive: true,
  },
];

const VIPClub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalWagered } = useCasinoBalance();

  // Calculate current tier based on wagered amount
  const getCurrentTier = () => {
    for (let i = vipTiers.length - 1; i >= 0; i--) {
      if (totalWagered >= vipTiers[i].wagerRequired) {
        return i;
      }
    }
    return 0;
  };

  const currentTierIndex = getCurrentTier();
  const currentTier = vipTiers[currentTierIndex];
  const nextTier = vipTiers[currentTierIndex + 1];
  const progressToNext = nextTier 
    ? Math.min(((totalWagered - currentTier.wagerRequired) / (nextTier.wagerRequired - currentTier.wagerRequired)) * 100, 100)
    : 100;

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="sticky top-0 h-16 bg-bg/95 backdrop-blur-sm border-b border-border px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            <span className="font-bold text-lg">VIP Club</span>
          </div>
        </div>
        {!user && (
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-sm font-semibold text-white transition-colors"
          >
            Join Now
          </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <motion.section 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-6">
            <Crown className="w-4 h-4" />
            PARADOX VIP PROGRAM
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">
            Experience the <span className="text-primary">Elite</span>
          </h1>
          <p className="text-text-muted max-w-2xl mx-auto">
            Unlock exclusive rewards, higher rakeback, and VIP treatment as you climb the ranks. 
            The more you play, the more you earn.
          </p>
        </motion.section>

        {/* Current Progress */}
        {user && (
          <motion.section 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentTier.bgGradient} border border-white/10 flex items-center justify-center`}>
                    <currentTier.icon className={`w-8 h-8 ${currentTier.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-text-muted mb-1">Your Current Tier</p>
                    <h2 className={`text-2xl font-bold ${currentTier.color}`}>{currentTier.name}</h2>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  {nextTier ? (
                    <>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-text-muted">Progress to {nextTier.name}</span>
                        <span className="font-medium">{progressToNext.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-surface-elevated rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressToNext}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-dim mt-2">
                        <span>${totalWagered.toLocaleString()} wagered</span>
                        <span>${nextTier.wagerRequired.toLocaleString()} required</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gold font-medium">You've reached the highest tier!</p>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm text-text-muted mb-1">Your Rakeback</p>
                  <p className="text-3xl font-bold text-primary">{currentTier.rakeback}</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* VIP Tiers */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">VIP Tiers</h2>
          <div className="grid gap-4">
            {vipTiers.map((tier, index) => {
              const Icon = tier.icon;
              const isCurrentTier = user && index === currentTierIndex;
              const isUnlocked = user && index <= currentTierIndex;
              const isLocked = user && index > currentTierIndex;

              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`relative overflow-hidden rounded-xl border transition-all ${
                    isCurrentTier 
                      ? "bg-surface border-primary/50 shadow-lg shadow-primary/10" 
                      : "bg-surface border-border hover:border-border-strong"
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-xs font-bold rounded-bl-lg">
                      CURRENT
                    </div>
                  )}

                  <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-4 lg:w-48">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.bgGradient} border border-white/10 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${tier.color}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${tier.color}`}>{tier.name}</h3>
                        <p className="text-xs text-text-dim">
                          {tier.wagerRequired === 0 ? "Starting tier" : `$${tier.wagerRequired.toLocaleString()} wagered`}
                        </p>
                      </div>
                    </div>

                    {/* Rakeback */}
                    <div className="lg:w-24">
                      <p className="text-xs text-text-dim mb-1">Rakeback</p>
                      <p className="font-bold text-primary">{tier.rakeback}</p>
                    </div>

                    {/* Benefits */}
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2">
                        {tier.benefits.map((benefit) => (
                          <span 
                            key={benefit}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-surface-elevated text-text-muted"
                          >
                            <Check className="w-3 h-3 text-primary" />
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="lg:w-24 flex justify-end">
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-text-dim" />
                      ) : isUnlocked && !isCurrentTier ? (
                        <Check className="w-5 h-5 text-casino-win" />
                      ) : null}
                    </div>
                  </div>

                  {tier.exclusive && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gold/20 text-gold border border-gold/30">
                        EXCLUSIVE
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Benefits Overview */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">VIP Benefits</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: "Instant Rakeback", desc: "Earn back a percentage of every bet, win or lose" },
              { icon: Gift, title: "Exclusive Bonuses", desc: "Weekly and monthly bonuses based on your tier" },
              { icon: Crown, title: "VIP Host", desc: "Dedicated support for Platinum+ members" },
              { icon: Trophy, title: "Leaderboard Rewards", desc: "Compete for top spots and win extra prizes" },
              { icon: Shield, title: "Priority Support", desc: "Skip the queue with priority customer service" },
              { icon: Gem, title: "Luxury Rewards", desc: "Real-world gifts and experiences for top tiers" },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className="p-5 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-text-muted">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <motion.section 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-4">Ready to join the elite?</h2>
            <p className="text-text-muted mb-6">Create an account and start earning VIP rewards today.</p>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover rounded-xl text-sm font-semibold text-white transition-colors"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-text-dim">
          Made with ❤️ by <span className="text-primary font-medium">Albin Antony</span>
        </p>
      </footer>
    </div>
  );
};

export default VIPClub;