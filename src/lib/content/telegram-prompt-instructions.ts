/**
 * 🎨 TELEGRAM CONTENT FORMATTING INSTRUCTIONS
 * Quick reference for OpenAI prompts - use these in content generators
 */

export const TELEGRAM_FORMATTING_INSTRUCTIONS = {
  
  // 🎯 Base instruction for all content types
  BASE_PROMPT: `
Format content for Telegram using HTML tags and emojis:
- Use <b>bold</b> for titles, <i>italic</i> for context, <code>code</code> for promo codes
- Start with relevant emoji + bold title
- Use double line breaks between sections
- Include confidence percentages and risk color coding (🟢🟡🔴)
- End with appropriate disclaimers
`,

  // 📄 Content-specific instructions
  CONTENT_TYPES: {
    betting: `
🎯 <b>BETTING TIPS: Team A vs Team B</b>
🏆 <i>Competition</i>
💰 TOP BETTING TIPS:
🏆 <b>Main Prediction</b> - Odds: X.XX | Confidence: XX% 🟢
⭐ <b>Alternative</b> - Odds: X.XX | Confidence: XX% 🟡
Include: 🔗 Promo codes, ⚠️ Disclaimers, 🔞 Age warnings
`,

    news: `
📰 <b>News Title</b>
Content with proper spacing and formatting.
📖 <a href="source">Read full article</a>
Use category emojis: 📰 General, 🚨 Breaking, 🔄 Transfer, ⚽ Match, 🏥 Injury
`,

    live: `
🔴 <b>LIVE: Team A X - Y Team B</b>
🏆 Competition | ⏱️ XX'
📝 <b>Recent Events:</b>
⚽ XX' Team - Player (Goal)
🟨 XX' Team - Player (Card)
`,

    analysis: `
🧠 <b>MATCH ANALYSIS: Team A vs Team B</b>
🏆 <i>Competition</i>
📊 <b>Key Statistics:</b> [data with bullets]
🎯 <b>Prediction:</b> [with confidence %]
⚽ <b>Key Factors:</b> [bullet points]
`,

    summary: `
📋 <b>DAILY SUMMARY - [Date]</b>
🏆 <b>Top Matches:</b> [results]
🌟 <b>Highlights:</b> [bullet points]
📊 <b>Statistics:</b> [key numbers]
🔮 <b>Tomorrow:</b> [fixtures]
`,

    poll: `
🗳️ <b>Poll Question Here</b>
⚽ <i>Match context if relevant</i>
👆 Vote in the poll below and see what others think!
Use: 🔮 Prediction, 💭 Opinion, 🧠 Trivia
`
  },

  // 🌍 Language-specific elements
  LANGUAGE_ELEMENTS: {
    disclaimers: {
      en: '⚠️ Bet responsibly. Only stake what you can afford to lose.\n🔞 18+ only. Gambling can be addictive.',
      am: '⚠️ በመልከም ሁኔታ ውርርድ ያድርጉ። መጥፋት የሚችሉትን ብቻ ይወርርዱ።\n🔞 ከ18 አመት በላይ ብቻ። ውርርድ ሱስ ሊፈጥር ይችላል።',
      sw: '⚠️ Weka kamari kwa busara. Tia tu kile unachoweza kupoteza.\n🔞 Miaka 18+ tu. Kamari inaweza kusababisha ulezi.'
    },
    
    titles: {
      betting: { en: '🎯 BETTING TIPS', am: '🎯 የውርርድ ምክሮች', sw: '🎯 MAPENDEKEZO YA KAMARI' },
      news: { en: '📰 BREAKING NEWS', am: '📰 አዲስ ዜና', sw: '📰 HABARI MPYA' },
      live: { en: '🔴 LIVE UPDATE', am: '🔴 ቀጥተኛ ዜና', sw: '🔴 TAARIFA ZA MOJA KWA MOJA' }
    }
  },

  // 🎨 Visual elements
  EMOJIS: {
    betting: '🎯 💰 🏆 ⭐ 💎 🟢 🟡 🔴 ⚠️ 🔞 🔗',
    news: '📰 🚨 🔄 ⚽ 🏥 📖 📋',
    live: '🔴 ⚽ 🟨 🟥 ⏱️ 📝 🏆',
    analysis: '🧠 📊 🎯 ⚽ 📈 🔍',
    summary: '📋 🌟 📊 🔮 🏆',
    general: '⚽ 🏆 🥅 👑 🎖️ 🌟 ⭐'
  },

  // ⚡ Quick format function
  getPromptInstructions: (contentType: string, language: string = 'en') => {
    const baseInstruction = TELEGRAM_FORMATTING_INSTRUCTIONS.BASE_PROMPT;
    const contentFormat = TELEGRAM_FORMATTING_INSTRUCTIONS.CONTENT_TYPES[contentType as keyof typeof TELEGRAM_FORMATTING_INSTRUCTIONS.CONTENT_TYPES] || '';
    const emojis = TELEGRAM_FORMATTING_INSTRUCTIONS.EMOJIS[contentType as keyof typeof TELEGRAM_FORMATTING_INSTRUCTIONS.EMOJIS] || TELEGRAM_FORMATTING_INSTRUCTIONS.EMOJIS.general;
    
    // 🌍 Critical language instructions
    const languageInstructions = {
      en: 'CRITICAL: Write ENTIRE response in ENGLISH only. Use proper English grammar and vocabulary. Do not use words from other languages.',
      am: 'CRITICAL: Write ENTIRE response in AMHARIC (አማርኛ) only. Use native Amharic script and football terminology. DO NOT use any English words. Every single word must be in Amharic script.',
      sw: 'CRITICAL: Write ENTIRE response in SWAHILI only. Use proper Swahili grammar and native football terminology. DO NOT use any English words. Every single word must be in Swahili.'
    };

    const languageInstruction = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;
    
    return `${baseInstruction}

🌍 CRITICAL LANGUAGE REQUIREMENT:
${languageInstruction}

CONTENT FORMAT for ${contentType.toUpperCase()}:
${contentFormat}

AVAILABLE EMOJIS: ${emojis}

${contentType === 'betting' ? `INCLUDE DISCLAIMER: ${TELEGRAM_FORMATTING_INSTRUCTIONS.LANGUAGE_ELEMENTS.disclaimers[language as keyof typeof TELEGRAM_FORMATTING_INSTRUCTIONS.LANGUAGE_ELEMENTS.disclaimers] || TELEGRAM_FORMATTING_INSTRUCTIONS.LANGUAGE_ELEMENTS.disclaimers.en}` : ''}

Create professional, engaging content with proper HTML formatting and visual hierarchy.`;
  }
};

// 🚀 Export function for easy use in generators
export const getTelegramPromptInstructions = (contentType: string, language: string = 'en') => {
  return TELEGRAM_FORMATTING_INSTRUCTIONS.getPromptInstructions(contentType, language);
};

// 📝 Usage examples:
// const instructions = getTelegramPromptInstructions('betting', 'en');
// const newsInstructions = getTelegramPromptInstructions('news', 'am');