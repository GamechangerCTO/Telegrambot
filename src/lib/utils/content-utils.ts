/**
 * 📝 Content Utilities
 * Shared utilities for content types and related functions
 * Based on COMPLETE-REBUILD-PROMPT.md content type specifications
 */

export type ContentType = 'live' | 'betting' | 'news' | 'polls' | 'analysis' | 'coupons' | 'memes' | 'daily_summary' | 'weekly_summary';

export interface ContentTypeInfo {
  value: ContentType;
  label: string;
  description: string;
  priority: number;
}

/**
 * Content types configuration based on system architecture
 * Priority levels from COMPLETE-REBUILD-PROMPT.md
 */
export const CONTENT_TYPES: ContentTypeInfo[] = [
  { value: 'live', label: 'Live Updates', description: 'Real-time match updates', priority: 1 },
  { value: 'betting', label: 'Betting Tips', description: 'AI-powered betting recommendations', priority: 2 },
  { value: 'news', label: 'News Articles', description: 'RSS-based news summaries', priority: 3 },
  { value: 'polls', label: 'Polls & Surveys', description: 'Interactive fan engagement', priority: 4 },
  { value: 'analysis', label: 'Match Analysis', description: 'Deep match breakdowns', priority: 5 },
  { value: 'coupons', label: 'Promotional Coupons', description: 'Affiliate promotions', priority: 6 },
  { value: 'memes', label: 'Entertainment Content', description: 'Memes and fun content', priority: 7 },
  { value: 'daily_summary', label: 'Daily Summaries', description: 'Comprehensive daily reports', priority: 8 },
  { value: 'weekly_summary', label: 'Weekly Summaries', description: 'Weekly roundup reports', priority: 8 }
];

/**
 * Get display text for content types
 * Replaces 3 duplicate implementations across components
 */
export function getContentTypesDisplay(enabledTypes: string[]): string {
  if (!enabledTypes || enabledTypes.length === 0) {
    return 'None selected';
  }

  const typeLabels = enabledTypes
    .map(type => CONTENT_TYPES.find(ct => ct.value === type)?.label || type)
    .join(', ');

  return typeLabels;
}

/**
 * Get content type info by value
 */
export function getContentTypeInfo(type: ContentType): ContentTypeInfo | undefined {
  return CONTENT_TYPES.find(ct => ct.value === type);
}

/**
 * Get content type options for forms/selects
 */
export function getContentTypeOptions() {
  return CONTENT_TYPES.map(type => ({
    value: type.value,
    label: type.label,
    description: type.description
  }));
}

/**
 * Validate if a content type is supported
 */
export function isValidContentType(type: string): type is ContentType {
  return CONTENT_TYPES.some(ct => ct.value === type);
}

/**
 * Get content types sorted by priority
 */
export function getContentTypesByPriority(): ContentTypeInfo[] {
  return [...CONTENT_TYPES].sort((a, b) => a.priority - b.priority);
}

/**
 * Get high priority content types (betting, live, news)
 */
export function getHighPriorityContentTypes(): ContentType[] {
  return CONTENT_TYPES
    .filter(type => type.priority <= 3)
    .map(type => type.value);
}

/**
 * Get content type display name
 */
export function getContentTypeLabel(type: ContentType): string {
  const typeInfo = getContentTypeInfo(type);
  return typeInfo?.label || type;
}

/**
 * Get enabled content types from array with validation
 */
export function validateAndFilterContentTypes(types: string[]): ContentType[] {
  return types.filter((type): type is ContentType => isValidContentType(type));
}