# 🎨 זרימת יצירת תוכן - Content Generation Flow

## 🎯 תיאור כללי
זרימה מפורטת של יצירת 8 סוגי תוכן שונים במערכת, כולל בחירת משחקים, יצירת תוכן, ושליחה לערוצים.

## 🔄 זרימת יצירת תוכן מלאה

```mermaid
sequenceDiagram
    participant U as User/Automation
    participant API as unified-content
    participant MS as Match Scorer
    participant FS as Football Service
    participant CG as Content Generators
    participant AI as AI Engine
    participant IMG as Image Generator
    participant DB as Database
    participant TS as Telegram Sender
    participant RS as Revenue System
    
    U->>API: POST /api/unified-content
    Note over U,API: type: news/betting/analysis/live/poll/coupon/summary
    
    API->>MS: getBestMatchesForContentType()
    MS->>FS: getMatchesFromAPIs()
    FS-->>MS: raw matches data
    MS-->>API: scored & ranked matches
    
    API->>CG: generate content (top matches)
    
    alt News Content
        CG->>CG: RSS News Fetcher
        CG->>AI: translate & enhance
        CG->>IMG: generate news image
    else Betting Tips
        CG->>FS: get team statistics
        CG->>CG: calculate probabilities
        CG->>AI: create betting content
        CG->>IMG: generate betting image
    else Match Analysis
        CG->>FS: get H2H data
        CG->>FS: get team analysis
        CG->>AI: create analysis content
        CG->>IMG: generate analysis image
    else Live Updates
        CG->>FS: get live match data
        CG->>AI: create live content
        CG->>IMG: generate live image
    else Polls
        CG->>AI: create poll question
        CG->>IMG: generate poll image
    else Coupons
        CG->>DB: get active coupons
        CG->>AI: personalize coupon
        CG->>IMG: generate coupon image
    else Daily Summary
        CG->>FS: get day's matches
        CG->>AI: create summary
        CG->>IMG: generate summary image
    else Weekly Summary
        CG->>FS: get week's matches
        CG->>AI: create weekly recap
        CG->>IMG: generate weekly image
    end
    
    CG-->>API: final content + image
    
    API->>DB: save content metadata
    API->>TS: distribute to channels
    
    TS->>DB: get channel details
    TS->>DB: get bot tokens
    TS->>TS: send to Telegram
    TS-->>API: delivery results
    
    API->>RS: trigger coupon system
    RS->>DB: check trigger probability
    RS->>CG: generate coupon if needed
    RS->>TS: send coupon to channels
    
    API-->>U: success response
```

## 🎨 סוגי תוכן ומפרטים

### 1. 📰 **News Content**
- **מקור**: RSS Feeds (BBC, Guardian, ESPN, Sky Sports)
- **תדירות**: כל 2 שעות
- **עיבוד**: 
  - משיכת RSS feeds
  - ניקוד חדשות לפי רלוונטיות
  - תרגום לשפת הערוץ
  - יצירת תמונה מותאמת

### 2. ⚽ **Betting Tips**
- **מקור**: Football APIs + Statistical Analysis
- **תדירות**: 2-3 שעות לפני משחק
- **עיבוד**:
  - ניתוח סטטיסטי של הקבוצות
  - חישוב הסתברויות
  - יצירת תחזיות אחראיות
  - הוספת disclaimers

### 3. 🔍 **Match Analysis**
- **מקור**: H2H Data + Team Statistics
- **תדירות**: 30-60 דקות לפני משחק
- **עיבוד**:
  - ניתוח התמודדויות קודמות
  - ניתוח טקטי
  - מפתח battles
  - תחזיות מבוססות נתונים

### 4. 📊 **Live Updates**
- **מקור**: Real-time Football APIs
- **תדירות**: כל 2-5 דקות במהלך משחק
- **עיבוד**:
  - זיהוי אירועים חדשים
  - יצירת תוכן דינמי
  - מניעת כפילויות
  - עדכונים בזמן אמת

### 5. 🗳️ **Polls**
- **מקור**: AI Generation
- **תדירות**: לפני משחקים חשובים
- **עיבוד**:
  - יצירת שאלות אטרקטיביות
  - אפשרויות תשובה מגוונות
  - התאמה לשפת הערוץ
  - אינטגרציה עם Telegram Polls

### 6. 💰 **Coupons**
- **מקור**: Database + Context-aware selection
- **תדירות**: אוטומטית לאחר תוכן
- **עיבוד**:
  - בחירת קופונים מותאמים
  - התאמה לשפת הערוץ
  - מיקום אופטימלי
  - מעקב ביצועים

