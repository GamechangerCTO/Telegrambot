# Match Selection Logic - תיעוד לוגיקת בחירת המשחקים ⚽

## מטרת המסמך
תיעוד מפורט של המערכת החכמה לבחירת משחקים במערכת הטלגרם בוט ספורט, כולל דיאגרמות מפורטות ולוגיקת הניקוד החכמה.

## 🎯 מבט כללי על המערכת

המערכת כוללת 3 רכיבים עיקריים:
1. **UnifiedFootballService** - שירות מאוחד לשליפת נתוני כדורגל
2. **FootballMatchScorer** - מערכת ניקוד חכמה לקביעת רלוונטיות המשחקים
3. **SmartContentGenerator** - יצירת תוכן חכם מבוסס על המשחקים הנבחרים

---

## 📊 דיאגרמה 1: זרימת בחירת המשחקים הכללית

```mermaid
graph TD
    A[בקשה לתוכן<br/>ContentRequest] --> B{סוג התוכן?}
    
    B --> |news| C[תחום תאריכים נרחב<br/>past: 30 days<br/>future: 30 days]
    B --> |live| D[תחום תאריכים מיידי<br/>past: 0 days<br/>future: 1 day]
    B --> |betting| E[תחום תאריכים עתידי<br/>past: 0 days<br/>future: 7 days]
    B --> |analysis| F[תחום תאריכים מורחב<br/>past: 7 days<br/>future: 14 days]
    B --> |polls| G[תחום תאריכים עתידי<br/>past: 0 days<br/>future: 7 days]
    B --> |daily_summary| H[תחום תאריכים צר<br/>past: 1 day<br/>future: 1 day]
    
    C --> I[קריאה ל-UnifiedFootballService]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> J[בדיקת APIs זמינים<br/>לפי עדיפות]
    
    J --> K{יש API עובד?}
    K --> |לא| L[Fallback למשחקים דמה]
    K --> |כן| M[Football-Data.org<br/>עדיפות 1]
    K --> |כן| N[API-Football<br/>עדיפות 2]
    K --> |כן| O[SoccersAPI<br/>עדיפות 3]
    K --> |כן| P[APIFootball.com<br/>עדיפות 4]
    
    M --> Q[חישוב תאריכים דינמי<br/>לפי סוג API]
    N --> Q
    O --> Q
    P --> Q
    
    Q --> R[קריאת API ונתונים גולמיים]
    R --> S[FootballMatchScorer<br/>ניקוד חכם]
    
    S --> T[סינון לפי תחום תאריכים<br/>minDate - maxDate]
    
    T --> U[ניקוד משחקים בודדים]
    U --> V[ניקוד תחרות<br/>Premier League: 10<br/>Champions League: 9<br/>La Liga: 8]
    U --> W[ניקוד קבוצות<br/>Manchester United: 10<br/>Real Madrid: 10<br/>Barcelona: 9]
    U --> X[ניקוד תזמון<br/>היום/מחר: 5<br/>השבוע: 3<br/>שבועיים: 2<br/>מעל שבועיים: 0]
    U --> Y[ניקוד שלב<br/>גמר: 5<br/>חצי גמר: 4<br/>רבע גמר: 3]
    U --> Z[ניקוד יריבות<br/>דרבי: 3-5<br/>משחק רגיל: 0-1]
    
    V --> AA[סינון נוסף]
    W --> AA
    X --> AA
    Y --> AA
    Z --> AA
    
    AA --> BB[הסרת משחקים ישנים<br/>מעל יום אחורה]
    BB --> CC[הסרת משחקים רחוקים<br/>מעל 14 יום קדימה]
    CC --> DD[סינון לפי סף מינימלי<br/>news: 20 נקודות<br/>live: 15 נקודות]
    
    DD --> EE[מיון לפי ניקוד כולל<br/>גבוה לנמוך]
    
    EE --> FF[החזרת Top N משחקים<br/>לפי maxResults]
    
    L --> GG[Fallback: תוכן RSS<br/>מ-BBC, Guardian, Metro]
    GG --> HH[עיבוד AI ותרגום<br/>לשפה המבוקשת]
    
    FF --> II[יצירת תוכן סופי<br/>עם תבניות לשוניות]
    HH --> II
    
    style A fill:#e1f5fe
    style S fill:#fff3e0
    style I fill:#f3e5f5
    style AA fill:#e8f5e8
    style II fill:#fce4ec
```

