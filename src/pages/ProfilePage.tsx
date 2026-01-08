import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CasinoNav from "@/components/casino/CasinoNav";
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
    <div className="min-h-screen">
      <CasinoNav />

      <main className="pt-20 px-6 pb-12">
        <div className="max-w-lg mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h1 className="text-2xl font-semibold text-foreground">Profile</h1>

            {/* User Info */}
            <div className="game-card p-6 space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Username</span>
                <p className="text-lg font-medium text-foreground">{profile?.username || "Player"}</p>
              </div>
              
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Email</span>
                <p className="text-foreground">{user.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="game-card p-6">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Statistics</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <p className="text-xl font-semibold text-foreground">${balance.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Wagered</span>
                  <p className="text-xl font-semibold text-foreground">${totalWagered.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Profit</span>
                  <p className={`text-xl font-semibold ${profit >= 0 ? 'indicator-win' : 'indicator-loss'}`}>
                    {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
