import { databases, client } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { Tournament } from '../../types/tournament';
import { camelizeKeys, snakeizeKeys } from '@/utils/caseTransforms';
// Removed unused import

export class TournamentService {
  async createTournament(tournament: any): Promise<any> {
    try {
      // Convert to backend format
      const payload = snakeizeKeys(tournament);

      // Generate ID if not provided
      const documentId = payload.id || ID.unique();
      delete payload.id; // Remove ID as it's passed separately in Appwrite

      console.log('Attempting to insert tournament. Payload:', payload);
      console.log("Payload organizer_id:", payload.organizer_id);

      // Get environment variables
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';
      const tournamentCollectionId = import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || 'tournaments';

      // Create document in Appwrite
      const data = await databases.createDocument(
        databaseId,
        tournamentCollectionId,
        documentId,
        payload
      );

      // Convert response back to frontend format
      return camelizeKeys(data);
    } catch (error) {
      console.error('Error creating tournament in service:', error);
      throw error; // Re-throw the error
    }
  }

  async getTournament(id: string): Promise<any> {
    try {
      // Get environment variables
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';
      const tournamentCollectionId = import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || 'tournaments';
      
      const data = await databases.getDocument(
        databaseId,
        tournamentCollectionId,
        id
      );

      return camelizeKeys(data);
    } catch (error) {
      console.error('Error getting tournament:', error);
      throw error;
    }
  }

  async getTournaments(): Promise<any[]> {
    try {
      // Get environment variables
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';
      const tournamentCollectionId = import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || 'tournaments';
      
      const response = await databases.listDocuments(
        databaseId,
        tournamentCollectionId,
        [
          // Sort by created_at in descending order
          Query.orderDesc('$createdAt')
        ]
      );

      return response.documents.map(tournament => camelizeKeys(tournament));
    } catch (error) {
      console.error('Error getting tournaments in service:', error);
      // Return empty array in case of errors to prevent loop
      return []; 
    }
  }

  async updateTournament(tournament: any): Promise<any> {
    try {
      const payload = snakeizeKeys(tournament);
      const tournamentId = tournament.id;
      delete payload.id; // Remove ID as it's passed separately in Appwrite
      
      // Get environment variables
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';
      const tournamentCollectionId = import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || 'tournaments';
      
      const data = await databases.updateDocument(
        databaseId,
        tournamentCollectionId,
        tournamentId,
        payload
      );

      return camelizeKeys(data);
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  }

  async deleteTournament(id: string): Promise<void> {
    try {
      // Get environment variables
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';
      const tournamentCollectionId = import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || 'tournaments';
      
      await databases.deleteDocument(
        databaseId,
        tournamentCollectionId,
        id
      );
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  }

  async saveCurrentTournament(tournament: any): Promise<void> {
    // For temporary storage, we could use localStorage or sessionStorage
    try {
      localStorage.setItem('currentTournament', JSON.stringify(tournament));
    } catch (error) {
      console.error('Error saving current tournament:', error);
      throw error;
    }
  }

  // Removed private methods as they were not used and potentially outdated
}

// Export a singleton instance
export const tournamentService = new TournamentService();

