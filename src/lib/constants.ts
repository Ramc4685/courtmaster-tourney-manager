// Appwrite Configuration Constants
// This file contains all environment-based configuration to avoid circular dependencies

// Default values for local development if environment variables are not set
// For development, we'll use a mock/demo configuration that doesn't require external services
const isDevelopment = import.meta.env.DEV;
const hasAppwriteConfig = import.meta.env.VITE_APPWRITE_ENDPOINT && 
                         import.meta.env.VITE_APPWRITE_PROJECT_ID && 
                         import.meta.env.VITE_APPWRITE_DATABASE_ID;

// Only provide defaults in production or when explicitly configured
export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 
  (!isDevelopment ? 'https://cloud.appwrite.io/v1' : '');
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || 
  (!isDevelopment ? 'demo-project' : '');
export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 
  (!isDevelopment ? 'demo-database' : '');

// Debug logging for development
if (import.meta.env.DEV) {
  console.log('🔧 Appwrite Configuration Debug:');
  console.log('APPWRITE_ENDPOINT:', APPWRITE_ENDPOINT);
  console.log('APPWRITE_PROJECT_ID:', APPWRITE_PROJECT_ID);
  console.log('APPWRITE_DATABASE_ID:', APPWRITE_DATABASE_ID);
  console.log('Environment variables:');
  console.log('VITE_APPWRITE_ENDPOINT:', import.meta.env.VITE_APPWRITE_ENDPOINT);
  console.log('VITE_APPWRITE_PROJECT_ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
  console.log('VITE_APPWRITE_DATABASE_ID:', import.meta.env.VITE_APPWRITE_DATABASE_ID);
}

// Collection IDs - Use environment variables if available, otherwise use generated IDs from migration
export const COLLECTIONS = {
  PROFILES: import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || '68cd55330018a903b22a',
  TOURNAMENTS: import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || '68cd55330018b01f9c10',
  DIVISIONS: import.meta.env.VITE_APPWRITE_DIVISIONS_COLLECTION_ID || '68cd55330018b6c1bbad',
  CATEGORIES: import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID || 'categories',
  TEAMS: import.meta.env.VITE_APPWRITE_TEAMS_COLLECTION_ID || '68cd55330018b916fc2d',
  PLAYERS: import.meta.env.VITE_APPWRITE_PLAYERS_COLLECTION_ID || 'players',
  TEAM_MEMBERS: import.meta.env.VITE_APPWRITE_TEAM_MEMBERS_COLLECTION_ID || '68cd55330018b7eb66b9',
  REGISTRATIONS: import.meta.env.VITE_APPWRITE_REGISTRATIONS_COLLECTION_ID || '68cd55330018be3a8423',
  MATCHES: import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID || '68cd55330018b3fc88ed',
  COURTS: import.meta.env.VITE_APPWRITE_COURTS_COLLECTION_ID || '68cd55330018be4c6446',
  NOTIFICATIONS: import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || '68cd55330018b431ec3a',
  TOURNAMENT_MESSAGES: import.meta.env.VITE_APPWRITE_TOURNAMENT_MESSAGES_COLLECTION_ID || '68cd55330018b5b26ea1',
  PLAYER_HISTORY: import.meta.env.VITE_APPWRITE_PLAYER_HISTORY_COLLECTION_ID || '68cd55330018b7f6776a',
  // New collections for enhanced functionality
  TOURNAMENT_TEMPLATES: import.meta.env.VITE_APPWRITE_TOURNAMENT_TEMPLATES_COLLECTION_ID || '68cd55330018b18fe569',
  ANNOUNCEMENTS: import.meta.env.VITE_APPWRITE_ANNOUNCEMENTS_COLLECTION_ID || '68cd55330018b9b89bd0',
  WAIVERS: import.meta.env.VITE_APPWRITE_WAIVERS_COLLECTION_ID || '68cd55330018b58b4e4f',
  AUDIT_LOGS: import.meta.env.VITE_APPWRITE_AUDIT_LOGS_COLLECTION_ID || '68cd55330018bb6a5935',
  SYSTEM_SETTINGS: import.meta.env.VITE_APPWRITE_SYSTEM_SETTINGS_COLLECTION_ID || '68cd55330018b217bdd1',
};