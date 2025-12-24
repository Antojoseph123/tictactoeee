import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { soundManager } from "@/utils/sounds";

const SoundToggle = () => {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ttt_sound_enabled');
    if (saved !== null) {
      const isEnabled = saved === 'true';
      setEnabled(isEnabled);
      soundManager.setEnabled(isEnabled);
    }
  }, []);

  const toggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    soundManager.setEnabled(newState);
    localStorage.setItem('ttt_sound_enabled', String(newState));
    
    if (newState) {
      soundManager.playClick();
    }
  };

  return (
    <motion.button
      onClick={toggle}
      className="glass-button rounded-full p-3 fixed top-4 right-4 z-20"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={enabled ? 'Mute sounds' : 'Enable sounds'}
    >
      {enabled ? (
        <Volume2 className="w-5 h-5 text-foreground" />
      ) : (
        <VolumeX className="w-5 h-5 text-muted-foreground" />
      )}
    </motion.button>
  );
};

export default SoundToggle;
