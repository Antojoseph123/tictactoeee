import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { soundManager } from "@/utils/sounds";
import { toast } from "sonner";
import { AVATARS } from "./avatars";

interface ProfileEditorProps {
  onBack: () => void;
}

const ProfileEditor = ({ onBack }: ProfileEditorProps) => {
  const { profile, refreshProfile } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_index || 0);
  const [username, setUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    soundManager.playClick();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim() || profile.username,
          avatar_index: selectedAvatar,
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('Profile updated!');
      onBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-2xl font-light text-center text-foreground">Edit Profile</h2>

      {/* Current avatar display */}
      <div className="flex justify-center">
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-5xl"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {AVATARS[selectedAvatar]}
        </motion.div>
      </div>

      {/* Avatar selection */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="text-sm text-muted-foreground mb-3">Choose Avatar</p>
        <div className="grid grid-cols-8 gap-2">
          {AVATARS.map((avatar, index) => (
            <motion.button
              key={index}
              onClick={() => { soundManager.playClick(); setSelectedAvatar(index); }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                selectedAvatar === index
                  ? 'bg-primary/30 ring-2 ring-primary'
                  : 'glass-button hover:bg-card/20'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {avatar}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Username input */}
      <div className="glass-panel rounded-2xl p-4">
        <label className="block text-sm text-muted-foreground mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          className="w-full bg-card/10 border border-border/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          maxLength={20}
        />
      </div>

      {/* Stats display */}
      {profile && (
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-sm text-muted-foreground mb-2">Your Stats</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xl font-medium text-foreground">{profile.games_played}</p>
              <p className="text-xs text-muted-foreground">Games</p>
            </div>
            <div>
              <p className="text-xl font-medium text-primary">{profile.wins}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div>
              <p className="text-xl font-medium text-secondary">{profile.losses}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <div>
              <p className="text-xl font-medium text-muted-foreground">{profile.draws}</p>
              <p className="text-xs text-muted-foreground">Draws</p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={() => { soundManager.playClick(); onBack(); }}
          className="glass-button rounded-xl px-6 py-3 flex-1 flex items-center justify-center gap-2 text-muted-foreground"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="glass-button rounded-xl px-6 py-3 flex-1 flex items-center justify-center gap-2 text-primary disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Check className="w-5 h-5" />
          Save
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProfileEditor;
