/**
 * 🌐 Language Indicator Component
 * Simple English-only indicator for professional international teams
 */

'use client';

import React from 'react';

interface LanguageIndicatorProps {
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

const LanguageIndicator: React.FC<LanguageIndicatorProps> = ({
  variant = 'default',
  className = ''
}) => {
  if (variant === 'icon-only') {
    return (
      <div className={`flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-700 rounded-full text-sm font-medium ${className}`}>
        🌐
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium ${className}`}>
        🌐 EN
      </div>
    );
  }

  return (
    <div className={`px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium ${className}`}>
      🇺🇸 English
    </div>
  );
};

export default LanguageIndicator;