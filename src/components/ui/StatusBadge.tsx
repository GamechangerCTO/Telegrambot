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

  // Size classes
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  // Color variants
  const getVariantClasses = () => {
    if (variant === 'success') {
      return isActive 
        ? 'bg-emerald-100 text-emerald-800' 
        : 'bg-gray-100 text-gray-600';
    }
    
    if (variant === 'warning') {
      return isActive 
        ? 'bg-amber-100 text-amber-800' 
        : 'bg-gray-100 text-gray-600';
    }
    
    if (variant === 'error') {
      return isActive 
        ? 'bg-red-100 text-red-800' 
        : 'bg-gray-100 text-gray-600';
    }
    
    // Default variant
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const displayText = isActive ? activeText : inactiveText;

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium
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

export default StatusBadge;