### הסבר הדיאגרמה:
- **תחומי תאריכים דינמיים**: כל סוג תוכן מקבל טווח תאריכים שונה
- **עדיפות APIs**: 4 APIs בעדיפות יורדת עם fallback אוטומטי
- **ניקוד חכם**: 5 קטגוריות ניקוד עם משקולות שונות
- **סינון מתקדם**: מספר שלבי סינון לפי זמן ורלוונטיות

---

## 🧠 דיאגרמה 2: מערכת הניקוד החכמה

```mermaid
graph TB
    A[משחק בודד<br/>Match Data] --> B[Football Match Scorer<br/>מערכת ניקוד חכמה]
    
    B --> C[ניקוד תחרות<br/>Competition Score]
    B --> D[ניקוד קבוצות<br/>Teams Score]
    B --> E[ניקוד תזמון<br/>Timing Score]
    B --> F[ניקוד שלב<br/>Stage Score]
    B --> G[ניקוד יריבות<br/>Rivalry Score]
    
    C --> C1[Premier League: 10 נקודות<br/>Champions League: 9 נקודות<br/>La Liga: 8 נקודות<br/>Serie A: 7 נקודות<br/>Bundesliga: 6 נקודות<br/>League 1: 4 נקודות<br/>תחרויות אחרות: 2 נקודות]
    
    D --> D1[מחשב נקודות לפי פופולריות:<br/>Top 6 EPL: 10 נקודות כל אחד<br/>Real Madrid: 10 נקודות<br/>Barcelona: 9 נקודות<br/>Bayern Munich: 8 נקודות<br/>PSG: 7 נקודות<br/>AC Milan/Inter: 6 נקודות<br/>Juventus: 6 נקודות<br/>קבוצות אחרות: 1-3 נקודות]
    
    E --> E1{סוג התוכן?}
    E1 --> |live_update| E2[משחק חי: 10 נקודות<br/>תוך 12 שעות: 7 נקודות<br/>אחרת: 1 נקודה]
    E1 --> |news| E3[היום/מחר: 5 נקודות<br/>תוך 3 ימים: 4 נקודות<br/>השבוע: 3 נקודות<br/>תוך שבועיים: 2 נקודות<br/>מעבר לשבועיים: 0 נקודות]
    E1 --> |אחר| E4[תזמון רגיל לפי קרבה]
    
    F --> F1[גמר: 5 נקודות<br/>חצי גמר: 4 נקודות<br/>רבע גמר: 3 נקודות<br/>שמינית גמר: 2 נקודות<br/>משחקי בית: 1 נקודה<br/>ליגה רגילה: 0 נקודות]
    
    G --> G1[דרבי ערים: 5 נקודות<br/>יריבות היסטורית: 3 נקודות<br/>דרבי מדינה: 2 נקודות<br/>משחק רגיל: 0 נקודות]
    
    C1 --> H[חישוב ניקוד כולל]
    D1 --> H
    E2 --> H
    E3 --> H
    E4 --> H
    F1 --> H
    G1 --> H
    
    H --> I[Total Score = <br/>Competition + Teams + Timing + Stage + Rivalry]
    
    I --> J{Total Score >= 15?}
    J --> |כן| K[מתאים לתוכן חי]
    J --> |לא| L[לא מתאים לתוכן חי]
    
    I --> M{Total Score >= 20?}
    M --> |כן| N[מתאים לחדשות<br/>ותחזיות]
    M --> |לא| O[לא מתאים]
    
    I --> P[סינונים נוספים]
    P --> P1[הסרת משחקים<br/>מעל 14 יום]
    P --> P2[הסרת משחקים<br/>מעל יום אחורה]
    P --> P3[בדיקת התאמה<br/>לסוג התוכן]
    
    P1 --> Q[מיון לפי ניקוד<br/>גבוה לנמוך]
    P2 --> Q
    P3 --> Q
    
    Q --> R[החזרת Top N<br/>המשחקים הטובים ביותר]
    
    style A fill:#e3f2fd
    style B fill:#fff8e1
    style H fill:#e8f5e8
    style I fill:#fce4ec
    style Q fill:#f3e5f5
    style R fill:#e1f5fe
```

### פירוט מערכת הניקוד:

#### 🏆 **ניקוד תחרות (0-10 נקודות)**
```
Premier League: 10 נקודות
Champions League: 9 נקודות  
La Liga: 8 נקודות
Serie A: 7 נקודות
Bundesliga: 6 נקודות
Ligue 1: 4 נקודות
תחרויות אחרות: 2 נקודות
```

