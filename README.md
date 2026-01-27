# SpaceBird - Workplace Booking System

A modern web application for employees to book hot desks across multiple office locations, with a comprehensive admin panel for managing floor plans, workspaces, and monitoring usage.

## Features

### Employee Features
- **Self-registration** with email/password authentication
- **Dashboard** with quick overview of upcoming bookings
- **Desk Search & Booking** with interactive floor plan visualization
- **My Bookings** page to view, cancel, modify, and check-in to bookings
- **Time-based booking** with hourly or full-day options

### Admin Features
- **Location Management** - Add, edit, and delete office locations
- **Floor Management** - Create floors with customizable grid layouts
- **Desk Management** - Add desks with equipment and capacity settings
- **Reports & Analytics** - View booking trends, popular desks, and usage statistics

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (Authentication, Database, Real-time)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd spacebird
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database schema in Supabase:

Run the following SQL in your Supabase SQL editor:

```sql
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
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User roles: Users can read their own role
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

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

-- Reservations: Users can view and manage their own, admins can view all
CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" ON reservations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT USING (
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
```

5. Create your first admin user:

After registering a user, you can manually update their role in Supabase:

```sql
-- Replace 'user-email@example.com' with the email of the user you want to make admin
UPDATE user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM users WHERE email = 'user-email@example.com'
);
```

6. Start the development server:
```bash
npm run dev
```

7. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
spacebird/
├── src/
│   ├── components/
│   │   ├── ui/          # Reusable UI components (shadcn/ui style)
│   │   ├── Layout.tsx   # Main layout with navigation
│   │   └── ProtectedRoute.tsx
│   ├── hooks/
│   │   └── useAuth.ts   # Authentication hook
│   ├── lib/
│   │   ├── supabase.ts  # Supabase client configuration
│   │   └── utils.ts     # Utility functions
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── BookDesk.tsx
│   │   ├── MyBookings.tsx
│   │   └── admin/       # Admin pages
│   ├── App.tsx          # Main app component with routes
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Usage

### For Employees

1. **Register/Login**: Create an account or sign in
2. **Book a Desk**: 
   - Select a location, date, and floor
   - View the interactive grid of available desks
   - Click on a green (available) desk to book it
   - Choose time slots or full-day booking
3. **Manage Bookings**: View all bookings, check in when arriving, or cancel if needed

### For Admins

1. **Manage Locations**: Add office locations with addresses
2. **Manage Floors**: Create floors within locations with grid dimensions
3. **Manage Desks**: Add desks to floors, set positions, equipment, and capacity
4. **View Reports**: Monitor booking trends, popular desks, and system usage

## Security

- Row-Level Security (RLS) policies ensure users can only access their own bookings
- Admin-only access to management functions
- Secure authentication via Supabase Auth
- All database operations are protected by RLS policies

## Deployment

### Deploy to Netlify

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed step-by-step instructions on deploying to Netlify.

**Quick Summary:**
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
6. Deploy!

The `netlify.toml` file is already configured for SPA routing.

## License

MIT

