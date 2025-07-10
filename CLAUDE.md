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

## 🤖 Automation Engine Issues & Fixes

### Issue: All Automation Rules Skipped in Production
**Problem:** All automation rules showing "conditions not met" in Vercel production

**Root Causes:**
1. **Incomplete Production Logic** - Event-driven and context-aware rules had TODOs returning `null`
2. **Narrow Time Windows** - 15-minute scheduling windows too restrictive
3. **Missing Environment Handling** - Production logic was placeholder code
4. **Automation Settings** - Full automation might be disabled
5. **Wrong API URL** - Automation was calling `localhost:3001` instead of proper Vercel URLs

**Fixes Applied:**
1. **Event-Driven Rules**: Added active hours logic (6 AM - 11 PM)
2. **Context-Aware Rules**: Added periodic triggers every 2 hours (8 AM - 8 PM)
3. **Scheduled Rules**: Expanded time windows to 60 minutes in production
4. **Settings Check**: Made automation settings more robust with fallback to enabled
5. **Environment Detection**: Improved production vs development logic
6. **API URL Fix**: Fixed automation to use `process.env.VERCEL_URL` for production calls

**Files Updated:** 
- `/src/app/api/automation/auto-scheduler/route.ts` - Fixed API URL logic
- `/src/app/automation/page.tsx` - Improved fixtures display without unified-content dependency

### Latest Fixes (2025-01-10):

#### 1. API URL Resolution
**Problem:** Automation calling wrong localhost:3001 URL in production
**Solution:** Updated to use `process.env.VERCEL_URL` with fallback to correct local URLs
```typescript
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
```

#### 2. API Football POST Method 405 Error
**Problem:** `getFixturesForDate is not a function` - wrong function name and missing POST support
**Solution:** Fixed function name and implemented proper POST endpoint
- Changed `getFixturesForDate` → `getFixturesByDate`
- Added full POST implementation for `get_fixtures_date_range` action

#### 3. Database Schema Issue
**Problem:** `column managers.organization_id does not exist`
**Solution:** Removed non-existent column from queries
- Updated AuthContext to only select existing columns
- Fixed Manager interface to match actual database schema

### Automation Rule Types:
- **Scheduled**: Time-based triggers with 60-minute windows
- **Event-Driven**: Active hours-based triggers (6 AM - 11 PM)
- **Context-Aware**: Periodic triggers every 2 hours (8 AM - 8 PM)

## ⚽ Automation Frontend Enhancements

### Current Time Display
**Location:** `/automation` page header
**Features:**
- Real-time clock (HH:MM:SS format)
- Current date with day of week
- Updates every second
- Shows "Automation Time" used by engine

### Fixture Timetable with Match Scorer
**Location:** `/automation` page - between System Status and Quick Actions
**Features:**
- **Smart Match Scoring**: Uses built-in scoring algorithm (simplified from FootballMatchScorer)
- **Live Score Integration**: Real-time scores and match status via API-Football
- **Relevance Scoring**: 0-100% content suitability scores
- **Visual Status Indicators**:
  - 🟢 Green: Live matches (with pulsing LIVE badge)
  - 🔵 Blue: Finished matches
  - ⚪ Gray: Scheduled matches
- **Smart Sorting**: Matches sorted by relevance score (highest first)
- **Auto-Refresh**: Live matches auto-refresh every 2 minutes
- **Fallback System**: Uses debug endpoint if main API fails
- **Responsive Design**: 2 columns on desktop, 1 on mobile

### Match Data Integration
- **Primary API**: `/api/api-football-showcase` with API-Football v3 (direct call)
- **Endpoint**: `get_fixtures_date_range` for 7-day fixture range
- **Fallback API**: `/api/debug-football` for basic fixture data
- **Score Display**: Real-time home-away scores with match time elapsed
- **Match Status**: Live status from API-Football (LIVE, 1H, 2H, FT, etc.)
- **League Information**: Official competition names and kick-off times
- **Scoring**: Built-in relevance scoring without external dependencies

### Intelligence Scoring System
- **Base Score**: 30% for all matches
- **League Bonuses**:
  - Champions League: +50%
  - Premier League/Primera División: +40%
  - Serie A/Bundesliga/Ligue 1: +35%
  - Europa League: +30%
  - Championship/Segunda: +20%
- **Team Popularity**: +20% for popular teams (Real Madrid, Barcelona, Man United, etc.)
- **Score Cap**: Maximum 100% relevance

## 🔍 Debugging Tips
- Check console for AuthContext state logs
- Monitor network requests to Supabase
- Verify environment variables are loaded
- Test database queries independently if needed
- Check automation logs for rule processing details
- Verify `automation_settings` table has `full_automation_enabled = true`

---
*Last Updated: 2025-01-10*  
*System Status: Operational*  
*Known Issues: None*
*Latest Fixes: Automation API URL resolution for Vercel production*