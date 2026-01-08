-- Create update_updated_at function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create casino_balances table to track demo money
CREATE TABLE public.casino_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance numeric(12, 2) NOT NULL DEFAULT 100.00,
  total_wagered numeric(12, 2) NOT NULL DEFAULT 0.00,
  total_won numeric(12, 2) NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.casino_balances ENABLE ROW LEVEL SECURITY;

-- Users can view their own balance
CREATE POLICY "Users can view their own balance" 
ON public.casino_balances 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own balance
CREATE POLICY "Users can insert their own balance" 
ON public.casino_balances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own balance
CREATE POLICY "Users can update their own balance" 
ON public.casino_balances 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_casino_balances_updated_at
BEFORE UPDATE ON public.casino_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();