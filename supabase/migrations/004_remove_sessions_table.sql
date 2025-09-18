-- Migration: Remove legacy sessions table
-- Date: 2025-09-15
-- Description: Removes the legacy sessions table that was used for Replit OIDC authentication.
--              The application now uses Supabase authentication with JWT tokens instead.

-- Drop the sessions table if it exists
DROP TABLE IF EXISTS sessions CASCADE;

-- Note: This migration removes legacy authentication artifacts from the Replit OIDC implementation.
-- The application now uses Supabase's built-in authentication system which manages sessions
-- through JWT tokens rather than a custom sessions table.