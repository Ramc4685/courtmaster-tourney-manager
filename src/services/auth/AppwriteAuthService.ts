import { account, databases, client } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import type { Profile } from '@/types/entities';
import { UserRole } from '@/types/tournament-enums';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface TournamentUserRole {
  userId: string;
  tournamentId: string;
  role: 'owner' | 'admin' | 'participant';
}

export class AppwriteAuthService {
  private tournamentRoles: TournamentUserRole[] = [];
  private databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';
  private profilesCollectionId = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || 'profiles';
  
  async getCurrentUser(): Promise<Profile | null> {
    try {
      console.log('[AppwriteAuthService] Attempting to get current user');
      
      // Get current session
      const session = await account.getSession('current');
      
      if (!session) {
        console.log('[AppwriteAuthService] No active session found');
        return null;
      }
      
      // Get current user
      const appwriteUser = await account.get();
      console.log('[AppwriteAuthService] Found user:', appwriteUser.$id);
      
      // Log the collection ID we're using
      console.log('[AppwriteAuthService] Using database ID:', this.databaseId);
      console.log('[AppwriteAuthService] Using profiles collection ID:', this.profilesCollectionId);
      
      // Get user profile from database
      try {
        console.log('[AppwriteAuthService] Querying for profile with user_id:', appwriteUser.$id);
        
        // First try getting profile by user's ID directly
        try {
          const directProfile = await databases.getDocument(
            this.databaseId,
            this.profilesCollectionId,
            appwriteUser.$id
          );
          console.log('[AppwriteAuthService] Profile found directly:', directProfile.$id);
          return directProfile as unknown as Profile;
        } catch (directError) {
          console.log('[AppwriteAuthService] Direct profile lookup failed, trying by query');
          
          // If direct lookup fails, try by query
          const profile = await databases.listDocuments(
            this.databaseId,
            this.profilesCollectionId,
            [Query.equal('user_id', appwriteUser.$id)]
          );
          
          if (profile.documents.length === 0) {
            console.log('[AppwriteAuthService] No profile found for user:', appwriteUser.$id);
            return null; // No profile creation - this should only happen in registration
          } else {
            console.log('[AppwriteAuthService] Profile found via query:', profile.documents[0].$id);
            return profile.documents[0] as unknown as Profile;
          }
        }
      } catch (error) {
        console.error('[AppwriteAuthService] Error fetching user profile:', error);
        return null; // No profile creation here
      }
    } catch (error) {
      console.error('[AppwriteAuthService] Error getting current user:', error);
      return null;
    }
  }

  async login(email: string, password: string): Promise<Profile | null> {
    try {
      await account.createEmailPasswordSession(email, password);
      // Add a small delay after login to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      return await this.getCurrentUser();
    } catch (error) {
      console.error('Error logging in:', error);
      
      // Enhance error handling for rate limiting
      if (error instanceof Error && error.message.includes('Rate limit')) {
        const enhancedError = new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
        // @ts-ignore - Adding custom property
        enhancedError.type = 'RATE_LIMIT';
        throw enhancedError;
      }
      
      throw error;
    }
  }

