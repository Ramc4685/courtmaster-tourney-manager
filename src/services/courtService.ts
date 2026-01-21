
import { databases, APPWRITE_DATABASE_ID } from '@/lib/appwrite';
import { Court } from '@/types/entities';
import { CourtStatus } from '@/types/tournament-enums';
import { courtFromBackend, courtToBackend } from '@/utils/adapters/courtAdapter';
import { COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

export const courtService = {
  async createCourt(court: Omit<Court, "id">): Promise<Court> {
    const payload = courtToBackend(court);

    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.COURTS,
      'unique()',
      payload
    );

    return courtFromBackend(document);
  },

  async getCourtsByTournament(tournamentId: string): Promise<Court[]> {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.COURTS,
      [Query.equal('tournament_id', tournamentId), Query.orderAsc('name')]
    );

    return response.documents.map(courtFromBackend);
  },

  async updateCourt(id: string, courtData: Partial<Court>): Promise<Court> {
    const payload = courtToBackend(courtData);

    const document = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.COURTS,
      id,
      payload
    );

    return courtFromBackend(document);
  },

  async deleteCourt(id: string): Promise<void> {
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.COURTS,
      id
    );
  }
};