#### ⭐ **ניקוד קבוצות (0-20 נקודות מקסימום)**
```
Top 6 EPL (Man United, City, Liverpool, Chelsea, Arsenal, Tottenham): 10 כל אחד
Real Madrid: 10 נקודות
Barcelona: 9 נקודות
Bayern Munich: 8 נקודות
PSG: 7 נקודות
AC Milan, Inter Milan: 6 נקודות
Juventus: 6 נקודות
קבוצות פופולריות אחרות: 3-5 נקודות
קבוצות רגילות: 1-2 נקודות
```

#### ⏰ **ניקוד תזמון (0-10 נקודות)**
- **תוכן חי**: משחק חי = 10, תוך 12 שעות = 7, אחרת = 1
- **תוכן רגיל**: היום/מחר = 5, השבוע = 3, שבועיים = 2, מעבר לכך = 0

#### 🏅 **ניקוד שלב (0-5 נקודות)**
```
גמר: 5 נקודות
חצי גמר: 4 נקודות
רבע גמר: 3 נקודות
שמינית גמר: 2 נקודות
משחקי בית: 1 נקודה
ליגה רגילה: 0 נקודות
```

#### ⚔️ **ניקוד יריבות (0-5 נקודות)**
```
דרבי ערים (Manchester, Madrid, Milan): 5 נקודות
יריבות היסטורית (El Clasico): 3 נקודות  
דרבי מדינה: 2 נקודות
משחק רגיל: 0 נקודות
```

---

## 🔄 דיאגרמה 3: התהליך המלא מקצה לקצה

```mermaid
sequenceDiagram
    participant U as User/System
    participant API as Unified Content API
    participant SCG as Smart Content Generator  
    participant UFS as Unified Football Service
    participant FMS as Football Match Scorer
    participant RSS as RSS News Fetcher
    participant AI as OpenAI Service
    participant IMG as Image Generator
    participant TG as Telegram Bot
    
    U->>API: POST /api/unified-content<br/>type=news, language=en
    API->>SCG: generateContent(news, en, 3)
    
    SCG->>SCG: Get DATE_RANGES[news]<br/>past: 30, future: 30
    
    SCG->>UFS: getSmartMatches({type: news, language: en})
    
    UFS->>UFS: refreshAvailableAPIs()
    UFS->>UFS: getWorkingAPI()<br/>football-data-org (priority 1)
    
    Note over UFS: Calculate dynamic date range:<br/>news: 5 days back, 5 days forward
    
    UFS->>API_EXT: GET football-data.org/v4/matches<br/>dateFrom=2025-06-20&dateTo=2025-06-30
    API_EXT-->>UFS: Raw matches data
    
    UFS->>FMS: getBestMatchesForContentType(matches, news, 5)
    
    Note over FMS: Smart Scoring Process
    FMS->>FMS: scoreMatches(matches)
    loop For each match
        FMS->>FMS: calculateCompetitionScore()<br/>Premier League: 10 points
        FMS->>FMS: calculateTeamsScore()<br/>Big 6: 10 points each
        FMS->>FMS: calculateTimingScore()<br/>Today/Tomorrow: 5 points
        FMS->>FMS: calculateStageScore()<br/>Regular: 0 points
        FMS->>FMS: calculateRivalryScore()<br/>Derby: 3-5 points
    end
    
    FMS->>FMS: Filter by date range<br/>Remove old/far matches
    FMS->>FMS: Filter by min threshold<br/>news: 20 points minimum
    FMS->>FMS: Sort by total score<br/>highest first
    
    FMS-->>UFS: Top scored matches
    UFS-->>SCG: ScoredMatch[]
    
    alt Matches found
        SCG->>SCG: createContentFromMatches()
        loop For each match
            SCG->>AI: Enhance content with GPT-4
            AI-->>SCG: Enhanced title & content
            SCG->>AI: Translate to target language
            AI-->>SCG: Translated content
            SCG->>IMG: Generate image with DALL-E
            IMG-->>SCG: Local image URL
        end
    else No matches
        SCG->>RSS: Fetch real football news
        RSS-->>SCG: BBC, Guardian, Metro articles
        SCG->>AI: Enhance & translate news
        AI-->>SCG: Enhanced content
    end
    
    SCG-->>API: GenerationResult with ContentItems
    
    API->>API: Find active channels for distribution
    Note over API: Now finds ALL active channels<br/>regardless of requested language
    
    loop For each language group
        API->>AI: Translate content to channel language
        AI-->>API: Translated content
        API->>TG: Send message to channel
        TG-->>API: Success (messageId)
    end
    
    API-->>U: Distribution success<br/>1/1 channels reached
```

### תהליך הבחירה בפועל:

