/**
 * Mobile-friendly validation utilities
 * Optimized for touch interfaces and mobile user experience
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MobileValidationOptions {
  showTooltips?: boolean;
  groupErrors?: boolean;
  maxErrorLength?: number;
  prioritizeFirstError?: boolean;
}

/**
 * Validates required fields with mobile-friendly error messages
 */
export const validateRequired = (
  value: any,
  fieldName: string,
  options: MobileValidationOptions = {}
): ValidationResult => {
  const errors: string[] = [];

  if (value === null || value === undefined || value === '') {
    const shortName = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
    errors.push(`${shortName} is required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
};

/**
 * Validates email with mobile-optimized messages
 */
export const validateEmail = (
  email: string,
  options: MobileValidationOptions = {}
): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors, warnings: [] };
  }

  // Simple email validation that works well on mobile
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Enter a valid email');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
};

/**
 * Validates phone numbers with international support
 */
export const validatePhone = (
  phone: string,
  options: MobileValidationOptions = {}
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!phone) {
    errors.push('Phone number is required');
    return { isValid: false, errors, warnings };
  }

  // Remove all non-digit characters for validation
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length < 10) {
    errors.push('Phone number too short');
  } else if (cleaned.length > 15) {
    errors.push('Phone number too long');
  }

  // Check for common patterns that might be invalid
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    warnings.push('US numbers should include area code');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates passwords with mobile-friendly criteria
 */
export const validatePassword = (
  password: string,
  options: MobileValidationOptions = {}
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors, warnings };
  }

  if (password.length < 8) {
    errors.push('Password must be 8+ characters');
  }

  if (!/[A-Z]/.test(password)) {
    warnings.push('Add an uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    warnings.push('Add a lowercase letter');
  }

  if (!/\d/.test(password)) {
    warnings.push('Add a number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    warnings.push('Add a special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates numeric inputs with range checking
 */
export const validateNumber = (
  value: any,
  fieldName: string,
  min?: number,
  max?: number,
  options: MobileValidationOptions = {}
): ValidationResult => {
  const errors: string[] = [];

  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors, warnings: [] };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    errors.push(`${fieldName} must be a number`);
    return { isValid: false, errors, warnings: [] };
  }

  if (min !== undefined && num < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    errors.push(`${fieldName} must be at most ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
};

/**
 * Validates team names for tournaments
 */
export const validateTeamName = (
  name: string,
  existingNames: string[] = [],
  options: MobileValidationOptions = {}
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Team name is required');
    return { isValid: false, errors, warnings };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    errors.push('Team name too short');
  }

  if (trimmed.length > 50) {
    errors.push('Team name too long');
  }

  // Check for duplicates (case-insensitive)
  const duplicate = existingNames.find(
    existing => existing.toLowerCase() === trimmed.toLowerCase()
  );

  if (duplicate) {
    errors.push('Team name already exists');
  }

  // Check for inappropriate characters for mobile input
  if (/[<>{}[\]\\|`~]/.test(trimmed)) {
    warnings.push('Avoid special characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates tournament dates
 */
export const validateTournamentDates = (
  startDate: Date | string,
  endDate: Date | string,
  options: MobileValidationOptions = {}
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!startDate) {
    errors.push('Start date is required');
  }

  if (!endDate) {
    errors.push('End date is required');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime())) {
    errors.push('Invalid start date');
  }

  if (isNaN(end.getTime())) {
    errors.push('Invalid end date');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  if (start >= end) {
    errors.push('End date must be after start');
  }

  // Warning for past dates
  if (start < now) {
    warnings.push('Start date is in the past');
  }

  // Warning for very long tournaments
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 30) {
    warnings.push('Tournament longer than 30 days');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates file uploads for mobile
 */
export const validateFileUpload = (
  file: File,
  allowedTypes: string[],
  maxSizeMB: number = 5,
  options: MobileValidationOptions = {}
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors, warnings };
  }

  // Check file type
  const fileType = file.type.toLowerCase();
  const isAllowedType = allowedTypes.some(type =>
    fileType.includes(type.toLowerCase())
  );

  if (!isAllowedType) {
    errors.push(`File must be: ${allowedTypes.join(', ')}`);
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    errors.push(`File too large (max ${maxSizeMB}MB)`);
  }

  // Warning for very small images
  if (fileType.includes('image') && sizeMB < 0.1) {
    warnings.push('Image file seems very small');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Combines multiple validation results into one
 */
export const combineValidationResults = (
  results: ValidationResult[],
  options: MobileValidationOptions = {}
): ValidationResult => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  results.forEach(result => {
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  // Limit errors for mobile display
  const maxErrors = options.maxErrorLength || 3;
  const displayErrors = options.prioritizeFirstError
    ? allErrors.slice(0, maxErrors)
    : allErrors.slice(0, maxErrors);

  if (allErrors.length > maxErrors) {
    displayErrors.push(`+${allErrors.length - maxErrors} more issues`);
  }

  return {
    isValid: allErrors.length === 0,
    errors: displayErrors,
    warnings: allWarnings.slice(0, 2) // Limit warnings too
  };
};

/**
 * Formats validation errors for mobile display
 */
export const formatValidationError = (
  result: ValidationResult,
  options: MobileValidationOptions = {}
): string => {
  if (result.isValid) return '';

  if (options.groupErrors && result.errors.length > 1) {
    return `${result.errors.length} issues found: ${result.errors[0]}...`;
  }

  return result.errors[0] || 'Validation failed';
};

/**
 * Creates a validation debouncer for mobile inputs
 */
export const createMobileValidator = (
  validator: (value: any) => ValidationResult,
  debounceMs: number = 300
) => {
  let timeoutId: NodeJS.Timeout;

  return (value: any, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, debounceMs);
  };
};