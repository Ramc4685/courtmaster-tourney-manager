
/**
 * Utility functions for transforming between camelCase and snake_case
 */

/**
 * Converts snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Converts camelCase to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Transforms an object's keys from snake_case to camelCase
 */
export function camelizeKeys<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    const camelKey = toCamelCase(key);
    result[camelKey] = value instanceof Object ? camelizeKeys(value) : value;
  });
  
  return result;
}

/**
 * Transforms an object's keys from camelCase to snake_case
 */
export function snakeizeKeys<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = value instanceof Object ? snakeizeKeys(value) : value;
  });
  
  return result;
}
