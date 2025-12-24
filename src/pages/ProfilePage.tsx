import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DynamicIsland from "@/components/layout/DynamicIsland";
import ProfileEditor from "@/components/TicTacToe/ProfileEditor";
import FriendsPanel from "@/components/TicTacToe/FriendsPanel";
import ThemeToggle from "@/components/TicTacToe/ThemeToggle";
import SoundToggle from "@/components/TicTacToe/SoundToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "friends">("profile");

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen">
      <DynamicIsland />
      <ThemeToggle />
      <SoundToggle />

      <div className="pt-24 pb-16 px-6">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            <motion.button
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-2.5 rounded-full font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-primary text-primary-foreground"
                  : "glass-button text-muted-foreground"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Profile
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("friends")}
              className={`px-6 py-2.5 rounded-full font-medium transition-colors ${
                activeTab === "friends"
                  ? "bg-primary text-primary-foreground"
                  : "glass-button text-muted-foreground"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Friends
            </motion.button>
          </div>

          {activeTab === "profile" ? (
            <ProfileEditor onBack={() => navigate("/")} />
          ) : (
            <FriendsPanel onBack={() => navigate("/")} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
