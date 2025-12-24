import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, Check, X, Search, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { soundManager } from "@/utils/sounds";
import { toast } from "sonner";
import { AVATARS } from "./avatars";

interface Friend {
  id: string;
  username: string;
  avatar_index: number;
  wins: number;
  status: 'pending' | 'accepted';
  isIncoming: boolean;
  friendshipId: string;
}

interface FriendsPanelProps {
  onBack: () => void;
}

const FriendsPanel = ({ onBack }: FriendsPanelProps) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; user_id: string; username: string; avatar_index: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'friends' | 'requests' | 'add'>('friends');

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (error) throw error;

      // Get all friend user IDs
      const friendIds = (friendships || []).map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      if (friendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', friendIds);

      if (profilesError) throw profilesError;

      const friendList: Friend[] = (friendships || []).map(f => {
        const friendUserId = f.user_id === user.id ? f.friend_id : f.user_id;
        const profile = profiles?.find(p => p.user_id === friendUserId);
        
        return {
          id: profile?.id || '',
          username: profile?.username || 'Unknown',
          avatar_index: profile?.avatar_index || 0,
          wins: profile?.wins || 0,
          status: f.status as 'pending' | 'accepted',
          isIncoming: f.friend_id === user.id,
          friendshipId: f.id,
        };
      });

      setFriends(friendList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    
    setSearching(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, avatar_index')
        .ilike('username', `%${searchQuery}%`)
        .neq('user_id', user.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendUserId: string) => {
    if (!user) return;
    
    soundManager.playClick();
    
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendUserId,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Friend request already sent');
        } else {
          throw error;
        }
      } else {
        toast.success('Friend request sent!');
        setSearchResults(prev => prev.filter(r => r.user_id !== friendUserId));
        fetchFriends();
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send request');
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    soundManager.playClick();
    
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;
      
      toast.success('Friend request accepted!');
      fetchFriends();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const rejectRequest = async (friendshipId: string) => {
    soundManager.playClick();
    
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      
      toast.success('Friend request rejected');
      fetchFriends();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const pendingRequests = friends.filter(f => f.status === 'pending' && f.isIncoming);
  const sentRequests = friends.filter(f => f.status === 'pending' && !f.isIncoming);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-2xl font-light text-center text-foreground flex items-center justify-center gap-2">
        <Users className="w-6 h-6 text-primary" />
        Friends
      </h2>

      {/* Tabs */}
      <div className="glass-panel rounded-xl p-1 flex gap-1">
        {(['friends', 'requests', 'add'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { soundManager.playClick(); setTab(t); }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'friends' && `Friends (${acceptedFriends.length})`}
            {t === 'requests' && `Requests (${pendingRequests.length})`}
            {t === 'add' && 'Add Friend'}
          </button>
        ))}
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {acceptedFriends.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No friends yet</p>
            </div>
          ) : (
            acceptedFriends.map((friend) => (
              <motion.div
                key={friend.id}
                className="glass-panel rounded-xl p-3 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{AVATARS[friend.avatar_index]}</span>
                  <div>
                    <p className="font-medium text-foreground">{friend.username}</p>
                    <p className="text-xs text-muted-foreground">{friend.wins} wins</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Pending requests */}
      {tab === 'requests' && (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {pendingRequests.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            pendingRequests.map((friend) => (
              <motion.div
                key={friend.friendshipId}
                className="glass-panel rounded-xl p-3 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{AVATARS[friend.avatar_index]}</span>
                  <p className="font-medium text-foreground">{friend.username}</p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => acceptRequest(friend.friendshipId)}
                    className="glass-button rounded-lg p-2 text-green-400"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => rejectRequest(friend.friendshipId)}
                    className="glass-button rounded-lg p-2 text-red-400"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}

          {sentRequests.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground pt-2">Sent Requests</p>
              {sentRequests.map((friend) => (
                <motion.div
                  key={friend.friendshipId}
                  className="glass-panel rounded-xl p-3 flex items-center justify-between opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{AVATARS[friend.avatar_index]}</span>
                    <p className="font-medium text-foreground">{friend.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Pending</span>
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Add friend */}
      {tab === 'add' && (
        <div className="space-y-3">
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by username"
                className="flex-1 bg-card/10 border border-border/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <motion.button
                onClick={handleSearch}
                disabled={searching}
                className="glass-button rounded-xl px-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {searchResults.map((result) => (
              <motion.div
                key={result.id}
                className="glass-panel rounded-xl p-3 flex items-center justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{AVATARS[result.avatar_index]}</span>
                  <p className="font-medium text-foreground">{result.username}</p>
                </div>
                <motion.button
                  onClick={() => sendFriendRequest(result.user_id)}
                  className="glass-button rounded-lg p-2 text-primary"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <UserPlus className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <motion.button
        onClick={() => { soundManager.playClick(); onBack(); }}
        className="glass-button rounded-xl px-6 py-3 flex items-center gap-2 mx-auto text-muted-foreground"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </motion.button>
    </motion.div>
  );
};

export default FriendsPanel;
