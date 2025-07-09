/**
 * 🎨 Modern Card Components
 * Colorful, professional cards with gradients and animations
 */

'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'outlined' | 'elevated';
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan' | 'pink' | 'indigo';
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  color = 'blue',
  hover = true,
  padding = 'md',
  onClick
}) => {
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    gradient: getGradientClasses(color),
    outlined: `border-2 border-${color}-200 bg-${color}-50/50`,
    elevated: 'bg-white shadow-lg border border-gray-100'
  };

  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : '';

  return (
    <div 
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

function getGradientClasses(color: string): string {
  const gradients = {
    blue: 'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
    purple: 'bg-gradient-to-br from-purple-500 to-pink-600 text-white',
    green: 'bg-gradient-to-br from-green-500 to-teal-600 text-white',
    orange: 'bg-gradient-to-br from-orange-500 to-red-600 text-white',
    red: 'bg-gradient-to-br from-red-500 to-pink-600 text-white',
    cyan: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white',
    pink: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white',
    indigo: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
  };
  return gradients[color as keyof typeof gradients] || gradients.blue;
}

// Statistics Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  icon?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan';
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-purple-600',
    purple: 'from-purple-500 to-pink-600',
    green: 'from-green-500 to-teal-600',
    orange: 'from-orange-500 to-red-600',
    red: 'from-red-500 to-pink-600',
    cyan: 'from-cyan-500 to-blue-600'
  };

  return (
    <Card variant="elevated" hover className={className}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          
          {change && (
            <div className="flex items-center space-x-1">
              <span className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${change.type === 'increase' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
                }
              `}>
                <span className="mr-1">
                  {change.type === 'increase' ? '↗️' : '↘️'}
                </span>
                {Math.abs(change.value)}%
              </span>
              {change.period && (
                <span className="text-xs text-gray-500">{change.period}</span>
              )}
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`
            w-12 h-12 rounded-xl bg-gradient-to-r ${colorClasses[color]}
            flex items-center justify-center text-white text-xl
          `}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// Feature Card Component
interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  color = 'blue',
  action,
  className = ''
}) => {
  const colorClasses = {
    blue: { gradient: 'from-blue-500 to-purple-600', text: 'text-blue-600', bg: 'bg-blue-50' },
    purple: { gradient: 'from-purple-500 to-pink-600', text: 'text-purple-600', bg: 'bg-purple-50' },
    green: { gradient: 'from-green-500 to-teal-600', text: 'text-green-600', bg: 'bg-green-50' },
    orange: { gradient: 'from-orange-500 to-red-600', text: 'text-orange-600', bg: 'bg-orange-50' },
    red: { gradient: 'from-red-500 to-pink-600', text: 'text-red-600', bg: 'bg-red-50' },
    cyan: { gradient: 'from-cyan-500 to-blue-600', text: 'text-cyan-600', bg: 'bg-cyan-50' }
  };

  const colors = colorClasses[color];

  return (
    <Card variant="elevated" hover className={className}>
      <div className="text-center">
        {icon && (
          <div className={`
            w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r ${colors.gradient}
            flex items-center justify-center text-white text-2xl
          `}>
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        {action && (
          <button
            onClick={action.onClick}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors duration-200
              ${colors.text} ${colors.bg} hover:opacity-80
            `}
          >
            {action.label}
          </button>
        )}
      </div>
    </Card>
  );
};

// Action Card Component
interface ActionCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan';
  estimatedTime?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon,
  color = 'blue',
  estimatedTime,
  onClick,
  disabled = false,
  className = ''
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-purple-600',
    purple: 'from-purple-500 to-pink-600',
    green: 'from-green-500 to-teal-600',
    orange: 'from-orange-500 to-red-600',
    red: 'from-red-500 to-pink-600',
    cyan: 'from-cyan-500 to-blue-600'
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        relative overflow-hidden rounded-xl bg-gradient-to-r ${colorClasses[color]}
        ${onClick && !disabled ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        transition-all duration-200 ${className}
      `}
    >
      <div className="p-6 text-white">
        <div className="flex items-center space-x-4">
          {icon && (
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              {icon}
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            {subtitle && (
              <p className="text-white/80 text-sm mb-1">{subtitle}</p>
            )}
            {estimatedTime && (
              <p className="text-white/60 text-xs">⏱️ {estimatedTime}</p>
            )}
          </div>
          
          {onClick && !disabled && (
            <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-200">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
    </div>
  );
};

// Simple Card Components for automation dashboard
interface SimpleCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SimpleCard: React.FC<SimpleCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

// Card Header Component
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

// Card Title Component
interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
};

// Card Content Component
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

// Export Card as named export for use in other components
export { Card };

export default Card;