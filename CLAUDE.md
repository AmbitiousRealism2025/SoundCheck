# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SoundCheck is a full-stack web application for musicians to manage rehearsal preparation and gig logistics. It's built with React + TypeScript frontend and Express + TypeScript backend, using PostgreSQL for data storage.

## Development Commands

### Core Development Workflow
```bash
npm run dev        # Start development server with hot reload (NODE_ENV=development)
npm run build      # Build for production (Vite frontend + ESBuild backend)
npm run start      # Start production server
npm run check      # TypeScript type checking
npm run db:push    # Push database schema changes to PostgreSQL
```

### Testing Commands
The project uses Playwright for end-to-end testing. Test scripts should be run from the project root.

## Architecture Overview

### Technology Stack
- **Frontend**: React 18.3.1 + TypeScript, Vite 5.4.19, Wouter routing, TanStack Query
- **Backend**: Express.js 4.21.2 + TypeScript, PostgreSQL with Drizzle ORM
- **UI**: Shadcn/UI components with Tailwind CSS, Framer Motion for animations
- **Auth**: Passport.js with OpenID Connect (Replit OIDC integration)
- **Build**: ESBuild for backend bundling, Vite for frontend

### Key Project Structure
```
client/src/
├── components/     # UI components and views
├── hooks/         # Custom React hooks (useAuth, etc.)
├── lib/           # Utilities and configurations
├── pages/         # Page components (home.tsx is main app)
└── App.tsx        # Main application with routing

server/
├── index.ts       # Express server entry point
├── routes.ts      # All API endpoints with user scoping
├── storage.ts     # Database operations layer
├── replitAuth.ts  # OIDC authentication setup
└── db.ts          # PostgreSQL connection

shared/
└── schema.ts      # TypeScript types and Zod validation schemas
```

## Database Architecture

### Core Schema (shared/schema.ts)
- `users` - User profiles and authentication data
- `sessions` - Session storage for authentication
- `rehearsals` - Rehearsal events with preparation tasks
- `tasks` - Individual rehearsal preparation tasks
- `gigs` - Performance venue and compensation tracking

### Important Patterns
- **User Data Isolation**: All database queries automatically filter by userId
- **Type Safety**: Drizzle ORM provides TypeScript types for all database operations
- **Validation**: Zod schemas validate all data at runtime
- **Migrations**: Use `npm run db:push` to apply schema changes

## Authentication System

### Replit OIDC Integration
- Authentication is handled via Replit's OpenID Connect provider
- Sessions use secure httpOnly cookies
- All API routes require authentication (except /auth/* endpoints)
- User context is available via the `useAuth` hook in React components

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPLIT_DOMAINS` - Allowed domains for authentication
- `ISSUER_URL` - OIDC provider endpoint (defaults to Replit)

## Frontend Patterns

### State Management
- **Server State**: TanStack Query for API data management
- **Local State**: React useState/useReducer for component state
- **Global Auth**: Custom `useAuth` hook provides user context
- **Forms**: React Hook Form with Zod validation

### Component Organization
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`
- Utility functions in `client/src/lib/`

### UI/UX Guidelines
- Mobile-first responsive design
- Shadcn/UI component library for consistency
- Dark/light theme support via next-themes
- Touch-friendly interactions for mobile devices

## API Architecture

### RESTful Endpoints (server/routes.ts)
All endpoints automatically scope data to the authenticated user:
- `/api/rehearsals` - CRUD operations for rehearsals
- `/api/tasks` - Task management for rehearsals
- `/api/gigs` - Gig and earnings tracking
- `/api/earnings` - Earnings analytics and summaries
- `/api/calendar` - Calendar event data

### Response Format
- Success: `{ data: ..., message: "success" }`
- Error: `{ error: "Error message", status: 400 }`

## Development Guidelines

### Code Standards
- **TypeScript First**: Strict TypeScript configuration with no implicit any
- **Component Composition**: Build reusable, testable components
- **Error Boundaries**: Implement proper error handling in React components
- **Type Validation**: Use Zod schemas for all external data validation

### Database Safety
- Never bypass user scoping in database queries
- All database operations must go through the storage layer
- Use prepared statements to prevent SQL injection
- Validate all data with Zod schemas before database operations

### Mobile Development
- Test all features on mobile viewport during development
- Use touch-friendly interaction patterns
- Ensure responsive design works across all screen sizes
- Test calendar and date inputs on mobile devices

## Current Status

### Completed Features (~90%)
- ✅ User authentication with Replit OIDC
- ✅ Rehearsal management with task system
- ✅ Gig tracking and compensation management
- ✅ Earnings analytics dashboard
- ✅ Calendar with iCal export functionality
- ✅ Mobile-responsive design
- ✅ PostgreSQL integration with user isolation

### Known Issues
- Authentication fix applied but needs final verification testing
- Calendar timezone handling recently improved

## 2025‑09‑13 — Supabase Migration Fix (Agent Update)
- Context: An external agent was brought in specifically to resolve a login loop introduced during the migration from Replit OIDC to Supabase.
- Implemented:
  - Client-managed Supabase session (`useAuth` uses `getSession` + `onAuthStateChange`).
  - Bearer token on all API requests (see `client/src/lib/queryClient.ts`).
  - Client-side session establishment after login/signup via `supabase.auth.setSession`.
  - Client route `/auth/callback` to set session from URL fragment.
  - Standardized dev port to `5000` and updated Supabase Site/Redirect URLs.
- Ops Notes: Ensure `.env` contains Supabase URL/keys and `PORT=5000`. In the dashboard, set Site URL `http://localhost:5000` and Redirect `http://localhost:5000/auth/callback`.

## Important Notes

- This is a production-ready application, not a prototype
- All database queries are user-scoped for data security
- No mock or placeholder data should be used in implementation
- The application follows modern full-stack JavaScript patterns
- Mobile optimization is a core requirement, not an afterthought
