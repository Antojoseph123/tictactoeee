import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_BALANCE_KEY = 'casino_demo_balance';
const DEFAULT_BALANCE = 100;

export const useCasinoBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(DEFAULT_BALANCE);
  const [totalWagered, setTotalWagered] = useState<number>(0);
  const [totalWon, setTotalWon] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load balance on mount
  useEffect(() => {
    const loadBalance = async () => {
      setIsLoading(true);
      
      if (user) {
        // Fetch from database for logged-in users
        const { data, error } = await supabase
          .from('casino_balances')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching balance:', error);
        }

        if (data) {
          setBalance(Number(data.balance));
          setTotalWagered(Number(data.total_wagered));
          setTotalWon(Number(data.total_won));
        } else {
          // Create initial balance for new user
          const { error: insertError } = await supabase
            .from('casino_balances')
            .insert({ user_id: user.id, balance: DEFAULT_BALANCE });
          
          if (insertError) {
            console.error('Error creating balance:', insertError);
          }
          setBalance(DEFAULT_BALANCE);
          setTotalWagered(0);
          setTotalWon(0);
        }
      } else {
        // Use local storage for guests
        const stored = localStorage.getItem(DEMO_BALANCE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setBalance(parsed.balance ?? DEFAULT_BALANCE);
          setTotalWagered(parsed.totalWagered ?? 0);
          setTotalWon(parsed.totalWon ?? 0);
        } else {
          setBalance(DEFAULT_BALANCE);
        }
      }
      
      setIsLoading(false);
    };

    loadBalance();
  }, [user]);

  // Save to local storage for guests
  const saveToLocalStorage = useCallback((newBalance: number, newWagered: number, newWon: number) => {
    localStorage.setItem(DEMO_BALANCE_KEY, JSON.stringify({
      balance: newBalance,
      totalWagered: newWagered,
      totalWon: newWon
    }));
  }, []);

  // Place a bet - returns false if insufficient balance
  const placeBet = useCallback(async (amount: number): Promise<boolean> => {
    if (amount > balance || amount <= 0) return false;

    const newBalance = balance - amount;
    const newWagered = totalWagered + amount;
    
    setBalance(newBalance);
    setTotalWagered(newWagered);

    if (user) {
      await supabase
        .from('casino_balances')
        .update({ 
          balance: newBalance, 
          total_wagered: newWagered 
        })
        .eq('user_id', user.id);
    } else {
      saveToLocalStorage(newBalance, newWagered, totalWon);
    }

    return true;
  }, [balance, totalWagered, totalWon, user, saveToLocalStorage]);

  // Add winnings
  const addWinnings = useCallback(async (amount: number) => {
    const newBalance = balance + amount;
    const newWon = totalWon + amount;
    
    setBalance(newBalance);
    setTotalWon(newWon);

    if (user) {
      await supabase
        .from('casino_balances')
        .update({ 
          balance: newBalance, 
          total_won: newWon 
        })
        .eq('user_id', user.id);
    } else {
      saveToLocalStorage(newBalance, totalWagered, newWon);
    }
  }, [balance, totalWon, totalWagered, user, saveToLocalStorage]);

  // Reset balance to default
  const resetBalance = useCallback(async () => {
    setBalance(DEFAULT_BALANCE);
    setTotalWagered(0);
    setTotalWon(0);

    if (user) {
      await supabase
        .from('casino_balances')
        .update({ 
          balance: DEFAULT_BALANCE, 
          total_wagered: 0, 
          total_won: 0 
        })
        .eq('user_id', user.id);
    } else {
      saveToLocalStorage(DEFAULT_BALANCE, 0, 0);
    }
  }, [user, saveToLocalStorage]);

  return {
    balance,
    totalWagered,
    totalWon,
    isLoading,
    placeBet,
    addWinnings,
    resetBalance
  };
};
