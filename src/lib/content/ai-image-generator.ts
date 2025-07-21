// AI Image Generator - יוצר תמונות עם AI עבור תוכן כדורגל
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { getOpenAIClient } from '../api-keys';
import { createClient } from '@supabase/supabase-js';

interface ImageGenerationOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'low' | 'medium' | 'high' | 'auto' | 'standard' | 'hd'; // Support both GPT-Image-1 and DALL-E 3 values
  language?: 'en' | 'am' | 'sw';
}

interface ContentAnalysisOptions {
  content: string;
  title?: string;
  contentType: 'news' | 'betting' | 'analysis' | 'live' | 'poll' | 'daily_summary' | 'weekly_summary';
  language?: 'en' | 'am' | 'sw';
  teams?: string[];
  competition?: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  revisedPrompt?: string;
  filename?: string; // For cleanup purposes
}

export class AIImageGenerator {
  private getSupabaseClient() {
    // Use service role key for storage operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  /**
   * Upload image to Supabase Storage and get public URL
   */
  private async uploadToSupabase(imageBuffer: Buffer, filename: string): Promise<string | null> {
    try {
      console.log(`📤 Uploading ${filename} to Supabase Storage...`);
      console.log(`🔑 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      console.log(`🔐 Service role key available: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
      console.log(`📊 Image buffer size: ${imageBuffer.length} bytes`);
      
      const supabase = this.getSupabaseClient();
      
      // בדיקת גישה ל-bucket לפני upload
      console.log('🔍 Checking bucket access...');
      
      // בדיקת connection בסיסית
      try {
        const { data: testData, error: testError } = await supabase.from('user_roles').select('count').limit(1);
        console.log(`🔌 Database connection test: ${testError ? 'FAILED' : 'SUCCESS'}`);
        if (testError) console.log('🔌 DB Error:', testError.message);
      } catch (connError) {
        console.log('🔌 Connection error:', connError);
      }
      
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('❌ Failed to list buckets:', {
          message: bucketError.message,
          error: bucketError
        });
        return null;
      }
      console.log('📂 Available buckets:', buckets?.map(b => `${b.name} (public: ${b.public})`));
      
      // וידוא שה-bucket 'generated-images' קיים
      const targetBucket = buckets?.find(b => b.name === 'generated-images');
      if (!targetBucket) {
        console.error('❌ Bucket "generated-images" not found!');
        return null;
      }
      console.log(`✅ Target bucket found: generated-images (public: ${targetBucket.public})`);
      
      // ניסיון upload
      console.log('🚀 Starting upload...');
      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(filename, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (error) {
        console.error('❌ Upload failed:', {
          message: error.message,
          error: error
        });
        return null;
      }
      
      console.log(`✅ Upload successful! Data:`, data);
      
      // יצירת Public URL
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(filename);
      
      console.log(`✅ Public URL generated: ${urlData.publicUrl}`);
      
      // בדיקה שה-URL נגיש
      try {
        const testResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
        console.log(`🌐 URL accessibility test: ${testResponse.status} ${testResponse.statusText}`);
      } catch (testError) {
        console.log('⚠️ URL test failed (might be temporary):', testError);
      }
      
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('❌ Critical error in uploadToSupabase:', error);
      return null;
    }
  }
  
  /**
   * Delete image from Supabase Storage
   */
  private async deleteFromSupabase(filename: string): Promise<void> {
    try {
      const supabase = this.getSupabaseClient();
      const { error } = await supabase.storage
        .from('generated-images')
        .remove([filename]);
      
      if (error) {
        console.error('❌ Failed to delete from Supabase Storage:', error);
      } else {
        console.log(`🗑️ Deleted ${filename} from Supabase Storage`);
      }
    } catch (error) {
      console.error('❌ Error deleting from Supabase Storage:', error);
    }
  }
  
  /**
   * Generate an image using OpenAI GPT-Image-1 and upload to Supabase
   */
  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage | null> {
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log('❌ OpenAI client not available for image generation');
        return null;
      }
      
      // Build the full prompt with style guidance
      const fullPrompt = this.buildPrompt(options);
      console.log(`🎨 Generating image with GPT-Image-1 model: ${fullPrompt.substring(0, 100)}...`);
      
      // Map quality values for GPT-Image-1 (supports: low, medium, high, auto)
      const gptQuality = (() => {
        switch (options.quality) {
          case "standard":
            return "medium";
          case "hd":
            return "high";
          case "low":
          case "medium":
          case "high":
          case "auto":
            return options.quality;
          default:
            return "medium";
        }
      })();
      
      const response = await Promise.race([
        openai.images.generate({
          model: "gpt-image-1",
          prompt: fullPrompt,
          n: 1,
          size: options.size || "1024x1024",
          quality: gptQuality
          // GPT-Image-1 doesn't support response_format parameter - always returns b64_json
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Image generation timeout')), 15000)
        )
      ]) as any;
      
      if (response.data && response.data[0]) {
        const imageData = response.data[0];
        
        // GPT-Image-1 always returns base64, not URL
        if (imageData.b64_json) {
          console.log(`✅ GPT-Image-1 generated successfully`);
          
          // Upload to Supabase Storage
          try {
            const base64Data = imageData.b64_json;
            const timestamp = Date.now();
            const filename = `football_image_${timestamp}.png`;
            
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            // Upload to Supabase Storage
            const supabaseUrl = await this.uploadToSupabase(imageBuffer, filename);
            
            if (supabaseUrl) {
              return {
                url: supabaseUrl,
                prompt: options.prompt,
                revisedPrompt: imageData.revised_prompt,
                filename: filename // Store filename for potential cleanup
              };
            } else {
              // Fallback: save locally if Supabase upload fails
              const imagePath = path.join(process.cwd(), 'public', 'generated-images', filename);
              const dir = path.dirname(imagePath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.writeFileSync(imagePath, imageBuffer);
              console.log(`📂 Fallback: Image saved locally: ${imagePath}`);
              
              // Create full URL for external access (needed for Telegram)
              const baseUrl = process.env.VERCEL_URL 
                ? `https://${process.env.VERCEL_URL}` 
                : process.env.NEXT_PUBLIC_APP_URL 
                ? process.env.NEXT_PUBLIC_APP_URL
                : 'http://localhost:3000';
              
              const fullUrl = `${baseUrl}/generated-images/${filename}`;
              console.log(`🌐 Generated full URL for Telegram: ${fullUrl}`);
              
              return {
                url: fullUrl,
                prompt: options.prompt,
                revisedPrompt: imageData.revised_prompt,
                filename: filename
              };
            }
          } catch (saveError) {
            console.log('⚠️ Failed to save GPT-Image-1 image:', saveError);
            return null;
          }
        }
      }
      
      console.log('❌ No image data returned from GPT-Image-1');
      return null;
      
    } catch (error) {
      console.error('❌ GPT-Image-1 generation failed:', error);
      // No fallback - only use GPT-Image-1
      console.log('⚠️ Image generation failed - GPT-Image-1 only mode');
      return null;
    }
  }
  
  /**
   * Cleanup image after successful telegram delivery
   */
  async cleanupImage(generatedImage: GeneratedImage): Promise<void> {
    if (generatedImage.filename) {
      // Delete from Supabase Storage
      await this.deleteFromSupabase(generatedImage.filename);
      
      // Also try to delete local file if it exists (fallback cases)
      const localPath = path.join(process.cwd(), 'public', 'generated-images', generatedImage.filename);
      try {
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log(`🗑️ Deleted local file: ${localPath}`);
        }
      } catch (error) {
        console.log('⚠️ Failed to delete local file:', error);
      }
    }
  }

  
  /**
   * 🧠 INTELLIGENT PROMPT GENERATION FROM CONTENT
   * Uses OpenAI to analyze content and generate optimal image prompts
   */
  async generatePromptFromContent(options: ContentAnalysisOptions): Promise<string> {
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log('❌ OpenAI client not available for prompt generation');
        return this.getFallbackPrompt(options);
      }

      console.log(`🧠 Generating intelligent prompt for ${options.contentType} content...`);

      // Create a specialized system prompt for football content analysis
      const systemPrompt = this.buildSystemPrompt(options.contentType, options.language || 'en');
      
      // Create user prompt with content analysis
      const userPrompt = this.buildUserPrompt(options);

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const generatedPrompt = response.choices[0]?.message?.content?.trim();
      
      if (generatedPrompt) {
        console.log(`✅ Generated intelligent prompt: ${generatedPrompt.substring(0, 100)}...`);
        return generatedPrompt;
      } else {
        console.log('⚠️ No prompt generated, using fallback');
        return this.getFallbackPrompt(options);
      }

    } catch (error) {
      console.error('❌ Error generating prompt from content:', error);
      return this.getFallbackPrompt(options);
    }
  }

  /**
   * 📝 Build system prompt for content analysis
   */
  private buildSystemPrompt(contentType: string, language: string): string {
    const basePrompt = `You are an expert football sports photographer and visual content creator. Your job is to analyze football content and generate precise, detailed prompts for realistic sports photography.

CRITICAL REQUIREMENTS:
- Generate prompts for PHOTOREALISTIC sports photography only
- Focus on authentic football scenes, stadiums, players, and fans
- Include specific visual elements mentioned in the content
- Make images look like professional sports journalism photos
- Always specify realistic stadium atmosphere and lighting

CONTENT TYPE: ${contentType.toUpperCase()}`;

    const typeSpecificGuidance = {
      'news': 'Generate prompts for breaking news photography - action shots, press conferences, stadium scenes, celebration moments',
      'betting': 'Generate prompts for analytical sports photography - tactical shots, player comparisons, statistical overlays, professional analysis scenes',
      'analysis': 'Generate prompts for in-depth match analysis photography - tactical formations, player positioning, strategic moments',
      'live': 'Generate prompts for live action photography - dynamic match moments, crowd reactions, real-time action shots',
      'poll': 'Generate prompts for fan engagement photography - supporter groups, voting scenarios, fan reactions',
      'daily_summary': 'Generate prompts for comprehensive match day photography - multiple game highlights, daily football atmosphere',
      'weekly_summary': 'Generate prompts for weekly football review photography - compilation scenes, league atmosphere, weekly highlights'
    };

    const languageGuidance = {
      'en': 'Focus on Premier League, Champions League atmosphere',
      'am': 'Include Ethiopian football culture, African stadium atmosphere, vibrant fan culture',
      'sw': 'Include East African football culture, Swahili region stadium atmosphere, community football spirit'
    };

    return `${basePrompt}

${typeSpecificGuidance[contentType as keyof typeof typeSpecificGuidance] || typeSpecificGuidance.news}

CULTURAL CONTEXT: ${languageGuidance[language as keyof typeof languageGuidance] || languageGuidance.en}

OUTPUT: Return ONLY the image prompt (no explanations, no quotes, just the prompt text).`;
  }

  /**
   * 📄 Build user prompt with content analysis
   */
  private buildUserPrompt(options: ContentAnalysisOptions): string {
    let prompt = `Analyze this football content and generate a detailed photorealistic image prompt:

TITLE: ${options.title || 'Football Content'}
CONTENT TYPE: ${options.contentType}
LANGUAGE: ${options.language || 'en'}`;

    if (options.teams && options.teams.length > 0) {
      prompt += `\nTEAMS: ${options.teams.join(' vs ')}`;
    }

    if (options.competition) {
      prompt += `\nCOMPETITION: ${options.competition}`;
    }

    prompt += `\n\nCONTENT TO ANALYZE:
"${options.content}"

Generate a detailed, photorealistic image prompt that captures the essence of this football content. Focus on:
1. Key visual elements mentioned in the content
2. Appropriate stadium/football setting
3. Realistic sports photography style
4. Cultural context for the language/region
5. Specific moments or scenarios described

The prompt should create an image that perfectly complements this content for social media sharing.`;

    return prompt;
  }

  /**
   * 🔄 Fallback prompt generation when AI is unavailable
   */
  private getFallbackPrompt(options: ContentAnalysisOptions): string {
    const { contentType, teams, competition, language } = options;
    
    const basePrompts = {
      'news': 'Professional football news photography, stadium press conference, breaking sports news scene',
      'betting': 'Professional sports betting analysis photography, tactical football scene, statistical overlay',
      'analysis': 'Professional football match analysis photography, tactical formation, strategic gameplay',
      'live': 'Live football action photography, dynamic match moment, stadium atmosphere',
      'poll': 'Football fan engagement photography, supporter group, interactive football scene',
      'daily_summary': 'Daily football highlights photography, multiple match scenes, sports summary',
      'weekly_summary': 'Weekly football review photography, league highlights, comprehensive sports coverage'
    };

    let prompt = basePrompts[contentType] || basePrompts.news;

    if (teams && teams.length > 0) {
      prompt += `, featuring ${teams.join(' vs ')}`;
    }

    if (competition) {
      prompt += `, ${competition} match`;
    }

    const culturalElements = {
      'en': ', Premier League atmosphere',
      'am': ', Ethiopian football culture, African stadium atmosphere',
      'sw': ', East African football culture, Swahili region stadium'
    };

    prompt += culturalElements[language || 'en'];
    
    return prompt;
  }

  /**
   * 🎨 MAIN FUNCTION: Generate image from content analysis
   */
  async generateImageFromContent(options: ContentAnalysisOptions & {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'low' | 'medium' | 'high' | 'auto' | 'standard' | 'hd';
  }): Promise<GeneratedImage | null> {
    console.log(`🎨 Generating image from ${options.contentType} content...`);
    
    // Step 1: Generate intelligent prompt from content
    const intelligentPrompt = await this.generatePromptFromContent(options);
    
    // Step 2: Generate image using the intelligent prompt
    return await this.generateImage({
      prompt: intelligentPrompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'high',
      language: options.language
    });
  }

  /**
   * Build a detailed prompt for ultra-realistic image generation
   */
  private buildPrompt(options: ImageGenerationOptions): string {
    const { prompt, language } = options;
    
    // Always use realistic style with strong realism keywords
    const realisticModifiers = 'photorealistic, real photo, professional sports photography, high resolution, sharp details, natural lighting, realistic stadium atmosphere, authentic football scene, documentary style, professional camera shot, 4K quality, no cartoon, no animation, no drawing, real people';
    
    // Add language-specific cultural elements
    const culturalElements = {
      en: '',
      am: ', Ethiopian football culture, African stadium atmosphere',
      sw: ', East African football culture, Swahili region stadium'
    };
    
    return `${prompt}, ${realisticModifiers}${culturalElements[language || 'en']}, professional sports media quality, looks like real sports news photo`;
  }
  
  /**
   * Generate an image for a specific football match
   */
  async generateMatchImage(
    homeTeam: string,
    awayTeam: string,
    competition: string,
    language: 'en' | 'am' | 'sw' = 'en'
  ): Promise<GeneratedImage | null> {
    // Always use English prompt for better GPT-Image-1 results
    const prompt = `Real football match photo: ${homeTeam} vs ${awayTeam} in ${competition}, authentic stadium scene, real players in action, professional sports photography`;
    
    return this.generateImage({
      prompt: prompt,
      quality: 'medium',
      language
    });
  }
  
  /**
   * Generate an image for news content
   */
  async generateNewsImage(
    actualContent: string,
    headline: string,
    language: 'en' | 'am' | 'sw' = 'en'
  ): Promise<GeneratedImage | null> {
    const keyTerms = this.extractKeyTermsFromContent(actualContent);
    
    // Always use English prompt for better GPT-Image-1 results
    const prompt = `Real football news photo: ${keyTerms}, authentic stadium scene, professional sports journalism photography, ${headline.substring(0, 50)}`;
    
    return this.generateImage({
      prompt: prompt,
      quality: 'medium',
      language
    });
  }
  
  /**
   * Extract key terms from content for better image generation
   */
  private extractKeyTermsFromContent(content: string): string {
    // Extract team names, competition names, and key football terms
    const footballTerms = ['goal', 'match', 'stadium', 'player', 'team', 'football', 'soccer', 'league', 'championship', 'tournament'];
    const words = content.toLowerCase().split(/\s+/);
    const relevantTerms = words.filter(word => 
      footballTerms.some(term => word.includes(term)) ||
      word.length > 6 // Likely team or competition names
    ).slice(0, 5);
    
    return relevantTerms.join(', ') || 'football match action, stadium atmosphere';
  }
  
  /**
   * Generate an atmospheric image for betting tips content - NO STATISTICS
   */
  async generateBettingImage(
    teams: string[],
    language: 'en' | 'am' | 'sw' = 'en'
  ): Promise<GeneratedImage | null> {
    const teamList = teams.join(' vs ');
    
    // תמונת אווירה של המשחק ללא נתונים או סטטיסטיקות
    const prompt = `Stadium atmosphere photo for ${teamList} football match: passionate fans in team colors, stadium crowd energy, team flags and banners, football culture celebration, dramatic stadium lighting, intense rivalry atmosphere, pure football passion, authentic football fan experience, NO numbers, NO statistics, NO data overlays, just pure football emotion and team spirit`;
    
    return this.generateImage({
      prompt: prompt,
      quality: 'high',
      language,
      size: '1024x1024'
    });
  }


  /**
   * Generate a poll/voting image
   */
  async generatePollImage(
    question: string,
    options: string[],
    language: 'en' | 'am' | 'sw' = 'en'
  ): Promise<GeneratedImage | null> {
    // Always use English prompt for better GPT-Image-1 results
    const prompt = `Real football fans voting photo: "${question}", authentic stadium crowd, real people holding voting signs, ${options.join(' vs ')}, professional sports photography`;
    
    return this.generateImage({
      prompt: prompt,
      quality: 'medium',
      language
    });
  }

  /**
   * Generate a professional coupon/promotional image
   */
  async generateCouponImage(
    brandName: string,
    title: string,
    offerText: string,
    brandColors: { primary: string },
    language: 'en' | 'am' | 'sw' = 'en'
  ): Promise<GeneratedImage | null> {
    // תמונת קופון מקצועית
    const prompt = `Professional promotional coupon design for ${brandName}: ${title} promotion with ${offerText}, modern coupon aesthetic, promotional graphics, discount badge design, brand colors ${brandColors.primary}, call-to-action elements, professional marketing design, high quality digital promotional material, clean modern design, attractive promotional layout`;
    
    return this.generateImage({
      prompt: prompt,
      quality: 'high',
      language,
      size: '1024x1024'
    });
  }
  
  /**
   * Generate an image for advanced match analysis - אווירה של קבוצות ללא נתונים
   */
  async generateAdvancedAnalysisImage(
    homeTeam: string,
    awayTeam: string,
    analysisContent: string,
    language: 'en' | 'am' | 'sw' = 'en'
  ): Promise<GeneratedImage | null> {
    // תמונה עם אווירה של הקבוצות - ללא נתונים ספציפיים
    const prompt = `Football match atmosphere illustration: "${homeTeam} VS ${awayTeam}", stadium atmosphere showing team spirit and rivalry, passionate fans in team colors, football culture and tradition, club atmosphere, dramatic rivalry mood, football passion, team identity and character, no specific numbers, no statistics, no scores, pure football emotion and club atmosphere`;
    
    return this.generateImage({
      prompt: prompt,
      quality: 'high',
      language,
      size: '1024x1024'
    });
  }

  private extractStatsFromAnalysis(analysisContent: string): string {
    const stats: string[] = [];
    
    // חיפוש נתונים סטטיסטיים
    if (analysisContent.includes('xG') || analysisContent.includes('Expected Goals')) {
      stats.push('Expected Goals (xG) charts');
    }
    if (analysisContent.match(/\d+%/)) {
      stats.push('percentage statistics displays');
    }
    if (analysisContent.includes('goals/game') || analysisContent.includes('scoring rate')) {
      stats.push('scoring rate analysis boards');
    }
    if (analysisContent.includes('win rate') || analysisContent.includes('probability')) {
      stats.push('win probability graphics');
    }
    if (analysisContent.includes('possession') || analysisContent.includes('passing')) {
      stats.push('possession and passing data');
    }
    if (analysisContent.includes('shots') || analysisContent.includes('accuracy')) {
      stats.push('shot accuracy metrics');
    }
    
    return stats.slice(0, 3).join(', ') || 'advanced football statistics';
  }

  private extractTacticalElements(analysisContent: string): string {
    const elements: string[] = [];
    
    // חיפוש אלמנטים טקטיים
    if (analysisContent.includes('formation') || analysisContent.match(/\d-\d-\d/)) {
      elements.push('formation analysis diagrams');
    }
    if (analysisContent.includes('pressure') || analysisContent.includes('ጫና')) {
      elements.push('pressure tactics visualization');
    }
    if (analysisContent.includes('midfield') || analysisContent.includes('የመሃል ሜዳ')) {
      elements.push('midfield battle heat maps');
    }
    if (analysisContent.includes('wing') || analysisContent.includes('attack')) {
      elements.push('attacking pattern overlays');
    }
    if (analysisContent.includes('defense') || analysisContent.includes('መከላከያ')) {
      elements.push('defensive structure analytics');
    }
    if (analysisContent.includes('style') || analysisContent.includes('playing')) {
      elements.push('playing style comparison');
    }
    
    return elements.slice(0, 3).join(', ') || 'tactical analysis elements';
  }

  /**
   * Generate a generic football image as fallback
   */
  async generateGenericFootballImage(
    language: 'en' | 'am' | 'sw' = 'en'
  ): Promise<GeneratedImage | null> {
    // Always use English prompt for better GPT-Image-1 results
    const prompt = 'Real football stadium photo at golden hour, authentic green pitch, real crowd atmosphere, fans cheering, professional sports photography';
    
    return this.generateImage({
      prompt: prompt,
      quality: 'medium',
      language
    });
  }
  
  /**
   * Get a fallback image URL if generation fails
   */
  getFallbackImage(type: string): string {
    const fallbacks = {
      match: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1024',
      news: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1024',
      betting: 'https://images.unsplash.com/photo-1569163139394-de4798d9c2c3?w=1024',
      poll: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1024',
      generic: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1024'
    };
    
    return fallbacks[type as keyof typeof fallbacks] || fallbacks.generic;
  }
}

// Export singleton instance
export const aiImageGenerator = new AIImageGenerator();