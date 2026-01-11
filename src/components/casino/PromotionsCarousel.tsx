import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Zap, Coins, Crown, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  badge?: string;
  timeLeft?: string;
}

const promotions: Promotion[] = [
  {
    id: "daily-challenge",
    title: "Daily Challenge",
    subtitle: "Win 5 games in a row",
    description: "Complete today's challenge and earn 500 bonus credits",
    icon: Zap,
    gradient: "from-primary/30 via-primary/10 to-transparent",
    badge: "NEW",
    timeLeft: "12h 34m",
  },
  {
    id: "rakeback",
    title: "10% Rakeback",
    subtitle: "Get cashback on every bet",
    description: "Earn back 10% of your wagers automatically, win or lose",
    icon: Coins,
    gradient: "from-gold/30 via-gold/10 to-transparent",
    badge: "VIP",
  },
  {
    id: "weekly-bonus",
    title: "Weekly Reload",
    subtitle: "50% deposit bonus",
    description: "Top up your balance and get 50% extra, up to $500",
    icon: Gift,
    gradient: "from-accent/30 via-accent/10 to-transparent",
    timeLeft: "3d 8h",
  },
  {
    id: "vip-drop",
    title: "VIP Drops",
    subtitle: "Exclusive rewards",
    description: "Random bonus drops for VIP members every hour",
    icon: Crown,
    gradient: "from-gold/30 via-gold/10 to-transparent",
    badge: "EXCLUSIVE",
  },
];

export const PromotionsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Promotions</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={goToPrev}
            className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-elevated flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={goToNext}
            className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-elevated flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop grid view */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {promotions.map((promo) => (
          <PromotionCard key={promo.id} promotion={promo} />
        ))}
      </div>

      {/* Mobile carousel */}
      <div className="md:hidden relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <PromotionCard promotion={promotions[currentIndex]} />
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-4">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-primary" : "bg-surface-elevated"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const PromotionCard = ({ promotion }: { promotion: Promotion }) => {
  const Icon = promotion.icon;
  
  return (
    <div className="group relative overflow-hidden rounded-xl bg-surface border border-border hover:border-primary/30 transition-all cursor-pointer">
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${promotion.gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
      
      {/* Content */}
      <div className="relative p-5">
        {/* Badge */}
        {promotion.badge && (
          <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold rounded bg-primary/20 text-primary border border-primary/30">
            {promotion.badge}
          </span>
        )}

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>

        {/* Text */}
        <h3 className="font-semibold text-sm mb-1">{promotion.title}</h3>
        <p className="text-xs text-primary font-medium mb-2">{promotion.subtitle}</p>
        <p className="text-xs text-text-muted line-clamp-2">{promotion.description}</p>

        {/* Timer */}
        {promotion.timeLeft && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-text-dim">
            <Clock className="w-3.5 h-3.5" />
            <span>{promotion.timeLeft} left</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsCarousel;