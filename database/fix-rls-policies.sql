-- Fix RLS Policies for User Registration
-- Run this SQL in your Supabase SQL Editor to fix the registration issue
-- 
-- IMPORTANT: Make sure you've run database/schema.sql first to create the tables!
-- If you get "relation does not exist" error, run schema.sql first.

-- Check if tables exist before creating policies
DO $$
BEGIN
  -- Add INSERT policy for users table (only if table exists and policy doesn't)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND policyname = 'Users can insert own profile'
    ) THEN
      CREATE POLICY "Users can insert own profile" ON users
        FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
  ELSE
    RAISE NOTICE 'Table "users" does not exist. Please run database/schema.sql first!';
  END IF;

  -- Add INSERT policy for user_roles table (only if table exists and policy doesn't)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Users can insert own role'
    ) THEN
      CREATE POLICY "Users can insert own role" ON user_roles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
  ELSE
    RAISE NOTICE 'Table "user_roles" does not exist. Please run database/schema.sql first!';
  END IF;
END $$;

