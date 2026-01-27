-- Fix RLS Policies for Reservations
-- This allows all users to VIEW all reservations (to see availability)
-- but only CREATE/UPDATE their own reservations
-- Run this SQL in your Supabase SQL Editor

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;

-- Create new policy: Everyone can view all reservations for availability checking
CREATE POLICY "Everyone can view reservations for availability" ON reservations
  FOR SELECT USING (true);

-- Keep existing policies for INSERT and UPDATE (users can only manage their own)
-- These should already exist, but we'll ensure they're correct

-- Users can create their own reservations
DROP POLICY IF EXISTS "Users can create own reservations" ON reservations;
CREATE POLICY "Users can create own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reservations
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
CREATE POLICY "Users can update own reservations" ON reservations
  FOR UPDATE USING (auth.uid() = user_id);

