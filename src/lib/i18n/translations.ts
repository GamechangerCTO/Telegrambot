/**
 * 🌐 UI Translations
 * Interface language translations for English, Amharic, and Swahili
 * Note: This is for UI labels, not content generation
 */

export type UILanguage = 'en' | 'am' | 'sw';

export interface Translations {
  // Navigation
  nav: {
    dashboard: string;
    bots: string;
    channels: string;
    content: string;
    analytics: string;
    settings: string;
    help: string;
    logout: string;
  };
  
  // Common actions
  actions: {
    create: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    submit: string;
    back: string;
    next: string;
    previous: string;
    refresh: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    copy: string;
    share: string;
  };
  
  // Status and states
  status: {
    active: string;
    inactive: string;
    enabled: string;
    disabled: string;
    online: string;
    offline: string;
    connected: string;
    disconnected: string;
    loading: string;
    success: string;
    error: string;
    warning: string;
    pending: string;
  };
  
  // Forms
  forms: {
    name: string;
    description: string;
    language: string;
    email: string;
    password: string;
    confirmPassword: string;
    required: string;
    optional: string;
    selectOption: string;
    selectLanguage: string;
    botToken: string;
    channelUsername: string;
    contentTypes: string;
  };
  
  // Dashboard
  dashboard: {
    welcome: string;
    subtitle: string;
    overview: string;
    quickActionsTitle: string;
    recentActivity: string;
    statistics: string;
    totalBots: string;
    totalChannels: string;
    totalMessages: string;
    activeUsers: string;
    platformFeatures: string;
    noActivity: string;
    noActivityDescription: string;
    insights: string;
    contentGenerated: string;
    monthlyRevenue: string;
    thisMonth: string;
    quickActions: {
      createBot: string;
      addChannel: string;
      generateContent: string;
    };
    activity: {
      botCreated: string;
      contentGenerated: string;
      analyticsUpdated: string;
      channelConnected: string;
    };
  };
  
  // Bots
  bots: {
    title: string;
    createBot: string;
    editBot: string;
    botName: string;
    botToken: string;
    botChannels: string;
    botStatus: string;
    botCreated: string;
    botUpdated: string;
    noBots: string;
    createFirstBot: string;
  };
  
  // Channels
  channels: {
    title: string;
    createChannel: string;
    editChannel: string;
    channelName: string;
    channelUsername: string;
    channelLanguage: string;
    channelBot: string;
    channelContentTypes: string;
    noChannels: string;
    createFirstChannel: string;
  };
  
  // Content
  content: {
    title: string;
    generate: string;
    preview: string;
    send: string;
    schedule: string;
    contentType: string;
    targetLanguage: string;
    targetChannels: string;
    generatedContent: string;
    noContent: string;
    types: {
      live: string;
      betting: string;
      news: string;
      polls: string;
      analysis: string;
      coupons: string;
      memes: string;
      daily_summary: string;
      weekly_summary: string;
    };
  };
  
  // Settings
  settings: {
    title: string;
    general: string;
    apiKeys: string;
    notifications: string;
    language: string;
    theme: string;
    account: string;
    preferences: string;
  };
  
  // Messages and notifications
  messages: {
    saveSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
    validationError: string;
    networkError: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
  };
  
  // Time and dates
  time: {
    now: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    thisWeek: string;
    lastWeek: string;
    thisMonth: string;
    lastMonth: string;
  };

  // Features
  features: {
    aiContent: {
      title: string;
      description: string;
      action: string;
    };
    liveUpdates: {
      title: string;
      description: string;
      action: string;
    };
    bettingIntelligence: {
      title: string;
      description: string;
      action: string;
    };
    analytics: {
      title: string;
      description: string;
      action: string;
    };
  };
}

