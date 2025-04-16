import type { Profile, Tournament, Division, Court, Registration, Match, Notification } from '@/types/entities';

// Helper function to convert snake_case to camelCase
const toCamelCase = (str: string) => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

// Helper function to convert camelCase to snake_case
const toSnakeCase = (str: string) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

// Generic object transformer
const transformObject = (obj: any, keyTransformer: (key: string) => string) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const transformed: any = Array.isArray(obj) ? [] : {};
  
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = keyTransformer(key);
    transformed[newKey] = value;
  });
  
  return transformed;
};

export const transformers = {
  profile: {
    toAPI: (profile: Partial<Profile>) => transformObject(profile, toSnakeCase),
    fromAPI: (data: any): Profile => transformObject(data, toCamelCase) as Profile,
  },
  tournament: {
    toAPI: (tournament: Partial<Tournament>) => transformObject(tournament, toSnakeCase),
    fromAPI: (data: any): Tournament => transformObject(data, toCamelCase) as Tournament,
  },
  division: {
    toAPI: (division: Partial<Division>) => transformObject(division, toSnakeCase),
    fromAPI: (data: any): Division => transformObject(data, toCamelCase) as Division,
  },
  court: {
    toAPI: (court: Partial<Court>) => transformObject(court, toSnakeCase),
    fromAPI: (data: any): Court => transformObject(data, toCamelCase) as Court,
  },
  registration: {
    toAPI: (registration: Partial<Registration>) => transformObject(registration, toSnakeCase),
    fromAPI: (data: any): Registration => transformObject(data, toCamelCase) as Registration,
  },
  match: {
    toAPI: (match: Partial<Match>) => transformObject(match, toSnakeCase),
    fromAPI: (data: any): Match => transformObject(data, toCamelCase) as Match,
  },
  notification: {
    toAPI: (notification: Partial<Notification>) => transformObject(notification, toSnakeCase),
    fromAPI: (data: any): Notification => transformObject(data, toCamelCase) as Notification,
  },
}; 