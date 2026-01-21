import { TournamentService } from './tournament/TournamentService';
import { APIService } from './APIService';
import { storageService } from './storage/StorageService';

// Initialize services
export const tournamentService = new TournamentService();
export const apiService = new APIService();

// Export service instances
export {
  storageService
};

// Export service types
export type { TournamentService, APIService };

// === MATCH SERVICE CONDITIONAL EXPORTS ===
// Export common interfaces
export type { IMatchService, UpcomingMatchInfo } from "./IMatchService";

// Backend selection based on environment variables or build config
// Currently defaulting to Appwrite implementation
export { matchService, MatchService } from "./matchService.appwrite";

// Future backends can be added here with a factory pattern:
// const BACKEND = process.env.REACT_APP_BACKEND || 'appwrite';
// Export the appropriate service based on backend configuration 