import { camelCase, snakeCase } from 'lodash';

/**
 * Transforms an object's keys from snake_case to camelCase, recursively.
 */
export const camelizeKeys = (obj: Record<string, any>): Record<string, any> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const result: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = camelCase(key);
    // Transform nested objects
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[newKey] = value.map(item =>
          typeof item === 'object' && item !== null ? camelizeKeys(item) : item
        );
      } else {
        result[newKey] = camelizeKeys(value);
      }
    } else {
      result[newKey] = value;
    }
  });

  return result;
};

/**
 * Transforms an object's keys from camelCase to snake_case, recursively.
 */
export const snakeizeKeys = (obj: Record<string, any>): Record<string, any> => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const result: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = snakeCase(key);
    // Transform the value if needed
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[newKey] = value.map(item =>
          typeof item === 'object' && item !== null ? snakeizeKeys(item) : item
        );
      } else {
        result[newKey] = snakeizeKeys(value);
      }
    } else {
      result[newKey] = value;
    }
  });

  return result;
};