export const translations: Record<UILanguage, Translations> = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      bots: 'Bots',
      channels: 'Channels',
      content: 'Content',
      analytics: 'Analytics',
      settings: 'Settings',
      help: 'Help',
      logout: 'Logout'
    },
    actions: {
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      refresh: 'Refresh',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      copy: 'Copy',
      share: 'Share'
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      enabled: 'Enabled',
      disabled: 'Disabled',
      online: 'Online',
      offline: 'Offline',
      connected: 'Connected',
      disconnected: 'Disconnected',
      loading: 'Loading',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      pending: 'Pending'
    },
    forms: {
      name: 'Name',
      description: 'Description',
      language: 'Language',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      required: 'Required',
      optional: 'Optional',
      selectOption: 'Select an option',
      selectLanguage: 'Select language',
      botToken: 'Bot Token',
      channelUsername: 'Channel Username',
      contentTypes: 'Content Types'
    },
    dashboard: {
      welcome: 'Welcome to your Dashboard',
      subtitle: 'Manage your Telegram sports channels with ease',
      overview: 'Overview',
      quickActionsTitle: 'Quick Actions',
      recentActivity: 'Recent Activity',
      statistics: 'Statistics',
      totalBots: 'Total Bots',
      totalChannels: 'Total Channels',
      totalMessages: 'Messages Sent',
      activeUsers: 'Active Users',
      platformFeatures: 'Platform Features',
      noActivity: 'No recent activity',
      noActivityDescription: 'Your activity will appear here once you start using the platform',
      insights: 'Performance Insights',
      contentGenerated: 'Content Generated',
      monthlyRevenue: 'Monthly Revenue',
      thisMonth: 'this month',
      quickActions: {
        createBot: 'Create New Bot',
        addChannel: 'Add Channel',
        generateContent: 'Generate Content'
      },
      activity: {
        botCreated: 'New bot created',
        contentGenerated: 'Content generated',
        analyticsUpdated: 'Analytics updated',
        channelConnected: 'Channel connected'
      }
    },
    bots: {
      title: 'Telegram Bots',
      createBot: 'Create New Bot',
      editBot: 'Edit Bot',
      botName: 'Bot Name',
      botToken: 'Bot Token',
      botChannels: 'Bot Channels',
      botStatus: 'Bot Status',
      botCreated: 'Bot Created',
      botUpdated: 'Bot Updated',
      noBots: 'No bots found',
      createFirstBot: 'Create your first bot'
    },
    channels: {
      title: 'Telegram Channels',
      createChannel: 'Create New Channel',
      editChannel: 'Edit Channel',
      channelName: 'Channel Name',
      channelUsername: 'Channel Username',
      channelLanguage: 'Channel Language',
      channelBot: 'Associated Bot',
      channelContentTypes: 'Content Types',
      noChannels: 'No channels found',
      createFirstChannel: 'Create your first channel'
    },
    content: {
      title: 'Content Management',
      generate: 'Generate Content',
      preview: 'Preview',
      send: 'Send Now',
      schedule: 'Schedule',
      contentType: 'Content Type',
      targetLanguage: 'Target Language',
      targetChannels: 'Target Channels',
      generatedContent: 'Generated Content',
      noContent: 'No content available',
      types: {
        live: 'Live Updates',
        betting: 'Betting Tips',
        news: 'News Articles',
        polls: 'Polls & Surveys',
        analysis: 'Match Analysis',
        coupons: 'Promotional Coupons',
        memes: 'Entertainment',
        daily_summary: 'Daily Summary',
        weekly_summary: 'Weekly Summary'
      }
    },
    settings: {
      title: 'Settings',
      general: 'General',
      apiKeys: 'API Keys',
      notifications: 'Notifications',
      language: 'Language',
      theme: 'Theme',
      account: 'Account',
      preferences: 'Preferences'
    },
    messages: {
      saveSuccess: 'Changes saved successfully',
      saveError: 'Failed to save changes',
      deleteSuccess: 'Item deleted successfully',
      deleteError: 'Failed to delete item',
      validationError: 'Please check your input',
      networkError: 'Network connection error',
      unauthorized: 'Please log in to continue',
      forbidden: 'You do not have permission',
      notFound: 'Item not found',
      serverError: 'Server error occurred'
    },
    time: {
      now: 'Now',
      today: 'Today',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      thisWeek: 'This Week',
      lastWeek: 'Last Week',
      thisMonth: 'This Month',
      lastMonth: 'Last Month'
    },

    features: {
      aiContent: {
        title: 'AI Content Generation',
        description: 'Create engaging sports content with artificial intelligence',
        action: 'Generate Content'
      },
      liveUpdates: {
        title: 'Live Match Updates',
        description: 'Real-time scores and match information for your audience',
        action: 'View Live Updates'
      },
      bettingIntelligence: {
        title: 'Smart Betting Tips',
        description: 'AI-powered betting predictions and analysis',
        action: 'View Betting Tips'
      },
      analytics: {
        title: 'Advanced Analytics',
        description: 'Track performance and engagement across all channels',
        action: 'View Analytics'
      }
    }
  },
  
  am: {
    nav: {
      dashboard: 'ዳሽቦርድ',
      bots: 'ቦቶች',
      channels: 'ቻናሎች',
      content: 'ይዘት',
      analytics: 'ትንተና',
      settings: 'ማስተካከያዎች',
      help: 'እርዳታ',
      logout: 'ውጣ'
    },
    actions: {
      create: 'ፍጠር',
      edit: 'አርም',
      delete: 'ሰርዝ',
      save: 'አስቀምጥ',
      cancel: 'ሰርዝ',
      submit: 'አስረክብ',
      back: 'ተመለስ',
      next: 'ቀጣይ',
      previous: 'ቀዳሚ',
      refresh: 'አድስ',
      search: 'ፈልግ',
      filter: 'አጣራ',
      export: 'ላክ',
      import: 'አስገባ',
      copy: 'ቅዳ',
      share: 'አጋራ'
    },
    status: {
      active: 'ንቁ',
      inactive: 'ንቁ ያልሆነ',
      enabled: 'ነቅቷል',
      disabled: 'ተሰናክሏል',
      online: 'በመስመር ላይ',
      offline: 'ከመስመር ውጭ',
      connected: 'ተገናኝቷል',
      disconnected: 'ተቋርጧል',
      loading: 'እየተጫነ',
      success: 'ተሳክቷል',
      error: 'ስህተት',
      warning: 'ማስጠንቀቂያ',
      pending: 'በመጠባበቅ ላይ'
    },
    forms: {
      name: 'ስም',
      description: 'መግለጫ',
      language: 'ቋንቋ',
      email: 'ኢሜይል',
      password: 'የይለፍ ቃል',
      confirmPassword: 'የይለፍ ቃል አረጋግጥ',
      required: 'ያስፈልጋል',
      optional: 'አማራጭ',
      selectOption: 'አንድ አማራጭ ይምረጡ',
      selectLanguage: 'ቋንቋ ይምረጡ',
      botToken: 'የቦት ቶከን',
      channelUsername: 'የቻናል ተጠቃሚ ስም',
      contentTypes: 'የይዘት ዓይነቶች'
    },
    dashboard: {
      welcome: 'ወደ ዳሽቦርድዎ እንኳን በደህና መጡ',
      subtitle: 'የቴሌግራም ስፖርት ቻናሎችዎን በቀላሉ ያስተዳድሩ',
      overview: 'አጠቃላይ እይታ',
      quickActionsTitle: 'ፈጣን እርምጃዎች',
      recentActivity: 'የቅርብ ጊዜ እንቅስቃሴ',
      statistics: 'ስታቲስቲክስ',
      totalBots: 'ጠቅላላ ቦቶች',
      totalChannels: 'ጠቅላላ ቻናሎች',
      totalMessages: 'የተላኩ መልእክቶች',
      activeUsers: 'ንቁ ተጠቃሚዎች',
      platformFeatures: 'የመድረክ ባህሪያት',
      noActivity: 'የቅርብ ጊዜ እንቅስቃሴ የለም',
      noActivityDescription: 'መድረኩን መጠቀም ሲጀምሩ እንቅስቃሴዎ እዚህ ይታያል',
      insights: 'የአፈፃፀም ግንዛቤዎች',
      contentGenerated: 'የተፈጠረ ይዘት',
      monthlyRevenue: 'ወርሃዊ ገቢ',
      thisMonth: 'በዚህ ወር',
      quickActions: {
        createBot: 'አዲስ ቦት ፍጠር',
        addChannel: 'ቻናል ጨምር',
        generateContent: 'ይዘት ፍጠር'
      },
      activity: {
        botCreated: 'አዲስ ቦት ተፈጥሯል',
        contentGenerated: 'ይዘት ተፈጥሯል',
        analyticsUpdated: 'ትንታኔዎች ተዘምነዋል',
        channelConnected: 'ቻናል ተገናኝቷል'
      }
    },
    bots: {
      title: 'ቴሌግራም ቦቶች',
      createBot: 'አዲስ ቦት ፍጠር',
      editBot: 'ቦት አርም',
      botName: 'የቦት ስም',
      botToken: 'የቦት ቶከን',
      botChannels: 'የቦት ቻናሎች',
      botStatus: 'የቦት ሁኔታ',
      botCreated: 'ቦት ተፈጥሯል',
      botUpdated: 'ቦት ተዘምኗል',
      noBots: 'ቦቶች አልተገኙም',
      createFirstBot: 'የመጀመሪያዎትን ቦት ይፍጠሩ'
    },
    channels: {
      title: 'ቴሌግራም ቻናሎች',
      createChannel: 'አዲስ ቻናል ፍጠር',
      editChannel: 'ቻናል አርም',
      channelName: 'የቻናል ስም',
      channelUsername: 'የቻናል ተጠቃሚ ስም',
      channelLanguage: 'የቻናል ቋንቋ',
      channelBot: 'የተያያዘ ቦት',
      channelContentTypes: 'የይዘት ዓይነቶች',
      noChannels: 'ቻናሎች አልተገኙም',
      createFirstChannel: 'የመጀመሪያዎትን ቻናል ይፍጠሩ'
    },
    content: {
      title: 'የይዘት አስተዳደር',
      generate: 'ይዘት ፍጠር',
      preview: 'ቅድመ እይታ',
      send: 'አሁን ላክ',
      schedule: 'መርሐግብር',
      contentType: 'የይዘት ዓይነት',
      targetLanguage: 'ዒላማ ቋንቋ',
      targetChannels: 'ዒላማ ቻናሎች',
      generatedContent: 'የተፈጠረ ይዘት',
      noContent: 'ይዘት አይገኝም',
      types: {
        live: 'ቀጥታ ዝማኔዎች',
        betting: 'የውርርድ ምክሮች',
        news: 'የዜና ጽሑፎች',
        polls: 'ድምጽ አሰጣጥ እና ጥናቶች',
        analysis: 'የግጥሚያ ትንተና',
        coupons: 'የማስተዋወቂያ ኩፖኖች',
        memes: 'መዝናኛ',
        daily_summary: 'ዕለታዊ ማጠቃለያ',
        weekly_summary: 'ሳምንታዊ ማጠቃለያ'
      }
    },
    settings: {
      title: 'ማስተካከያዎች',
      general: 'አጠቃላይ',
      apiKeys: 'የኤፒአይ ቁልፎች',
      notifications: 'ማሳወቂያዎች',
      language: 'ቋንቋ',
      theme: 'ገጽታ',
      account: 'መለያ',
      preferences: 'ምርጫዎች'
    },
    messages: {
      saveSuccess: 'ለውጦች በተሳካ ሁኔታ ተቀምጠዋል',
      saveError: 'ለውጦችን ማስቀመጥ አልተሳካም',
      deleteSuccess: 'ንጥል በተሳካ ሁኔታ ተሰርዟል',
      deleteError: 'ንጥልን መሰረዝ አልተሳካም',
      validationError: 'እባክዎ ግብዓትዎን ይፈትሹ',
      networkError: 'የኔትወርክ ግንኙነት ስህተት',
      unauthorized: 'እባክዎ ለመቀጠል ይግቡ',
      forbidden: 'ፍቃድ የለዎትም',
      notFound: 'ንጥል አልተገኘም',
      serverError: 'የአገልጋይ ስህተት ደርሷል'
    },
    time: {
      now: 'አሁን',
      today: 'ዛሬ',
      yesterday: 'ትናንት',
      tomorrow: 'ነገ',
      thisWeek: 'በዚህ ሳምንት',
      lastWeek: 'ባለፈው ሳምንት',
      thisMonth: 'በዚህ ወር',
      lastMonth: 'ባለፈው ወር'
    },

    features: {
      aiContent: {
        title: 'የኤአይ ይዘት ፍጠራ',
        description: 'በአርቴፊሻል ኢንተለጀንስ ማሳቢ የስፖርት ይዘት ይፍጠሩ',
        action: 'ይዘት ፍጠር'
      },
      liveUpdates: {
        title: 'ቀጥታ የግጥሚያ ዝመናዎች',
        description: 'ለታዳሚዎችዎ የእውነተኛ ጊዜ ውጤቶች እና የግጥሚያ መረጃ',
        action: 'ቀጥታ ዝመናዎችን ይመልከቱ'
      },
      bettingIntelligence: {
        title: 'ብልጥ የውርርድ ምክሮች',
        description: 'በኤአይ የተደገፉ የውርርድ ትንበያዎች እና ትንተናዎች',
        action: 'የውርርድ ምክሮችን ይመልከቱ'
      },
      analytics: {
        title: 'የላቀ ትንተና',
        description: 'በሁሉም ቻናሎች አፈፃፀም እና ተሳትፎን ይከታተሉ',
        action: 'ትንተናዎችን ይመልከቱ'
      }
    }
  },
  
  sw: {
    nav: {
      dashboard: 'Dashibodi',
      bots: 'Boti',
      channels: 'Chaneli',
      content: 'Maudhui',
      analytics: 'Uchambuzi',
      settings: 'Mipangilio',
      help: 'Msaada',
      logout: 'Ondoka'
    },
    actions: {
      create: 'Unda',
      edit: 'Hariri',
      delete: 'Futa',
      save: 'Hifadhi',
      cancel: 'Ghairi',
      submit: 'Wasilisha',
      back: 'Rudi',
      next: 'Ifuatayo',
      previous: 'Iliyotangulia',
      refresh: 'Onyesha upya',
      search: 'Tafuta',
      filter: 'Chuja',
      export: 'Tuma',
      import: 'Leta',
      copy: 'Nakili',
      share: 'Shiriki'
    },
    status: {
      active: 'Hai',
      inactive: 'Haiko hai',
      enabled: 'Imewezeshwa',
      disabled: 'Imezimwa',
      online: 'Mtandaoni',
      offline: 'Nje ya mtandao',
      connected: 'Imeunganishwa',
      disconnected: 'Imekatwa',
      loading: 'Inapakia',
      success: 'Imefanikiwa',
      error: 'Hitilafu',
      warning: 'Onyo',
      pending: 'Inasubiri'
    },
    forms: {
      name: 'Jina',
      description: 'Maelezo',
      language: 'Lugha',
      email: 'Barua pepe',
      password: 'Nywila',
      confirmPassword: 'Thibitisha nywila',
      required: 'Inahitajika',
      optional: 'Si lazima',
      selectOption: 'Chagua chaguo',
      selectLanguage: 'Chagua lugha',
      botToken: 'Tokeni ya Bot',
      channelUsername: 'Jina la mtumiaji wa chaneli',
      contentTypes: 'Aina za maudhui'
    },
    dashboard: {
      welcome: 'Karibu kwenye Dashibodi yako',
      subtitle: 'Dhibiti chaneli zako za michezo za Telegram kwa urahisi',
      overview: 'Muhtasari',
      quickActionsTitle: 'Vitendo vya haraka',
      recentActivity: 'Shughuli za hivi karibuni',
      statistics: 'Takwimu',
      totalBots: 'Jumla ya Boti',
      totalChannels: 'Jumla ya Chaneli',
      totalMessages: 'Ujumbe uliotumwa',
      activeUsers: 'Watumiaji hai',
      platformFeatures: 'Vipengele vya jukwaa',
      noActivity: 'Hakuna shughuli za hivi karibuni',
      noActivityDescription: 'Shughuli zako zitaonekana hapa utakapoanza kutumia jukwaa',
      insights: 'Maarifa ya utendaji',
      contentGenerated: 'Maudhui yaliyozalishwa',
      monthlyRevenue: 'Mapato ya kila mwezi',
      thisMonth: 'mwezi huu',
      quickActions: {
        createBot: 'Unda Bot mpya',
        addChannel: 'Ongeza chaneli',
        generateContent: 'Zalisha maudhui'
      },
      activity: {
        botCreated: 'Bot mpya imeundwa',
        contentGenerated: 'Maudhui yamezalishwa',
        analyticsUpdated: 'Uchambuzi umesasishwa',
        channelConnected: 'Chaneli imeunganishwa'
      }
    },
    bots: {
      title: 'Boti za Telegram',
      createBot: 'Unda Bot mpya',
      editBot: 'Hariri Bot',
      botName: 'Jina la Bot',
      botToken: 'Tokeni ya Bot',
      botChannels: 'Chaneli za Bot',
      botStatus: 'Hali ya Bot',
      botCreated: 'Bot imeundwa',
      botUpdated: 'Bot imesasishwa',
      noBots: 'Hakuna boti zilizopatikana',
      createFirstBot: 'Unda bot yako ya kwanza'
    },
    channels: {
      title: 'Chaneli za Telegram',
      createChannel: 'Unda Chaneli mpya',
      editChannel: 'Hariri Chaneli',
      channelName: 'Jina la Chaneli',
      channelUsername: 'Jina la mtumiaji wa chaneli',
      channelLanguage: 'Lugha ya Chaneli',
      channelBot: 'Bot inayohusishwa',
      channelContentTypes: 'Aina za maudhui',
      noChannels: 'Hakuna chaneli zilizopatikana',
      createFirstChannel: 'Unda chaneli yako ya kwanza'
    },
    content: {
      title: 'Usimamizi wa Maudhui',
      generate: 'Zalisha maudhui',
      preview: 'Hakikisha',
      send: 'Tuma sasa',
      schedule: 'Ratiba',
      contentType: 'Aina ya maudhui',
      targetLanguage: 'Lugha lengwa',
      targetChannels: 'Chaneli lengwa',
      generatedContent: 'Maudhui yaliyozalishwa',
      noContent: 'Hakuna maudhui',
      types: {
        live: 'Masasisho ya moja kwa moja',
        betting: 'Vidokezo vya kubashiri',
        news: 'Makala za habari',
        polls: 'Kura na utafiti',
        analysis: 'Uchambuzi wa mechi',
        coupons: 'Kuponi za utangazaji',
        memes: 'Burudani',
        daily_summary: 'Muhtasari wa kila siku',
        weekly_summary: 'Muhtasari wa kila wiki'
      }
    },
    settings: {
      title: 'Mipangilio',
      general: 'Jumla',
      apiKeys: 'Funguo za API',
      notifications: 'Arifa',
      language: 'Lugha',
      theme: 'Mandhari',
      account: 'Akaunti',
      preferences: 'Mapendeleo'
    },
    messages: {
      saveSuccess: 'Mabadiliko yamehifadhiwa kwa ufanisi',
      saveError: 'Imeshindwa kuhifadhi mabadiliko',
      deleteSuccess: 'Kipengee kimefutwa kwa ufanisi',
      deleteError: 'Imeshindwa kufuta kipengee',
      validationError: 'Tafadhali angalia uingizaji wako',
      networkError: 'Hitilafu ya muunganisho wa mtandao',
      unauthorized: 'Tafadhali ingia ili kuendelea',
      forbidden: 'Huna ruhusa',
      notFound: 'Kipengee hakijapatikana',
      serverError: 'Hitilafu ya seva imetokea'
    },
    time: {
      now: 'Sasa',
      today: 'Leo',
      yesterday: 'Jana',
      tomorrow: 'Kesho',
      thisWeek: 'Wiki hii',
      lastWeek: 'Wiki iliyopita',
      thisMonth: 'Mwezi huu',
      lastMonth: 'Mwezi uliopita'
    },

    features: {
      aiContent: {
        title: 'Utengenezaji wa Maudhui ya AI',
        description: 'Unda maudhui ya michezo ya kuvutia kwa kutumia akili bandia',
        action: 'Zalisha Maudhui'
      },
      liveUpdates: {
        title: 'Masasisho ya Moja kwa Moja ya Mechi',
        description: 'Matokeo ya wakati halisi na habari za mechi kwa hadhira yako',
        action: 'Tazama Masasisho ya Moja kwa Moja'
      },
      bettingIntelligence: {
        title: 'Vidokezo Mahiri vya Kubashiri',
        description: 'Utabiri na uchambuzi wa kubashiri unaotegemea AI',
        action: 'Tazama Vidokezo vya Kubashiri'
      },
      analytics: {
        title: 'Uchambuzi wa Hali ya Juu',
        description: 'Fuatilia utendaji na ushiriki katika chaneli zote',
        action: 'Tazama Uchambuzi'
      }
    }
  }
};