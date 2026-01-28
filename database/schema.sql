-- SpaceBird Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Floors
CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grid_rows INTEGER NOT NULL DEFAULT 5,
  grid_cols INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desks
CREATE TABLE IF NOT EXISTS desks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grid_row INTEGER NOT NULL,
  grid_col INTEGER NOT NULL,
  equipment TEXT[],
  capacity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(floor_id, grid_row, grid_col)
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  desk_id UUID NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE desks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Users: Users can read their own profile, admins can read all
-- Also allow everyone to view basic user info (email, full_name) for booking displays
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Everyone can view user names for bookings" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User roles: Users can read and insert their own role
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Locations: Everyone can read, only admins can modify
CREATE POLICY "Everyone can view locations" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage locations" ON locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Floors: Everyone can read, only admins can modify
CREATE POLICY "Everyone can view floors" ON floors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage floors" ON floors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Desks: Everyone can read, only admins can modify
CREATE POLICY "Everyone can view desks" ON desks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage desks" ON desks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Reservations: Everyone can view all reservations (for availability checking)
-- Users can only create/update their own reservations
CREATE POLICY "Everyone can view reservations for availability" ON reservations
  FOR SELECT USING (true);

CREATE POLICY "Users can create own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" ON reservations
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can delete any reservation (optional, for management)
CREATE POLICY "Admins can delete reservations" ON reservations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Check-ins: Users can view their own, admins can view all
CREATE POLICY "Users can view own check-ins" ON check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = check_ins.reservation_id
      AND reservations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create check-ins for own reservations" ON check_ins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = check_ins.reservation_id
      AND reservations.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all check-ins" ON check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Functions and Triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_floors_updated_at BEFORE UPDATE ON floors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_desks_updated_at BEFORE UPDATE ON desks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