### 7. 📝 **Daily Summary**
- **מקור**: Day's matches + Results
- **תדירות**: 21:00 יומית
- **עיבוד**:
  - איסוף תוצאות היום
  - זיהוי הייליטס
  - יצירת סיכום מקיף
  - הוספת תמונות

### 8. 📋 **Weekly Summary**
- **מקור**: Week's matches + Trends
- **תדירות**: ראשון בשבוע 20:00
- **עיבוד**:
  - ניתוח מגמות שבועיות
  - סיכום התפתחויות
  - תחזיות לשבוע הבא
  - יצירת תוכן אסטרטגי

## 🧠 תהליך בחירת משחקים

```mermaid
graph TD
    A["`🏆 Match Scorer<br/>Intelligent Ranking`"] --> B["`📊 Competition Priority<br/>Premier League: 10<br/>Champions League: 10<br/>Serie A: 9`"]
    
    B --> C["`⭐ Team Popularity<br/>Real Madrid: 10<br/>Barcelona: 9<br/>Man City: 8`"]
    
    C --> D["`⏰ Timing Score<br/>Next 24h: +5<br/>Next 48h: +3<br/>Next 72h: +1`"]
    
    D --> E["`🎯 Content Suitability<br/>Betting: Stats available<br/>Analysis: H2H data<br/>Live: Real-time feeds`"]
    
    E --> F["`🔢 Final Score<br/>Competition + Team + Timing + Suitability`"]
    
    F --> G["`📋 Top 5 Matches<br/>Per content type`"]
    
    style A fill:#ff6b6b,stroke:#fff,stroke-width:2px,color:#fff
    style F fill:#51cf66,stroke:#fff,stroke-width:2px,color:#fff
    style G fill:#339af0,stroke:#fff,stroke-width:2px,color:#fff
```

## 🌍 תמיכה רב-לשונית

### שפות נתמכות:
- **עברית (he)**: ממשק ראשי
- **אמהרית (am)**: ערוצים אפריקאיים
- **סווהילי (sw)**: ערוצים אפריקאיים
- **אנגלית (en)**: ערוצים בינלאומיים

### תהליך תרגום:
1. **זיהוי שפת הערוץ**: אוטומטי מהגדרות הערוץ
2. **יצירת תוכן**: בשפת המקור (אנגלית)
3. **תרגום AI**: התאמה לשפת היעד
4. **בדיקת איכות**: אפס זיהום שפות
5. **שליחה**: תוכן טבעי בשפת הערוץ

## 🎨 יצירת תמונות

### מנוע התמונות:
- **GPT-Image-1**: יצירת תמונות מותאמות
- **DALL-E 3**: Fallback למקרי כישלון
- **Supabase Storage**: אחסון ושיתוף

### סוגי תמונות:
- **News**: תמונות עיתונאיות
- **Betting**: גרפיקה סטטיסטית
- **Analysis**: דיאגרמות טקטיות
- **Live**: תמונות אירועים
- **Polls**: גרפיקה אינטראקטיבית

## 📊 מעקב ביצועים

### מטריקות תוכן:
- **זמן יצירה**: ממוצע 30 שניות
- **איכות שפה**: 100% טוהר לשוני
- **שיעור הצלחה**: 95% משלוחים מוצלחים
- **אינטראקציה**: מעקב אחר clicks ו-engagement

### אופטימיזציה:
- **Cache**: תוכן שמור למהירות
- **Parallel Processing**: עיבוד מקבילי
- **Smart Fallbacks**: חלופות בכישלון
- **Quality Checks**: בדיקות איכות אוטומטיות

## 🔧 טיפול בשגיאות

### שגיאות נפוצות:
- **API Timeout**: מעבר לAPI חלופי
- **Content Empty**: יצירת תוכן fallback
- **Translation Error**: שימוש בתרגום בסיסי
- **Image Generation Fail**: שימוש בתמונת ברירת מחדל

### מנגנון החלמה:
1. **זיהוי שגיאה**: לוגים מפורטים
2. **נסיון חוזר**: עד 3 נסיונות
3. **Fallback**: מעבר לחלופה
4. **התראה**: עדכון למנהלים
5. **תיעוד**: שמירה לטיפול עתידי

## 🎯 הערות חשובות

- **כל התוכן עובר בדיקת איכות** לפני שליחה
- **מערכת הכנסות משולבת** בכל סוגי התוכן
- **תמיכה מלאה ברב-לשוניות** ללא זיהום
- **אופטימיזציה מתמשכת** בהתאם לביצועים
- **גמישות מלאה** להוספת סוגי תוכן חדשים 