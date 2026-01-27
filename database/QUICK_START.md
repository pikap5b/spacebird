# Quick Database Setup Guide

## Step 1: Create All Tables and Policies

**Run the complete schema first:**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/schema.sql` from this project
4. Copy the **entire contents** of `schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- All tables (users, user_roles, locations, floors, desks, reservations, check_ins)
- All RLS policies (including the INSERT policies needed for registration)
- All triggers and functions

## Step 2: Verify Tables Were Created

After running the schema, verify the tables exist:

1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - `users`
   - `user_roles`
   - `locations`
   - `floors`
   - `desks`
   - `reservations`
   - `check_ins`

## Step 3: (Optional) Fix Existing Setup

If you already ran the schema before but are missing the INSERT policies:

1. Go to **SQL Editor**
2. Run `database/fix-rls-policies.sql`
3. This will safely add the missing INSERT policies

## Troubleshooting

### Error: "relation does not exist"
- **Solution**: You haven't run `schema.sql` yet. Run it first (Step 1).

### Error: "policy already exists"
- **Solution**: The policy is already there, you're all set! This is safe to ignore.

### Tables exist but registration still fails
- **Solution**: Make sure you ran the complete `schema.sql` which includes the INSERT policies.
- Or run `fix-rls-policies.sql` to add them.

## Next Steps

After setting up the database:

1. Create your first admin user (see README.md)
2. Test user registration in your app
3. Start adding locations, floors, and desks through the admin panel

