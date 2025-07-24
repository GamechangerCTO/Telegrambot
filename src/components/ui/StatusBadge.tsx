/**
 * 🏷️ Status Badge Component
 * Reusable status badge to replace 8+ duplicate implementations
 * Provides consistent styling for active/inactive states
 */

import React from 'react';

interface StatusBadgeProps {
  status: boolean | 'active' | 'inactive' | 'enabled' | 'disabled';
  activeText?: string;
  inactiveText?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  activeText = 'Active',
  inactiveText = 'Inactive',
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  // Normalize status to boolean
  const isActive = typeof status === 'boolean' 
    ? status 
    : status === 'active' || status === 'enabled';

  const displayText = isActive ? activeText : inactiveText;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const getVariantClasses = () => {
    if (variant === 'success' || (variant === 'default' && isActive)) {
      return 'bg-green-100 text-green-800 border border-green-200';
    }
    if (variant === 'error' || (variant === 'default' && !isActive)) {
      return 'bg-red-100 text-red-800 border border-red-200';
    }
    if (variant === 'warning') {
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${className}
      `}
      title={displayText}
    >
      {displayText}
    </span>
  );
};

export { StatusBadge };
export default StatusBadge;