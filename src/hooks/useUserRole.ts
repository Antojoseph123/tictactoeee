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
      if (!user) {
        setRole('user');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_user_role', { _user_id: user.id });

        if (error) {
          console.error('Error fetching role:', error);
          setRole('user');
        } else {
          setRole((data as AppRole) || 'user');
        }
      } catch (err) {
        console.error('Error in useUserRole:', err);
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
    loading: isLoading,
    isAdmin: role === 'admin',
    isModerator: role === 'admin' || role === 'moderator',
  };

  return {
    role,
    isLoading,
    loading: isLoading, // Alias for backward compatibility
    isAdmin: role === 'admin',
    isModerator: role === 'admin' || role === 'moderator',
  };
};
