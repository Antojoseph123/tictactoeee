import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";
import { motion } from "framer-motion";

export const CasinoNav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <motion.header 
      className="casino-nav-glass"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between gap-8">
        {/* Logo */}
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-primary to-primary-muted flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-lg font-semibold text-text tracking-tight hidden sm:block">
            Game<span className="text-primary">Hub</span>
          </span>
        </button>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            Games
          </button>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-white/5 transition-all duration-200"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-text hover:bg-white/10 transition-all duration-200"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default CasinoNav;
