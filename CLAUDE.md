# 🤖 Claude Memory Bank - Telegram Bot Management System

## 📋 System Overview
**Project Name:** Telegram Bot Management System (TeleBots Pro)  
**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase  
**Purpose:** AI-powered Telegram bot management platform for sports content with multilingual support

## 🏗️ Architecture & Key Components

### Authentication System
- **Location:** `src/contexts/AuthContext.tsx`
- **Database:** Supabase Auth + custom `managers` table
- **Key Features:**
  - Role-based authentication (super_admin, manager, bot_manager)
  - Database-driven user management with fallback to auth metadata
  - Timeout protection (5s for session, 10s for database queries)
  - Auto-creation of manager records for existing users

### Database Schema
- **Main Tables:**
  - `managers`: User profiles with roles and preferences
  - `bots`: Telegram bot configurations
  - `channels`: Channel management and settings
  - Content tables for various types (betting, news, etc.)

### Core Services
- **Football APIs:** Unified service supporting multiple providers
- **Content Generation:** AI-powered content creation
- **Automation Engine:** Scheduled content delivery
- **Multi-language Support:** English, Amharic, Swahili

## 🔧 Configuration

### Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://ythsmnqclosoxiccchhh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_FOOTBALL_KEY=05012c9af5f5cadf389803f9da84b38d
OPENAI_API_KEY=sk-proj-iaIb3IcieSxnHLoh...
CLAUDE_API_KEY=sk-ant-api03-LQCU83Nhmcx...
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linting (disabled in config)
npm run typecheck    # TypeScript checking (disabled in config)
```

## 🐛 Common Issues & Solutions

### 1. Grey Screen Issue (RESOLVED)
**Problem:** AuthContext gets stuck in loading state  
**Root Cause:** Database queries hanging without timeout  
**Solution:** Added timeout protection in AuthContext
- Session timeout: 5 seconds
- Database query timeout: 10 seconds
- Graceful fallback to prevent infinite loading

### 2. Middleware Authentication
**Location:** `middleware.ts`
**Function:** Route protection and role-based access control
**Routes:**
- Public: `/`, `/auth/*`
- Protected: `/dashboard/*`, `/super-admin/*`
- API: Role-based access control

### 3. Database Connection
**Status:** Working correctly
**Test:** Connection successful via Node.js test script

## 📁 Key File Locations

### Core Files
- **Root Layout:** `src/app/layout.tsx` - Main app wrapper with providers
- **Home Page:** `src/app/page.tsx` - Landing page with role selection
- **Auth Context:** `src/contexts/AuthContext.tsx` - Authentication management
- **Supabase Config:** `src/lib/supabase.ts` - Database client setup
- **Middleware:** `middleware.ts` - Route protection

### Component Structure
- **Layout Components:** `src/components/layout/`
- **Dashboard:** `src/app/dashboard/` - Main application interface
- **Authentication:** `src/app/auth/` - Login/register pages
- **Content Management:** Various content-specific pages

## 🎯 User Roles & Permissions

### Super Admin
- Full system access
- Organization management
- User control and monitoring

### Manager
- Organization-level bot management
- Channel administration
- Content orchestration

### Bot Manager
- Content creation and publishing
- Basic analytics
- Channel-specific management

## 🔄 Development Workflow

### Recent Fixes Applied
1. **AuthContext Timeout Protection** - Prevents infinite loading
2. **Database Query Timeouts** - Handles slow connections
3. **Error Handling** - Graceful degradation for auth failures

### Testing Strategy
- Manual testing via browser at `http://localhost:3000`
- Supabase connection verified independently
- Build process validates all routes

## 📊 Performance Considerations
- Static generation for public pages
- Server-side rendering for protected routes
- Database connection pooling via Supabase
- Timeout mechanisms prevent hanging states

## 🔍 Debugging Tips
- Check console for AuthContext state logs
- Monitor network requests to Supabase
- Verify environment variables are loaded
- Test database queries independently if needed

---
*Last Updated: 2025-01-09*  
*System Status: Operational*  
*Known Issues: None*