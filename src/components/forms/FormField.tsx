/**
 * 📝 Form Field Component
 * Reusable form field wrapper to replace 10+ duplicate implementations
 * Provides consistent styling and validation display patterns
 */

import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helpText,
  children,
  className = '',
  labelClassName = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      {children}
      
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField;