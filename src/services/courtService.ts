
import { databases } from '@/lib/appwrite';
import { Court } from '@/types/entities';
import { CourtStatus } from '@/types/tournament-enums';
import { courtFromBackend, courtToBackend } from '@/utils/adapters/courtAdapter';
import { COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

export const courtService = {
  async createCourt(court: Omit<Court, "id">): Promise<Court> {
    const payload = courtToBackend(court);
    
    try {
      const document = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        'unique()',
        payload
      );
      
      return courtFromBackend(document);
    } catch (error) {
      throw error;
    }
  },
  
  async getCourtsByTournament(tournamentId: string): Promise<Court[]> {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        [Query.equal('tournament_id', tournamentId), Query.orderAsc('name')]
      );
      
      return response.documents.map(courtFromBackend);
    } catch (error) {
      throw error;
    }
  },
  
  async updateCourt(id: string, courtData: Partial<Court>): Promise<Court> {
    const payload = courtToBackend(courtData);
    
    try {
      const document = await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        id,
        payload
      );
      
      return courtFromBackend(document);
    } catch (error) {
      throw error;
    }
  },
  
  async deleteCourt(id: string): Promise<void> {
    try {
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        id
      );
    } catch (error) {
      throw error;
    }
  }
};
