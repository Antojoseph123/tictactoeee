import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { soundManager } from "@/utils/sounds";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    soundManager.playClick();
    toggleTheme();
  };

  const defaultClass = "glass-button rounded-full p-3 fixed top-4 left-4 z-20";

  return (
    <motion.button
      onClick={handleToggle}
      className={className || defaultClass}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-foreground" />
      ) : (
        <Moon className="w-5 h-5 text-foreground" />
      )}
    </motion.button>
  );
};

export default ThemeToggle;
