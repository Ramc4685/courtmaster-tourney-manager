
import { databases } from '@/lib/appwrite';
import { Profile } from '@/types/entities';
import { AppwriteException, Query } from 'appwrite';
import { APPWRITE_CONFIG } from '@/config/appwrite';

export class ProfileService {
  private readonly dbId = APPWRITE_CONFIG.databaseId;
  private readonly collectionId = APPWRITE_CONFIG.profilesCollectionId;

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const response = await databases.listDocuments<Profile>(
        this.dbId,
        this.collectionId,
        [Query.equal('user_id', userId), Query.limit(1)]
      );

      if (response.documents.length > 0) {
        return response.documents[0];
      }
      return null;
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        return null; // Profile not found is not a critical error
      }
      console.error('[ProfileService] Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(profileId: string, profileData: Partial<Omit<Profile, '$id' | '$collectionId' | '$databaseId' | '$createdAt' | '$updatedAt' | '$permissions'>>): Promise<Profile> {
    try {
      const updatedDocument = await databases.updateDocument<Profile>(
        this.dbId,
        this.collectionId,
        profileId,
        profileData
      );
      return updatedDocument;
    } catch (error) {
      console.error('[ProfileService] Error updating profile:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const profileService = new ProfileService();
