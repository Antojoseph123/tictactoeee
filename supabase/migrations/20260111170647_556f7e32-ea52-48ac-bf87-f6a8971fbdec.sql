-- Allow admins to view all balances
CREATE POLICY "Admins can view all balances" 
ON public.casino_balances 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all balances
CREATE POLICY "Admins can update all balances" 
ON public.casino_balances 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert balances for any user
CREATE POLICY "Admins can insert balances" 
ON public.casino_balances 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));