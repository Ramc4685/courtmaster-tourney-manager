import { Client, Account, Databases, ID, Teams, Storage, Models } from 'appwrite';

// Define a simplified User type until we update the user types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isVerified: boolean;
  role: string;
  avatarUrl?: string;
}

// Default values for local development if environment variables are not set
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6892291d0017aacbddfb';
const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default';

// Collection IDs - Use environment variables if available, otherwise use default string IDs
export const COLLECTIONS = {
  PROFILES: import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || 'profiles',
  TOURNAMENTS: import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || '68922b290000e9ac3ec4',
  DIVISIONS: import.meta.env.VITE_APPWRITE_DIVISIONS_COLLECTION_ID || 'divisions',
  TEAMS: import.meta.env.VITE_APPWRITE_TEAMS_COLLECTION_ID || 'teams',
  TEAM_MEMBERS: import.meta.env.VITE_APPWRITE_TEAM_MEMBERS_COLLECTION_ID || 'team_members',
  REGISTRATIONS: import.meta.env.VITE_APPWRITE_REGISTRATIONS_COLLECTION_ID || 'registrations',
  MATCHES: import.meta.env.VITE_APPWRITE_MATCHES_COLLECTION_ID || 'matches',
  COURTS: import.meta.env.VITE_APPWRITE_COURTS_COLLECTION_ID || 'courts',
  NOTIFICATIONS: import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications',
  TOURNAMENT_MESSAGES: import.meta.env.VITE_APPWRITE_TOURNAMENT_MESSAGES_COLLECTION_ID || 'tournament_messages',
  PLAYER_HISTORY: import.meta.env.VITE_APPWRITE_PLAYER_HISTORY_COLLECTION_ID || 'player_history',
};

// Initialize the Appwrite client
export const client = new Client();

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const teams = new Teams(client);
export const storage = new Storage(client);
// Create a proper realtime subscription interface using Appwrite's realtime API
export const realtime = {
  subscribe: (channel: string, callback: (response: any) => void) => {
    console.log(`Subscribing to channel: ${channel}`);
    
    // Parse the channel string to determine what to subscribe to
    // Format: collection.{collectionId}.document.{documentId}
    const parts = channel.split('.');
    
    // Determine the subscription type based on the channel format
    let unsubscribe: () => void;
    
    if (parts.length >= 4 && parts[0] === 'collection') {
      const collectionId = parts[1];
      
      if (parts[2] === 'document' && parts[3]) {
        // Document-specific subscription
        const documentId = parts[3];
        unsubscribe = client.subscribe(`databases.${APPWRITE_DATABASE_ID}.collections.${collectionId}.documents.${documentId}`, (response) => {
          callback({
            event: response.events[0]?.split('.').pop() || 'unknown',
            payload: response.payload
          });
        });
      } else {
        // Collection-level subscription (all documents)
        unsubscribe = client.subscribe(`databases.${APPWRITE_DATABASE_ID}.collections.${collectionId}.documents`, (response) => {
          callback({
            event: response.events[0]?.split('.').pop() || 'unknown',
            payload: response.payload
          });
        });
      }
    } else if (channel.startsWith('user-')) {
      // User-specific subscriptions (e.g., notifications)
      const userId = channel.replace('user-', '');
      unsubscribe = client.subscribe(`databases.${APPWRITE_DATABASE_ID}.collections.notifications.documents`, (response) => {
        // Only forward events for the specific user
        const payload = response.payload as Record<string, any>;
        if (payload?.user_id === userId) {
          callback({
            event: response.events[0]?.split('.').pop() || 'unknown',
            payload: response.payload
          });
        }
      });
    } else {
      // Default case - just log and return dummy unsubscribe
      console.warn(`Unknown channel format: ${channel}`);
      return () => {
        console.log(`Unsubscribing from unknown channel: ${channel}`);
      };
    }
    
    return unsubscribe;
  }
};

// Convert Appwrite user to application user model
const convertAppwriteUser = (appwriteUser: Models.User<Models.Preferences>): User => {
  return {
    id: appwriteUser.$id,
    email: appwriteUser.email,
    name: appwriteUser.name,
    createdAt: appwriteUser.$createdAt,
    isVerified: appwriteUser.emailVerification || false,
    role: 'user', // Default role, can be updated from user preferences or separate database
    avatarUrl: appwriteUser.prefs?.['avatarUrl'] || undefined,
  };
};

// Authentication functions
export const getUser = async (): Promise<User | null> => {
  try {
    const appwriteUser = await account.get();
    return convertAppwriteUser(appwriteUser);
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    const appwriteUser = await account.get();
    return { user: convertAppwriteUser(appwriteUser), session };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    return account.createOAuth2Session(
      'google' as any,
      `${window.location.origin}/auth/callback`, // Success URL
      `${window.location.origin}/auth/callback/error` // Failure URL
    );
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    return account.createOAuth2Session(
      'apple' as any,
      `${window.location.origin}/auth/callback`, // Success URL
      `${window.location.origin}/auth/callback/error` // Failure URL
    );
  } catch (error) {
    console.error('Error signing in with Apple:', error);
    throw error;
  }
};

export const signUp = async (email: string, password: string, name: string) => {
  try {
    const appwriteUser = await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    return convertAppwriteUser(appwriteUser);
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await account.deleteSession('current');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Real-time subscription helpers
export const subscribeToMatches = (tournamentId: string, callback: (payload: any) => void) => {
  const unsubscribe = realtime.subscribe(
    `databases.${APPWRITE_DATABASE_ID}.collections.matches.documents`,
    (response) => {
      // Only process events for matches in this tournament
      if (response.payload && response.payload.tournament_id === tournamentId) {
        callback(response);
      }
    }
  );
  
  return () => {
    unsubscribe();
  };
};

export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  const unsubscribe = realtime.subscribe(
    `databases.${APPWRITE_DATABASE_ID}.collections.notifications.documents`,
    (response) => {
      // Only process notifications for this user
      if (response.payload && response.payload.user_id === userId) {
        callback(response);
      }
    }
  );
  
  return () => {
    unsubscribe();
  };
};

export default client;
