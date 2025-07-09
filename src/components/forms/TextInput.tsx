/**
 * 📝 Text Input Component
 * Reusable text input to standardize form inputs across the application
 * Provides consistent styling and error states
 */

import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'tel';
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  required = false,
  error = false,
  className = '',
  id,
  name,
  autoComplete,
  maxLength,
  minLength
}) => {
  const baseClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-150
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
  `;

  const stateClasses = error 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`${baseClasses} ${stateClasses} ${className}`}
      id={id}
      name={name}
      autoComplete={autoComplete}
      maxLength={maxLength}
      minLength={minLength}
    />
  );
};

export default TextInput;