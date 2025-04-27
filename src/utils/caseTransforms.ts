import { camelCase, snakeCase } from 'lodash';

/**
 * Transforms an object's keys from snake_case to camelCase
 */
export const camelizeKeys = (obj: Record<string, any>): Record<string, any> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    // Transform nested objects
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[camelCase(key)] = value.map(item => 
          typeof item === 'object' && item !== null ? camelizeKeys(item) : item
        );
      } else {
        result[camelCase(key)] = camelizeKeys(value);
      }
    } else {
      result[camelCase(key)] = value;
    }
    
    // Keep original snake_case key for compatibility
    result[key] = value;
  });
  
  return result;
};

/**
 * Transforms an object's keys from camelCase to snake_case
 */
export const snakeizeKeys = (obj: Record<string, any>): Record<string, any> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    // Skip already snake_cased keys to avoid duplication
    if (key.includes('_')) return;
    
    // Transform the value if needed
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[snakeCase(key)] = value.map(item => 
          typeof item === 'object' && item !== null ? snakeizeKeys(item) : item
        );
      } else {
        result[snakeCase(key)] = snakeizeKeys(value);
      }
    } else {
      result[snakeCase(key)] = value;
    }
  });
  
  return result;
};
