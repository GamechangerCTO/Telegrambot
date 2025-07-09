/**
 * 📝 Form Utilities
 * Shared form handling utilities to prevent duplication
 * Consolidates validation and form state management patterns
 */

export type ValidationErrors = { [key: string]: string };

/**
 * Generic form validation function
 * Replaces multiple duplicate validation implementations
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: ValidationRule<T>[]
): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const rule of rules) {
    const error = rule(data);
    if (error) {
      Object.assign(errors, error);
    }
  }

  return errors;
}

/**
 * Validation rule type
 */
export type ValidationRule<T> = (data: T) => ValidationErrors | null;

/**
 * Common validation rules
 */
export const validationRules = {
  required: <T>(field: keyof T, message?: string): ValidationRule<T> => 
    (data: T) => {
      const value = data[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        return { [field as string]: message || `${String(field)} is required` };
      }
      return null;
    },

  minLength: <T>(field: keyof T, length: number, message?: string): ValidationRule<T> =>
    (data: T) => {
      const value = data[field];
      if (value && typeof value === 'string' && value.trim().length < length) {
        return { [field as string]: message || `${String(field)} must be at least ${length} characters` };
      }
      return null;
    },

  email: <T>(field: keyof T, message?: string): ValidationRule<T> =>
    (data: T) => {
      const value = data[field];
      if (value && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { [field as string]: message || 'Invalid email format' };
        }
      }
      return null;
    },

  url: <T>(field: keyof T, message?: string): ValidationRule<T> =>
    (data: T) => {
      const value = data[field];
      if (value && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          return { [field as string]: message || 'Invalid URL format' };
        }
      }
      return null;
    },

  telegramChannel: <T>(field: keyof T, message?: string): ValidationRule<T> =>
    (data: T) => {
      const value = data[field];
      if (value && typeof value === 'string') {
        // Telegram channel format: @channel or channel
        const channelRegex = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
        if (!channelRegex.test(value)) {
          return { [field as string]: message || 'Invalid Telegram channel format' };
        }
      }
      return null;
    }
};

/**
 * Handle input change with error clearing
 * Replaces 4 duplicate handleInputChange implementations
 */
export function createInputChangeHandler<T extends Record<string, any>>(
  setFormData: (updater: (prev: T) => T) => void,
  setErrors: (updater: (prev: ValidationErrors) => ValidationErrors) => void
) {
  return (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field as string]: '' }));
  };
}

/**
 * Bot form validation rules
 * Standardizes bot creation/editing validation
 */
export function getBotValidationRules<T extends { name: string; telegram_bot_token: string }>(): ValidationRule<T>[] {
  return [
    validationRules.required('name'),
    validationRules.required('telegram_bot_token', 'Bot token is required'),
    validationRules.minLength('name', 2, 'Name must be at least 2 characters'),
  ];
}

/**
 * Channel form validation rules
 * Standardizes channel creation/editing validation
 */
export function getChannelValidationRules<T extends { 
  name: string; 
  telegram_channel_username: string; 
  language: string;
}>(): ValidationRule<T>[] {
  return [
    validationRules.required('name'),
    validationRules.required('telegram_channel_username', 'Channel username is required'),
    validationRules.required('language'),
    validationRules.minLength('name', 2, 'Name must be at least 2 characters'),
    validationRules.telegramChannel('telegram_channel_username'),
  ];
}

/**
 * Format Telegram channel username
 * Ensures consistent @ prefix handling
 */
export function formatTelegramUsername(username: string): string {
  if (!username) return username;
  return username.startsWith('@') ? username : `@${username}`;
}

/**
 * Remove @ prefix from Telegram username for storage
 */
export function cleanTelegramUsername(username: string): string {
  if (!username) return username;
  return username.startsWith('@') ? username.slice(1) : username;
}

/**
 * Check if form has errors
 */
export function hasFormErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(error => error.trim() !== '');
}

/**
 * Clear all form errors
 */
export function clearFormErrors(): ValidationErrors {
  return {};
}

/**
 * Get error message for field
 */
export function getFieldError(errors: ValidationErrors, field: string): string {
  return errors[field] || '';
}