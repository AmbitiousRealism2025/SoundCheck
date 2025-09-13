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
- **🔐 User Authentication**: Replit OIDC integration with session management
- **💾 Database Integration**: PostgreSQL with user-scoped data isolation
- **🎨 Professional UI**: Modern design with dark/light theme support
- **📱 Mobile Responsive**: Touch-friendly interface optimized for mobile devices

### 🔧 **Recently Fixed**
- **Critical Authentication Bug**: Resolved "redirect_uri is required" error that was blocking all user access
- **Calendar Timezone Issues**: Fixed edit form prefill, day highlighting, and iCal export timezone handling
- **Navigation Integration**: Seamless tab switching between Rehearsals, Gigs, Earnings, and Calendar

### ⚠️ **Known Issues**
- Authentication needs final verification testing (fix applied but not tested due to credit constraints)

## 🏗️ **Technical Architecture**

### **Frontend**
- **React + TypeScript** with Vite for fast development
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **Shadcn/UI + Tailwind CSS** for modern, consistent styling
- **Responsive Design** with mobile-first approach

### **Backend**
- **Express.js** server with TypeScript
- **PostgreSQL** database with Drizzle ORM
- **Passport.js** with OpenID Connect for authentication
- **Session management** with secure httpOnly cookies

### **Key Files**
- `shared/schema.ts` - Type-safe data models and validation schemas
- `server/routes.ts` - RESTful API endpoints with user scoping
- `server/storage.ts` - Database abstraction layer
- `server/replitAuth.ts` - Authentication configuration
- `client/src/pages/home.tsx` - Main application interface
- `client/src/components/calendar-view.tsx` - Calendar integration
- `client/src/components/earnings-tracker.tsx` - Earnings dashboard

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js environment (configured via Replit)
- PostgreSQL database (available via Replit)

### **Running the Application**
```bash
npm run dev
```
The application will be available at `http://localhost:5000`

### **Environment Variables**
Required environment variables (managed by Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPLIT_DOMAINS` - Allowed domains for authentication
- `ISSUER_URL` - OIDC provider endpoint (optional, defaults to Replit OIDC)

## 🎯 **What's Next**

### **Immediate Priorities**
1. **🔍 Verify Authentication Fix**: Test the callbackURL fix to ensure users can successfully log in
2. **📋 Final Quality Assurance**: End-to-end testing of all major user flows
3. **🚀 Production Deployment**: Prepare for live deployment once authentication is verified

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
- Session management uses secure httpOnly cookies
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