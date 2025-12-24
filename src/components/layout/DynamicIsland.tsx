import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Gamepad2, Trophy, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { soundManager } from "@/utils/sounds";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { id: "home", label: "Overview", icon: Home, path: "/" },
  { id: "games", label: "Games", icon: Gamepad2, path: "/games" },
  { id: "leaderboard", label: "Rankings", icon: Trophy, path: "/leaderboard" },
];

export const DynamicIsland = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavClick = (path: string) => {
    soundManager.playClick();
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      className="dynamic-island"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: 0.2,
      }}
    >
      <AnimatePresence mode="wait">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => handleNavClick(item.path)}
            className={`dynamic-island-item ${isActive(item.path) ? "active" : ""}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <span className="flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Divider */}
      <div className="w-px h-6 bg-border/50 mx-1" />

      {/* User/Settings */}
      {user ? (
        <motion.button
          onClick={() => handleNavClick("/profile")}
          className={`dynamic-island-item ${isActive("/profile") ? "active" : ""}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <User className="w-4 h-4" />
        </motion.button>
      ) : (
        <motion.button
          onClick={() => handleNavClick("/auth")}
          className="dynamic-island-item"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-primary font-medium">Sign In</span>
        </motion.button>
      )}

      <motion.button
        onClick={() => handleNavClick("/admin")}
        className={`dynamic-island-item ${isActive("/admin") ? "active" : ""}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className="w-4 h-4" />
      </motion.button>
    </motion.nav>
  );
};

export default DynamicIsland;
