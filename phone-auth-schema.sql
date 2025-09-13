-- Phone-only authentication schema (no Supabase auth dependency)

-- Drop existing foreign key constraints
ALTER TABLE public.user_tokens DROP CONSTRAINT IF EXISTS user_tokens_user_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_project_id_fkey;
ALTER TABLE public.income DROP CONSTRAINT IF EXISTS income_project_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- Drop existing tables to recreate with new schema
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.income CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.user_tokens CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Users table (standalone, no auth.users dependency)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(255),
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table for managing login sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User tokens table for billing (updated to reference new users table)
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  balance INTEGER DEFAULT 5, -- Start with 5 free tokens
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (updated to reference new users table)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  boq_budget DECIMAL(12,2),
  tax_rate DECIMAL(5,2) DEFAULT 16.00,
  reinvestment_rate DECIMAL(5,2) DEFAULT 30.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Income table
CREATE TABLE IF NOT EXISTS public.income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  source VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table for M-PESA transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  mpesa_receipt VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tokens_added INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_verified ON public.users(verified);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_income_project_id ON public.income(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments(mpesa_receipt);

-- Row Level Security Policies (simplified for phone auth)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all data (for API endpoints)
CREATE POLICY "Service role can manage all users" ON public.users FOR ALL USING (true);
CREATE POLICY "Service role can manage all sessions" ON public.user_sessions FOR ALL USING (true);
CREATE POLICY "Service role can manage all tokens" ON public.user_tokens FOR ALL USING (true);
CREATE POLICY "Service role can manage all projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Service role can manage all expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Service role can manage all income" ON public.income FOR ALL USING (true);
CREATE POLICY "Service role can manage all payments" ON public.payments FOR ALL USING (true);

-- Functions for session management
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update token balance
CREATE OR REPLACE FUNCTION public.update_user_tokens(user_uuid UUID, token_change INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_tokens 
  SET balance = balance + token_change, updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check token balance
CREATE OR REPLACE FUNCTION public.get_user_token_balance(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  token_balance INTEGER;
BEGIN
  SELECT balance INTO token_balance
  FROM public.user_tokens
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(token_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;