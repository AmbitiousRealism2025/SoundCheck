import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');

  throw new Error(
    `Missing required Supabase environment variables: ${missing.join(', ')}. ` +
    'Please ensure these are set in your .env file or environment configuration.'
  );
}

// Admin client for administrative operations only (bypasses RLS)
export const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

// Legacy export for backward compatibility - will be removed after migration
export const supabase = adminSupabase

// Create a per-user Supabase client that respects RLS policies
export function createUserSupabaseClient(url: string, anonKey: string, jwt: string) {
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
  })
}