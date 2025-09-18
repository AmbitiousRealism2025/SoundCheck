# SoundCheck 🎵

**Your complete gig assistant for rehearsal prep and show management**

SoundCheck is a comprehensive web-based application designed specifically for gigging musicians to manage their rehearsal preparation and gig logistics with professional tools and mobile-first design.

## 🎯 Project Overview

SoundCheck helps musicians stay organized with:
- **Rehearsal Planning**: Task management and preparation notes
- **Gig Management**: Venue details, compensation tracking, and show logistics  
- **Earnings Analytics**: Comprehensive income tracking with monthly/yearly summaries
- **Calendar Integration**: Visual scheduling with iCal export capabilities
- **Mobile-Optimized**: Responsive design for musicians on the go

## 🚀 Current Status

### Authentication System

**Supabase-Based Authentication**:
- Email/password authentication with secure JWT tokens
- Client-managed sessions using Supabase Auth SDK
- Bearer token authorization for API requests
- Row Level Security (RLS) for automatic user data isolation
- Email confirmation flow with `/auth/callback` handling

**Quick Setup**:
1. Configure `.env` with Supabase credentials (see Environment Variables below)
2. In Supabase dashboard:
   - Set Site URL: `http://localhost:5000`
   - Set Redirect URL: `http://localhost:5000/auth/callback`
3. Run `npm run dev` and navigate to `/login`

### ✅ **Completed Features**
- **🎵 Rehearsal Management**: Complete task management system with add/edit/delete functionality
- **🎤 Gig Management**: Venue tracking, compensation management, and detailed gig information
- **💰 Earnings Tracker**: Real-time earnings dashboard with totals, averages, and time-period summaries
- **📅 Calendar Integration**: 
  - Visual monthly calendar with date highlighting
  - Timezone-safe date handling across all components
  - Professional iCal export functionality
  - Quick date-aware event creation
  - Daily event overview system
- **🔐 User Authentication**: Supabase authentication with email/password and OAuth support
- **💾 Database Integration**: PostgreSQL with user-scoped data isolation
- **🎨 Professional UI**: Modern design with dark/light theme support
- **📱 Mobile Responsive**: Touch-friendly interface optimized for mobile devices

### 🔧 **Recently Fixed**
- **Critical Authentication Bug**: Resolved "redirect_uri is required" error that was blocking all user access
- **Calendar Timezone Issues**: Fixed edit form prefill, day highlighting, and iCal export timezone handling
- **Navigation Integration**: Seamless tab switching between Rehearsals, Gigs, Earnings, and Calendar

### ⚠️ **Known Issues**
- **Authentication**: Email confirmation flow requires proper Supabase dashboard configuration
  - Ensure Site URL and Redirect URLs are configured correctly in Supabase dashboard
  - Development environment auto-confirms emails for smoother local testing

### 🧪 **Testing Status**
- **Comprehensive Test Suite**: 90+ Playwright tests covering all features
- **Test Coverage**: Authentication, CRUD operations, navigation, mobile responsiveness, calendar, earnings
- **Mobile Testing**: iPhone 12, Pixel 5, iPad viewports with touch interaction testing
- **Test Execution**: Run with `npm test`
- **Test Authentication**: Tests include Supabase session seeding for reliable auth testing
- **Test Documentation**: Complete test suite documentation in `tests/README.md`

## 🏗️ **Technical Architecture**

### **Frontend**
- **React + TypeScript** with Vite for fast development
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **Shadcn/UI + Tailwind CSS** for modern, consistent styling
- **Responsive Design** with mobile-first approach

### **Backend**
- **Express.js** server with TypeScript
- **Supabase** for database and authentication
- **JWT-based authentication** with Bearer token authorization
- **Row Level Security (RLS)** for automatic user data isolation

