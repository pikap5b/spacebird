# Deploying SpaceBird to Netlify

This guide will walk you through deploying your SpaceBird application to Netlify step by step.

## Prerequisites

- A Netlify account (sign up at [netlify.com](https://netlify.com) if you don't have one)
- Your Supabase project set up and configured
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Project

### 1.1 Ensure Environment Variables are Set

Make sure you have a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Never commit your `.env` file to Git. It should already be in `.gitignore`.

### 1.2 Test Your Build Locally

Before deploying, test that your build works:

```bash
npm run build
```

This should create a `dist` folder. If there are any errors, fix them before proceeding.

### 1.3 Commit and Push Your Code

Make sure all your changes are committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push
```

## Step 2: Deploy via Netlify Dashboard

### 2.1 Create a New Site

1. Log in to your [Netlify dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories if prompted
5. Select the repository containing your SpaceBird project

### 2.2 Configure Build Settings

The `netlify.toml` file should auto-configure these, but verify:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Base directory:** (leave empty unless your project is in a subdirectory)

**Important:** If you see the old build command `tsc && vite build` in Netlify, change it to just `npm run build` (which runs `vite build`).

### 2.3 Set Environment Variables

**This is crucial!** You need to add your Supabase credentials:

1. In the build settings, scroll down to **"Environment variables"**
2. Click **"Add variable"** and add:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Your Supabase project URL (from your `.env` file)
3. Click **"Add variable"** again and add:
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon key (from your `.env` file)

### 2.4 Set Node Version (Optional but Recommended)

1. In build settings, scroll to **"Environment"**
2. Set **Node version** to `18` or `20` (Netlify defaults to 18)

### 2.5 Deploy

1. Click **"Deploy site"**
2. Netlify will start building your site
3. You can watch the build logs in real-time
4. Once complete, your site will be live at a URL like: `https://random-name-123.netlify.app`

## Step 3: Configure Custom Domain (Optional)

### 3.1 Add Custom Domain

1. In your site settings, go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow Netlify's instructions to configure DNS

### 3.2 Update Supabase Redirect URLs

If you're using Supabase Auth, you need to add your Netlify URL to allowed redirect URLs:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Netlify URL to **"Redirect URLs"**:
   - `https://your-site.netlify.app`
   - `https://your-site.netlify.app/*`
   - (And your custom domain if you added one)

## Step 4: Verify Deployment

### 4.1 Test Your Site

1. Visit your Netlify URL
2. Test the following:
   - Registration and login
   - Booking a desk
   - Admin functions (if you have admin access)
   - Navigation between pages

### 4.2 Check Browser Console

Open browser DevTools (F12) and check the Console tab for any errors related to:
- Supabase connection
- Environment variables
- API calls

## Step 5: Continuous Deployment

Netlify automatically deploys when you push to your main branch. To configure:

1. Go to **"Site settings"** → **"Build & deploy"**
2. Under **"Continuous Deployment"**, you can:
   - Change the branch that triggers deployments
   - Set up branch deploys for previews
   - Configure build hooks

## Troubleshooting

### Build Fails with Exit Code 2

**Error: "Command failed with exit code 2"**

This usually means:
1. **Wrong build command**: Make sure Netlify is using `npm run build` (not `tsc && vite build`)
   - Go to **Site settings** → **Build & deploy** → **Build settings**
   - Verify the build command is `npm run build`
   - The `netlify.toml` file should handle this automatically

2. **TypeScript errors**: If you see TypeScript errors in the build logs:
   - Check the build logs for specific error messages
   - Run `npm run build` locally to reproduce
   - Fix any TypeScript errors in your code

3. **Missing dependencies**: 
   - Ensure `package.json` has all required dependencies
   - Check that `node_modules` is in `.gitignore` (it should be)

4. **Clear Netlify cache**:
   - Go to **Site settings** → **Build & deploy** → **Build settings**
   - Click **"Clear cache and deploy site"**

### Build Fails: "Command failed"

**Error: "Command failed"**
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Netlify uses Node 18 by default)
- Try clearing the build cache

**Error: "Environment variable not found"**
- Make sure you added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify's environment variables
- Note: Variables must start with `VITE_` to be accessible in Vite builds
- Redeploy after adding environment variables

### Site Works But Can't Connect to Supabase

1. Check that environment variables are set correctly in Netlify
2. Verify your Supabase project is active
3. Check Supabase RLS policies allow public access where needed
4. Verify CORS settings in Supabase (should allow your Netlify domain)

### Routing Issues (404 on Refresh)

The `netlify.toml` file should handle this, but if you still have issues:

1. Verify `netlify.toml` is in your repository root
2. Check that the redirect rule is present
3. In Netlify dashboard: **Site settings** → **Build & deploy** → **Post processing** → Ensure "Asset optimization" doesn't break routing

### Authentication Not Working

1. Add your Netlify URL to Supabase redirect URLs (see Step 3.2)
2. Check that Supabase Auth is enabled
3. Verify RLS policies allow user registration

## Quick Reference: Netlify Settings

```
Build command: npm run build
Publish directory: dist
Node version: 18 (default)
```

**Required Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Alternative: Deploy via Netlify CLI

If you prefer using the command line:

### Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Login to Netlify

```bash
netlify login
```

### Initialize and Deploy

```bash
# In your project directory
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Team: Select your team
# - Site name: (optional, or press enter for auto-generated)
# - Build command: npm run build
# - Directory to deploy: dist
# - Netlify functions folder: (press enter, not needed)

# Set environment variables
netlify env:set VITE_SUPABASE_URL "your_supabase_url"
netlify env:set VITE_SUPABASE_ANON_KEY "your_supabase_anon_key"

# Deploy
netlify deploy --prod
```

## Next Steps

After successful deployment:

1. ✅ Test all features on the live site
2. ✅ Set up a custom domain (optional)
3. ✅ Configure automatic deployments
4. ✅ Set up monitoring and error tracking (optional)
5. ✅ Share your site URL with users!

## Support

If you encounter issues:
- Check Netlify build logs (click on the failed deploy to see detailed logs)
- Review Supabase logs
- Check browser console for client-side errors
- Verify all environment variables are set correctly
- Try clearing Netlify build cache and redeploying
