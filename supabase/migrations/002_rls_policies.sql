-- Row Level Security Policies for SoundCheck
-- Run this after creating the initial schema

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Rehearsals table policies
DROP POLICY IF EXISTS "Users can view own rehearsals" ON public.rehearsals;
CREATE POLICY "Users can view own rehearsals" ON public.rehearsals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own rehearsals" ON public.rehearsals;
CREATE POLICY "Users can insert own rehearsals" ON public.rehearsals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own rehearsals" ON public.rehearsals;
CREATE POLICY "Users can update own rehearsals" ON public.rehearsals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own rehearsals" ON public.rehearsals;
CREATE POLICY "Users can delete own rehearsals" ON public.rehearsals
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks table policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Gigs table policies
DROP POLICY IF EXISTS "Users can view own gigs" ON public.gigs;
CREATE POLICY "Users can view own gigs" ON public.gigs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own gigs" ON public.gigs;
CREATE POLICY "Users can insert own gigs" ON public.gigs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own gigs" ON public.gigs;
CREATE POLICY "Users can update own gigs" ON public.gigs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own gigs" ON public.gigs;
CREATE POLICY "Users can delete own gigs" ON public.gigs
  FOR DELETE USING (auth.uid() = user_id);