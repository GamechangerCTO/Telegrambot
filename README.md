# Telegram Bot Sport Management System

Complete enterprise-grade platform for managing sports content across multiple Telegram channels.

## Features
- Multi-language content generation (Hebrew, English, Amharic, Swahili)
- Advanced match analysis with real API data
- Automated betting tips and coupons
- Live updates and news integration
- Enterprise automation workflows
- Real-time analytics and monitoring
- **🆕 Vercel Cron Jobs**: Complete automation with 6 specialized cron jobs
- **🆕 All Content Generators**: Integrated betting, news, analysis, polls, summaries, live updates, and smart coupons

## Tech Stack
- Next.js 14 with App Router
- TypeScript
- Supabase (Database + Auth)
- Tailwind CSS
- OpenAI API for content generation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Telegram Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Idosegev23/telegrambotsport.git
   cd telegrambotsport
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Vercel Cron Jobs System

### **Complete Automation Configuration:**

```json
{
  "crons": [
    {"path": "/api/automation/cron/minute", "schedule": "* * * * *"},
    {"path": "/api/automation/cron/hourly", "schedule": "0 * * * *"},
    {"path": "/api/automation/cron/daily", "schedule": "0 9,18,23 * * *"},
    {"path": "/api/automation/cron/live-updates", "schedule": "*/3 6-23 * * *"},
    {"path": "/api/automation/cron/smart-push", "schedule": "0 15,19 * * *"},
    {"path": "/api/automation/cron/urgent", "schedule": "*/2 * * * *"}
  ]
}
```

### **🎯 Content Generator Integration:**

**⏰ Every Minute**: System health, live monitoring  
**🕐 Every Hour (8 AM - 10 PM)**:  
- 🎯 **BettingTipsGenerator** - Smart betting analysis
- 📰 **OptimizedNewsContentGenerator** - Latest sports news (every 2 hours)
- ⚽ **MatchAnalysisGenerator** - Detailed match analysis (peak hours)

**📅 Daily Schedule**:  
- 📊 **DailyWeeklySummaryGenerator** (9 AM, 6 PM, 11 PM)
- 📊 **PollsGenerator** - Interactive polls (3 PM daily)

**🔴 Live Updates** (Every 3 minutes, 6 AM - 11 PM):  
- **LiveUpdatesGenerator** with quality filtering (15+ points threshold)

**💰 Smart Push** (Peak hours: 3 PM, 7 PM):  
- **SmartPushEngine** - Automated revenue triggers
- 🎫 **SmartCouponsGenerator** - Contextual coupon placement

**🚨 Urgent Tasks** (Every 2 minutes):  
- Emergency monitoring and system health checks

### Default Login
- **Email**: `triroars@gmail.com`
- **Password**: `admin123456`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Production Ready
This system is production-ready with comprehensive APIs, automation, and business intelligence features.