1. **בקשת תוכן** מהמשתמש או מהמערכת
2. **קביעת תחום תאריכים** לפי סוג התוכן
3. **בחירת API עובד** לפי עדיפות
4. **שליפת משחקים גולמיים** מה-API
5. **ניקוד חכם** של כל משחק (5 קטגוריות)
6. **סינון ומיון** לפי הניקוד
7. **יצירת תוכן AI** והתאמה לשפות
8. **שליחה לטלגרם** לכל הערוצים

---

## ✅ תיקון קריטי שבוצע

### 🚨 **הבעיה המקורית:**
המערכת חיפשה ערוצים פעילים רק עבור השפה הספציפית שהתבקשה:

```typescript
// לפני התיקון - קוד שגוי
const channels = await supabase
  .from('channels')
  .select('*')
  .eq('is_active', true)
  .eq('language', language) // ❌ זה גרם לבעיה!
```

**תוצאה:** `📊 Found 0 active channels for language: en` למרות שיש ערוץ פעיל באמהרית.

### ✅ **הפתרון שהוטמע:**
המערכת מוצאת כל הערוצים הפעילים ומשלחת לכל אחד בשפה שלו:

```typescript
// אחרי התיקון - קוד נכון
const channels = await supabase
  .from('channels')
  .select('*')
  .eq('is_active', true)
// הסרנו את .eq('language', language)

// חלוקה לפי שפות
const channelsByLanguage = channels.reduce((acc, channel) => {
  const lang = channel.language;
  if (!acc[lang]) acc[lang] = [];
  acc[lang].push(channel);
  return acc;
}, {});

// עיבוד תוכן לכל שפה
for (const [channelLanguage, langChannels] of Object.entries(channelsByLanguage)) {
  // תרגום התוכן לשפת הערוץ
  // שליחה לכל הערוצים בשפה זו
}
```

### 🎯 **התוצאות הסופיות:**
```
✅ English request → Sent to AfircaSportCenter (messageId: 386)
✅ Swahili request → Sent to AfircaSportCenter (messageId: 387)  
✅ Amharic request → Sent to AfircaSportCenter (messageId: 385)
```

---

## 📋 סף הניקוד למסנני התוכן

| סוג תוכן | סף מינימלי | הסבר |
|---------|------------|------|
| **News** | 20 נקודות | תוכן חדשותי צריך להיות איכותי ורלוונטי |
| **Live Update** | 15 נקודות | עדכונים חיים פחות קפדניים בניקוד |
| **Betting Tips** | 20 נקודות | טיפי הימורים צריכים להיות איכותיים |
| **Analysis** | 18 נקודות | ניתוחים דורשים רמת איכות גבוהה |
| **Polls** | 15 נקודות | סקרים פחות קפדניים |
| **Daily Summary** | 12 נקודות | סיכומים יומיים גמישים יותר |

---

## 📚 מקורות נתונים ו-Fallback

### APIs עיקריים (לפי עדיפות):
1. **Football-Data.org** - הכי אמין ומעודכן
2. **API-Football** - חלופה איכותית  
3. **SoccersAPI** - נתונים נוספים
4. **APIFootball.com** - רזרבה

### מקורות Fallback (RSS):
- **BBC Sport Football** ✅
- **Guardian Football** ✅  
- **Metro Football** ✅
- **Sky Sports Football** ✅
- ~~Football365~~ ❌ (404 errors)
- ~~Goal.com~~ ❌ (DNS issues)

---

## 🔧 תצורת תחומי תאריכים

```typescript
const DATE_RANGES = {
  news: { past: 30, future: 30 },      // תחום הכי נרחב לחדשות
  live: { past: 0, future: 1 },        // רק משחקים חיים/קרובים
  betting: { past: 0, future: 7 },     // רק משחקים עתידיים
  analysis: { past: 7, future: 14 },   // ניתוח מורחב
  polls: { past: 0, future: 7 },       // סקרים עתידיים
  daily_summary: { past: 1, future: 1 }, // סיכום יומי צר
  coupons: { past: 0, future: 3 },     // קופונים קצרי טווח
  memes: { past: 7, future: 7 }        // ממים גמישים
};
```

---

## 🎯 סיכום

המערכת מבצעת בחירה חכמה של משחקים על בסיס:
- **5 קטגוריות ניקוד** עם משקולות מתקדמות
- **תחומי תאריכים דינמיים** לפי סוג התוכן
- **סינון מתקדם** עם ספים מותאמים
- **Fallback אמין** לתוכן RSS כשאין משחקים
- **תמיכה רב-לשונית** עם תרגום אוטומטי

התוצאה: תוכן איכותי ורלוונטי שמגיע לכל הערוצים בשפה המתאימה! ⚽✨ 