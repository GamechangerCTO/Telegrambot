/**
 * 🔄 Loading Spinner Component
 * Reusable loading spinner to replace 8+ duplicate implementations
 * Based on consistent design patterns across the dashboard
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-32 w-32',
  xl: 'h-48 w-48'
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  fullScreen = false,
  message,
  className = ''
}) => {
  const content = (
    <div className={`text-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-gray-600 mt-4 text-sm">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;