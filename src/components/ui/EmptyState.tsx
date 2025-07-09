/**
 * 📭 Empty State Component
 * Reusable empty state to replace 5+ duplicate implementations
 * Provides consistent messaging and call-to-action patterns
 */

import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  icon?: React.ReactNode;
  className?: string;
}

const DefaultIcon: React.FC = () => (
  <svg 
    className="mx-auto h-16 w-16 text-gray-400" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
    />
  </svg>
);

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className = ''
}) => {
  const buttonClasses = action?.variant === 'secondary' 
    ? 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
    : 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent';

  return (
    <div className={`bg-white rounded-lg shadow-sm p-12 text-center ${className}`}>
      <div className="text-gray-400 mb-4">
        {icon || <DefaultIcon />}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className={`
            inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            transition-colors duration-200
            ${buttonClasses}
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;