  async register(userData: UserCredentials & { name: string }): Promise<Profile | null> {
    try {
      const { email, password, name: rawName } = userData;
      let userId: string;
      let isDemo = false;
      
      // Validate name: ensure it's a non-empty string
      const name = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : 
                 email.split('@')[0]; // Fallback to username part of email if name is invalid
      
      console.log('[AppwriteAuthService] Registering new user:', email, 'with name:', name);
      
      // Special handling for demo admin user
      if (email === 'demoadmin@example.com') {
        console.log('[AppwriteAuthService] Creating demo admin user with admin privileges');
        isDemo = true;
      }

      // Ensure no active sessions before registration to prevent 'session is active' error
      try {
        console.log('[AppwriteAuthService] Logging out any existing sessions before registration');
        await this.logout();
      } catch (logoutError) {
        // Ignore logout errors as there might not be an active session
        console.log('[AppwriteAuthService] No active session to log out or logout failed:', logoutError);
      }

      try {
        // Create the user account with validated name
        const newUser = await account.create(ID.unique(), email, password, name);
        userId = newUser.$id;
        console.log('[AppwriteAuthService] User account created successfully:', userId);
        
        // Add a small delay after account creation to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create profile for the user
        const now = new Date().toISOString();
        const userProfile: Profile & { user_id: string } = {
          id: userId, // Using Appwrite user ID as profile ID for simplicity
          user_id: userId, // Add user_id field to match collection schema
          full_name: name,
          display_name: name,
          avatar_url: '',
          phone: '',
          role: isDemo ? UserRole.ADMIN : UserRole.PLAYER, // Admin role for demo user, Player for others
          created_at: now,
          updated_at: now,
          email: email,
        };
        
        console.log('[AppwriteAuthService] Creating user profile with ID:', userId);
        
        try {
          // Create the profile document
          const createdProfile = await databases.createDocument(
            this.databaseId,
            this.profilesCollectionId,
            userId,
            userProfile
          );
          
          console.log('[AppwriteAuthService] Profile created successfully:', createdProfile.$id);
          
          // Log in the user
          await account.createEmailPasswordSession(email, password);
          
          return createdProfile as unknown as Profile;
        } catch (profileError) {
          console.error('[AppwriteAuthService] Error creating profile:', profileError);
          // Even if profile creation fails, we've still created a user, so log them in
          await account.createEmailPasswordSession(email, password);
          return null;
        }
      } catch (error: any) {
        // Check if the error is due to rate limiting
        if (error instanceof Error && error.message.includes('Rate limit')) {
          const enhancedError = new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
          // @ts-ignore - Adding custom property
          enhancedError.type = 'RATE_LIMIT';
          throw enhancedError;
        }
        
        // Check if user already exists
        if (error instanceof Error && error.message.includes('user with the same email already exists')) {
          console.log('[AppwriteAuthService] User already exists, attempting to log in instead');
          // Try to log in instead
          await new Promise(resolve => setTimeout(resolve, 500)); // Add delay before login attempt
          return await this.login(email, password);
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password` // URL to redirect to after recovery
      );
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  async updateUserProfile(user: Partial<Profile>): Promise<Profile | null> {
    try {
      const currentUser = await this.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Get the document ID from database
      const profiles = await databases.listDocuments(
        this.databaseId,
        this.profilesCollectionId,
        [Query.equal('id', currentUser.id)]
      );
      
      if (profiles.documents.length === 0) {
        throw new Error('Profile not found');
      }
      
      const profileId = profiles.documents[0].$id;
      
      // Update the profile
      const updatedProfile = await databases.updateDocument(
        this.databaseId,
        this.profilesCollectionId,
        profileId,
        {
          ...user,
          updated_at: new Date().toISOString()
        }
      );
      
      return updatedProfile as unknown as Profile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  // Tournament role management
  // These functions are currently using in-memory storage
  // In a production environment, these would be stored in the database
  
  isTournamentAdmin(userId: string, tournamentId: string): boolean {
    return this.tournamentRoles.some(
      role => role.userId === userId && 
              role.tournamentId === tournamentId && 
              (role.role === 'admin' || role.role === 'owner')
    );
  }

  hasRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    return this.tournamentRoles.some(
      r => r.userId === userId && r.tournamentId === tournamentId && r.role === role
    );
  }

  addTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    if (!this.hasRole(userId, tournamentId, role)) {
      this.tournamentRoles.push({ userId, tournamentId, role });
      return true;
    }
    return false;
  }

  removeTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    const initialLength = this.tournamentRoles.length;
    this.tournamentRoles = this.tournamentRoles.filter(
      r => !(r.userId === userId && r.tournamentId === tournamentId && r.role === role)
    );
    return initialLength !== this.tournamentRoles.length;
  }
}

// Export a singleton instance
export const appwriteAuthService = new AppwriteAuthService();
