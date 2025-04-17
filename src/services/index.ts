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