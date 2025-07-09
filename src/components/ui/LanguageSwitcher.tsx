/**
 * 🌐 Language Switcher Component
 * Modern, colorful language switching for UI interface
 * Professional dropdown with animated transitions
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/useI18n';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'icon-only';
  showFlags?: boolean;
  className?: string;
}

// Language flag emojis and colors
const languageConfig = {
  en: { 
    flag: '🇺🇸', 
    color: 'from-blue-500 to-purple-600',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700'
  },
  am: { 
    flag: '🇪🇹', 
    color: 'from-green-500 to-yellow-500',
    borderColor: 'border-green-500',
    textColor: 'text-green-700'
  },
  sw: { 
    flag: '🇹🇿', 
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500',
    textColor: 'text-cyan-700'
  }
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'default',
  showFlags = true,
  className = ''
}) => {
  const { language, setLanguage, availableLanguages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLanguage = availableLanguages.find(lang => lang.code === language);
  const currentConfig = languageConfig[language];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as any);
    setIsOpen(false);
  };

  if (variant === 'icon-only') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-10 h-10 rounded-full border-2 ${currentConfig.borderColor}
            bg-gradient-to-r ${currentConfig.color}
            flex items-center justify-center text-white font-semibold
            hover:shadow-lg transform hover:scale-105 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          `}
          aria-label={`Current language: ${currentLanguage?.nativeName}`}
        >
          {showFlags ? currentConfig.flag : language.toUpperCase()}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in-0 zoom-in-95">
            {availableLanguages.map((lang) => {
              const config = languageConfig[lang.code];
              const isSelected = lang.code === language;
              
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3
                    transition-colors duration-150 ${isSelected ? 'bg-blue-50' : ''}
                  `}
                >
                  <span className="text-xl">{config.flag}</span>
                  <div className="flex-1">
                    <div className={`font-medium ${isSelected ? config.textColor : 'text-gray-900'}`}>
                      {lang.nativeName}
                    </div>
                    <div className="text-sm text-gray-500">{lang.name}</div>
                  </div>
                  {isSelected && (
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            px-3 py-2 rounded-lg border-2 ${currentConfig.borderColor}
            bg-white hover:bg-gray-50 flex items-center space-x-2
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          `}
        >
          <span className="text-lg">{currentConfig.flag}</span>
          <span className={`font-medium ${currentConfig.textColor}`}>
            {currentLanguage?.nativeName}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in-0 zoom-in-95">
            {availableLanguages.map((lang) => {
              const config = languageConfig[lang.code];
              const isSelected = lang.code === language;
              
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3
                    transition-colors duration-150 ${isSelected ? 'bg-blue-50' : ''}
                  `}
                >
                  <span className="text-xl">{config.flag}</span>
                  <div className="flex-1">
                    <div className={`font-medium ${isSelected ? config.textColor : 'text-gray-900'}`}>
                      {lang.nativeName}
                    </div>
                    <div className="text-sm text-gray-500">{lang.name}</div>
                  </div>
                  {isSelected && (
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default variant - full featured
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-4 py-3 rounded-xl border-2 ${currentConfig.borderColor}
          bg-gradient-to-r ${currentConfig.color} text-white
          hover:shadow-lg transform hover:scale-105 transition-all duration-200
          flex items-center space-x-3 min-w-[180px]
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `}
      >
        <span className="text-xl">{currentConfig.flag}</span>
        <div className="flex-1 text-left">
          <div className="font-semibold">{currentLanguage?.nativeName}</div>
          <div className="text-xs opacity-90">{currentLanguage?.name}</div>
        </div>
        <svg 
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in-0 zoom-in-95">
          <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
            Choose Interface Language
          </div>
          
          {availableLanguages.map((lang) => {
            const config = languageConfig[lang.code];
            const isSelected = lang.code === language;
            
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3
                  transition-all duration-150 group
                  ${isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-lg bg-gradient-to-r ${config.color} 
                  flex items-center justify-center text-white font-semibold text-lg
                  group-hover:scale-110 transition-transform duration-200
                `}>
                  {config.flag}
                </div>
                
                <div className="flex-1">
                  <div className={`font-medium ${isSelected ? config.textColor : 'text-gray-900'}`}>
                    {lang.nativeName}
                  </div>
                  <div className="text-sm text-gray-500">{lang.name}</div>
                </div>
                
                {isSelected && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`} />
                    <span className="text-xs font-medium text-blue-600">Active</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;