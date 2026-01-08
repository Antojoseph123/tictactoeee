import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCasinoBalance } from "@/hooks/useCasinoBalance";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { balance, totalWagered, totalWon } = useCasinoBalance();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const profit = totalWon - totalWagered;

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Top bar */}
      <header className="sticky top-0 h-14 bg-bg border-b border-border px-4 flex items-center gap-4 z-30">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="font-semibold">GameHub</span>
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-surface-elevated flex items-center justify-center">
              <User className="w-8 h-8 text-text-muted" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{profile?.username || "Player"}</h1>
              <p className="text-text-muted text-sm">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-surface rounded-xl p-6">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">Statistics</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-text-dim">Balance</span>
                <p className="text-xl font-semibold">${balance.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-text-dim">Wagered</span>
                <p className="text-xl font-semibold">${totalWagered.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-text-dim">Profit</span>
                <p className={`text-xl font-semibold ${profit >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-surface rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wide">Account</h2>
            
            <div>
              <span className="text-xs text-text-dim">Username</span>
              <p className="font-medium">{profile?.username || "Player"}</p>
            </div>
            
            <div>
              <span className="text-xs text-text-dim">Email</span>
              <p className="text-text-muted">{user.email}</p>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-3 text-text-muted hover:text-text bg-surface hover:bg-surface-elevated rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;
