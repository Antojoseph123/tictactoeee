import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'moderator' | 'user';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      console.log('[useUserRole] Starting fetchRole, user:', user?.id);
      
      if (!user) {
        console.log('[useUserRole] No user, setting role to user');
        setRole('user');
        setIsLoading(false);
        return;
      }

      try {
        console.log('[useUserRole] Calling get_user_role RPC for user:', user.id);
        const { data, error } = await supabase
          .rpc('get_user_role', { _user_id: user.id });

        console.log('[useUserRole] RPC response - data:', data, 'error:', error);

        if (error) {
          console.error('[useUserRole] Error fetching role:', error);
          setRole('user');
        } else {
          const fetchedRole = (data as AppRole) || 'user';
          console.log('[useUserRole] Setting role to:', fetchedRole);
          setRole(fetchedRole);
        }
      } catch (err) {
        console.error('[useUserRole] Error in useUserRole:', err);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return {
    role,
    isLoading,
    loading: isLoading, // Alias for backward compatibility
    isAdmin: role === 'admin',
    isModerator: role === 'admin' || role === 'moderator',
  };
};
