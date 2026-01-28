-- Fix RLS Policy for Users to allow viewing basic info for bookings display
-- This allows all users to see email and full_name of other users for booking displays

-- Drop existing policy if it exists (optional, for re-running)
-- DROP POLICY IF EXISTS "Everyone can view user names for bookings" ON users;

-- Create policy to allow everyone to view basic user info (email and full_name)
-- This is needed to display booking owner names in the timeline view
CREATE POLICY "Everyone can view user names for bookings" ON users
  FOR SELECT USING (true);

