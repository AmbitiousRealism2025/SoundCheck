# Phase 3: Supabase Setup and Configuration

## Overview
Phase 3 guides you through setting up your Supabase project and configuring the environment for local development.

## Prerequisites
- Active Supabase account (free tier available)
- SoundCheck codebase with Phase 1 & 2 complete

## Step 1: Create Supabase Project

### 1.1 Sign in to Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in with your account or create a new one

### 1.2 Create New Project
1. Click **"New Project"** button
2. Fill in project details:
   - **Name**: `soundcheck` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
3. Click **"Create new project"**

### 1.3 Wait for Provisioning
- Supabase will take 1-2 minutes to provision your project
- You'll see a progress indicator

## Step 2: Get Your Credentials

### 2.1 Project URL and Keys
Once your project is ready:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **service_role** key: Starts with `eyJ...`
   - **anon** **public** key: Starts with `eyJ...`

### 2.3 Security Note
- **NEVER** expose the service_role key in client-side code
- **ONLY** use the anon key for client-side operations
- Service role key bypasses RLS policies - use with caution

## Step 3: Configure Environment Variables

### 3.1 Create .env File
In your project root, create or update `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Development
NODE_ENV=development
PORT=5000
```

### 3.2 Replace Placeholders
- `your-project-id`: From your Supabase project URL
- `your-service-role-key-here`: Service role key from API settings
- `your-anon-key-here`: Anon public key from API settings

## Step 4: Run Database Migrations

### 4.1 Access SQL Editor
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**

### 4.2 Execute Migrations in Order

#### Migration 1: Initial Schema
```sql
-- Copy contents from supabase/migrations/001_initial_schema.sql
```

#### Migration 2: RLS Policies
```sql
-- Copy contents from supabase/migrations/002_rls_policies.sql
```

#### Migration 3: User Profile Trigger
```sql
-- Copy contents from supabase/migrations/003_user_profile_trigger.sql
```

### 4.3 Verify Tables
After running migrations, you should see these tables:
- `users` (with auth.users relationship)
- `rehearsals`
- `tasks`
- `gigs`

## Step 5: Test the Setup

### 5.1 Install Dependencies
```bash
npm install
```

### 5.2 Start Development Server
```bash
npm run dev
```

### 5.3 Verify Connection
- Check console for successful connection messages
- No database connection errors should appear

## Step 6: Test Authentication Flow

### 6.1 Access the Application
- Open `http://localhost:5000` in your browser
- You should see the authentication page

### 6.2 Test User Registration
1. Click sign up
2. Enter email and password
3. Check email for verification link (if enabled)
4. Verify user is created in Supabase Auth → Users

### 6.3 Test User Login
1. Log in with your credentials
2. Verify session is established
3. Check that user profile is created in the users table

## Troubleshooting

### Common Issues

#### Connection Errors
```bash
Error: connect ECONNREFUSED
```
- Verify SUPABASE_URL is correct
- Check network connectivity
- Ensure project is active in Supabase

#### Authentication Errors
```bash
Error: Invalid API key
```
- Verify keys are correctly copied
- Check service_role vs anon key usage
- Ensure no extra spaces in keys

#### Migration Failures
- Run migrations in the correct order
- Check for syntax errors in SQL
- Verify table names match schema

#### RLS Policy Errors
- Ensure RLS policies are enabled
- Check policy conditions match your schema
- Verify user authentication is working

### Getting Help

1. **Supabase Documentation**: https://supabase.com/docs
2. **Check Error Messages**: Read console output carefully
3. **Review Migration Files**: Compare with provided scripts
4. **Environment Variables**: Double-check all values

## Next Steps

### Phase 4: Testing and Validation
- Run comprehensive tests
- Verify all features work with Supabase
- Test mobile compatibility
- Performance testing
- Security validation

## Success Criteria

You'll know Phase 3 is complete when:
- ✅ Supabase project is created and accessible
- ✅ Environment variables are configured
- ✅ Database migrations run successfully
- ✅ Application starts without errors
- ✅ User authentication works end-to-end
- ✅ Data can be created and retrieved

## Progress Tracking

- [ ] Create Supabase project
- [ ] Copy credentials to .env
- [ ] Run initial schema migration
- [ ] Run RLS policies migration
- [ ] Run user profile trigger migration
- [ ] Test application startup
- [ ] Test user registration
- [ ] Test user login and data access

---
*Phase 3 Guide Ready - Follow these steps to configure your Supabase instance*