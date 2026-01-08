import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";

export const CasinoNav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-xl border-b border-border" />
      
      <div className="relative flex items-center justify-between max-w-5xl mx-auto">
        {/* Logo */}
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group"
        >
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-primary to-primary-muted flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-lg font-semibold text-text tracking-tight">
            Game<span className="text-primary">Hub</span>
          </span>
        </button>

        {/* Nav actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface border border-border transition-all duration-200"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-surface border border-border text-text hover:bg-surface-elevated transition-all duration-200"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default CasinoNav;