### **Key Files**
- `shared/schema.ts` - Type-safe data models and validation schemas
- `server/routes.ts` - RESTful API endpoints with user scoping
- `server/storage.ts` - Database abstraction layer
- `server/supabaseAuth.ts` - Authentication configuration
- `client/src/pages/home.tsx` - Main application interface
- `client/src/components/calendar-view.tsx` - Calendar integration
- `client/src/components/earnings-tracker.tsx` - Earnings dashboard

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js environment
- Supabase project with configured authentication

### **Running the Application**
```bash
npm run dev
```
The application will be available at `http://localhost:5000`

### **Environment Variables**
Copy `.env.example` to `.env` and configure:
- `PORT=5000` - Server port
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_ANON_KEY` - Anonymous key for client operations
- `VITE_SUPABASE_URL` - Same as SUPABASE_URL (for frontend)
- `VITE_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY (for frontend)

### **Running Tests**
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npm test

# Run tests with UI mode
npm run test:ui

# Run mobile-specific tests
npm run test:mobile

# View test report
npm run test:report
```

**Note**: Tests use mocked API responses and seeded Supabase sessions for consistent testing

### **Supabase Configuration**
1. Create a new Supabase project at https://supabase.com
2. Configure authentication settings:
   - Enable Email/Password authentication
   - Set Site URL: `http://localhost:5000` (or your production domain)
   - Set Redirect URL: `http://localhost:5000/auth/callback` (for client-side session establishment)
3. Run database migrations:
   - Apply migrations from `supabase/migrations/` directory
   - Or use `npm run db:push` for schema updates

## 🎯 **What's Next**

### **Immediate Priorities**
1. **✅ Authentication Verification**: callbackURL fix analyzed and verified - system is ready for testing
2. **📋 Final Quality Assurance**: End-to-end testing of all major user flows
3. **🚀 Production Deployment**: Deploy to Replit environment with proper configuration

### **Future Enhancements**
1. **📊 Advanced Analytics**: 
   - Revenue trends and forecasting
   - Performance metrics per venue
   - Monthly/yearly earning comparisons

2. **🔄 Enhanced Calendar Features**:
   - External calendar sync (Google Calendar, iCal import)
   - Recurring event templates
   - Travel time calculations

3. **👥 Collaboration Features**:
   - Band/group management
   - Shared rehearsal schedules
   - Split payment tracking

4. **📱 Progressive Web App**:
   - Offline functionality
   - Push notifications for upcoming gigs
   - Home screen installation

5. **🎵 Music-Specific Tools**:
   - Setlist management
   - Song arrangement notes
   - Equipment checklists

## 🛠️ **Development Guidelines**

### **Data Safety**
- All database queries are user-scoped for data isolation
- Sessions are managed by the Supabase client; API requests include `Authorization: Bearer <JWT>`; no httpOnly cookies are used
- No mock or placeholder data in production paths

### **Code Standards**
- TypeScript for type safety
- Zod schemas for runtime validation
- Consistent error handling
- Mobile-first responsive design

### **Testing**
- Playwright for end-to-end testing
- Component-level testing for critical flows
- Authentication and data persistence verification

## 📈 **Progress Metrics**

**Overall Completion**: ~90% of core functionality complete
- **Backend API**: ✅ Complete with user authentication and data persistence
- **Frontend UI**: ✅ Complete with responsive design and intuitive navigation  
- **Calendar System**: ✅ Production-ready with timezone handling and iCal export
- **Earnings Tracking**: ✅ Comprehensive dashboard with analytics
- **Authentication**: 🔧 Fixed but needs verification testing
- **Mobile Optimization**: ✅ Touch-friendly responsive design

## 🤝 **Contributing**

The application follows modern full-stack JavaScript patterns with:
- Minimal file structure (components consolidated where logical)
- Frontend-heavy architecture (backend for data persistence only)
- Consistent TypeScript typing throughout
- Mobile-first responsive design principles

---

**SoundCheck** - Built for musicians, by musicians. Helping you stay organized so you can focus on the music. 🎵
