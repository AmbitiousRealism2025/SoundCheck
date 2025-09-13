# Supabase Migration Guide

This directory contains the migration scripts and documentation for moving SoundCheck from Replit to Supabase.

## Migration Steps

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose a name for your project (e.g., "soundcheck")
4. Choose a database password
5. Select a region closest to your users
6. Click "Create new project"

### 2. Get Your Credentials

Once your project is created:

1. Go to Project Settings > API
2. Copy the **Project URL** and **Service Role Key**
3. Copy the **anon public** key (for client-side use)

### 3. Set Up Environment Variables

Create a `.env` file in your project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Database Migrations

1. Go to the Supabase SQL Editor
2. Run the migrations in order:

   ```sql
   -- Run 001_initial_schema.sql first
   -- Then run 002_rls_policies.sql
   -- Finally run 003_user_profile_trigger.sql
   ```

### 5. Verify Setup

1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`
3. Test authentication by signing up/signing in

## Migration Files

- `001_initial_schema.sql` - Creates all database tables
- `002_rls_policies.sql` - Sets up Row Level Security
- `003_user_profile_trigger.sql` - Auto-creates user profiles

## Important Notes

### Schema Compatibility
- The existing Drizzle schema is fully compatible with Supabase
- UUID generation works the same way
- All existing data models are preserved

### Authentication Changes
- Supabase handles user authentication
- No need for session management in your code
- JWT tokens are used for API authentication

### Security
- Row Level Security ensures users can only access their own data
- All API requests must include the JWT token
- The service role key should never be exposed to clients

## Testing

After migration, test:

1. User registration and login
2. Creating rehearsals and tasks
3. Adding gigs and earnings
4. Calendar functionality
5. Mobile responsiveness

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify your environment variables
2. **Permission Errors**: Check RLS policies
3. **Migration Failures**: Run migrations in order
4. **Auth Issues**: Verify JWT token is being sent correctly

### Getting Help

- Check Supabase documentation: https://supabase.com/docs
- Review the migration files in this directory
- Ensure all environment variables are correctly set