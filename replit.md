# Overview

SoundCheck is a mobile-first web application designed specifically for gigging musicians to manage their rehearsals and gig logistics. The app addresses the core problem of musicians lacking a dedicated tool to organize rehearsal preparation and handle gig-related tasks. Built as a full-stack TypeScript application, it features a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration via Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React and TypeScript, utilizing a component-based architecture with shadcn/ui for consistent design. The frontend follows a mobile-first approach using Tailwind CSS for responsive styling. React Query (TanStack Query) manages server state and caching, while Wouter handles client-side routing. The app implements a tab-based interface separating rehearsals and gigs functionality, with floating action buttons for creating new items.

## Backend Architecture
The server uses Express.js with TypeScript, implementing RESTful API endpoints for rehearsals, tasks, and gigs. The architecture includes an abstraction layer with storage interfaces, currently implemented with in-memory storage but designed to easily switch to database persistence. Route handlers use Zod schemas for request validation, ensuring type safety throughout the application.

## Data Storage Solutions
The application uses Drizzle ORM configured for PostgreSQL with three main entities: rehearsals, tasks, and gigs. The database schema supports hierarchical relationships where tasks belong to rehearsals. The current implementation includes both in-memory storage for development and PostgreSQL configuration for production deployment. Client-side persistence utilizes localStorage for user preferences like onboarding completion status.

## Authentication and Authorization
Currently, the application does not implement authentication mechanisms, operating as a single-user application with data stored per device/browser session.

## Build and Development Tools
The project uses Vite for frontend bundling and development server, with esbuild for backend compilation. The development setup includes TypeScript compilation, Hot Module Replacement (HMR), and specialized Replit plugins for enhanced development experience. The build process creates optimized bundles for both client and server code.

# External Dependencies

## Database and ORM
- **PostgreSQL**: Primary database for production data persistence
- **Neon Database**: Serverless PostgreSQL provider via @neondatabase/serverless
- **Drizzle ORM**: Type-safe ORM for database operations and schema management
- **Drizzle Kit**: CLI tool for database migrations and schema management

## UI and Styling
- **Radix UI**: Comprehensive component library providing accessible primitives for dialogs, forms, navigation, and interactive elements
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Pre-built component system built on Radix UI and Tailwind
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for managing component variants

## State Management and Data Fetching
- **TanStack React Query**: Server state management with caching, background updates, and optimistic updates
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for both client and server-side data validation

## Development and Build Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire application
- **Replit Plugins**: Development environment enhancements including error overlays, cartographer, and dev banners

## Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class management
- **nanoid**: Unique ID generation for client-side operations