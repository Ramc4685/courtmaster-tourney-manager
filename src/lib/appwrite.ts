import { Client, Account, Databases, ID, Teams, Storage, Models } from 'appwrite';
import { profileService } from '@/services/profileService';
import { UserRole } from '@/types/entities';

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

/**
 * Standard callback type for all subscription functions.
 * Receives the full response object from Appwrite realtime subscriptions.
 */
export type SubscriptionCallback = (response: any) => void;

/**
 * Filter function type for filtering subscription responses.
 * Returns true if the response should be passed to the callback.
 */
export type SubscriptionFilter = (payload: Record<string, any>) => boolean;

// Import constants to avoid circular dependencies
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID, COLLECTIONS } from './constants';

type MockDocument = Record<string, any> & {
  $id: string;
  id: string;
  $createdAt: string;
  $updatedAt: string;
  created_at: string;
  updated_at: string;
};

const isTestEnv = import.meta.env.VITE_APP_ENV === 'test' ||
  import.meta.env.MODE === 'test' ||
  (typeof navigator !== 'undefined' && navigator.webdriver);
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  isTestEnv ||
  !APPWRITE_ENDPOINT ||
  !APPWRITE_PROJECT_ID ||
  !APPWRITE_DATABASE_ID;

const mockCollections = new Map<string, Map<string, MockDocument>>();

const getMockCollection = (collectionId: string) => {
  if (!mockCollections.has(collectionId)) {
    mockCollections.set(collectionId, new Map());
  }
  return mockCollections.get(collectionId)!;
};

const createMockDocument = (documentId: string, payload: Record<string, any>): MockDocument => {
  const timestamp = new Date().toISOString();
  return {
    ...payload,
    $id: documentId,
    id: documentId,
    $createdAt: timestamp,
    $updatedAt: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
  };
};

const createMockDatabases = () => ({
  listDocuments: async (_databaseId: string, collectionId: string, _queries: string[] = []) => {
    const collection = getMockCollection(collectionId);
    const documents = Array.from(collection.values());
    return { documents, total: documents.length };
  },
  createDocument: async (
    _databaseId: string,
    collectionId: string,
    documentId: string,
    payload: Record<string, any>
  ) => {
    const collection = getMockCollection(collectionId);
    const resolvedId = documentId && documentId !== 'unique()' ? documentId : ID.unique();
    const document = createMockDocument(resolvedId, payload);
    collection.set(resolvedId, document);
    return document;
  },
  getDocument: async (_databaseId: string, collectionId: string, documentId: string) => {
    const collection = getMockCollection(collectionId);
    const document = collection.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    return document;
  },
  updateDocument: async (
    _databaseId: string,
    collectionId: string,
    documentId: string,
    payload: Record<string, any>
  ) => {
    const collection = getMockCollection(collectionId);
    const existing = collection.get(documentId);
    if (!existing) {
      throw new Error(`Document not found: ${documentId}`);
    }
    const timestamp = new Date().toISOString();
    const updated: MockDocument = {
      ...existing,
      ...payload,
      $updatedAt: timestamp,
      updated_at: timestamp,
    };
    collection.set(documentId, updated);
    return updated;
  },
  deleteDocument: async (_databaseId: string, collectionId: string, documentId: string) => {
    const collection = getMockCollection(collectionId);
    collection.delete(documentId);
  },
});

// Re-export for backward compatibility
export { APPWRITE_DATABASE_ID, COLLECTIONS };

// Initialize the Appwrite client
export const client = new Client();

try {
  console.log('🔧 Initializing Appwrite client with:');
  console.log('Endpoint:', APPWRITE_ENDPOINT);
  console.log('Project ID:', APPWRITE_PROJECT_ID);
  
  // Validate URLs before setting them
  if (APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID) {
    try {
      new URL(APPWRITE_ENDPOINT); // Validate URL format
      client
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);
      console.log('✅ Appwrite client initialized successfully');
    } catch (urlError) {
      console.warn('⚠️ Invalid Appwrite endpoint URL, using mock service for development');
      console.log('URL Error:', urlError);
    }
  } else {
    console.warn('⚠️ Missing Appwrite configuration, using mock service for development');
  }
} catch (error) {
  console.warn('⚠️ Failed to initialize Appwrite client, using mock service:', error);
}

// Initialize Appwrite services
export const account = new Account(client);
export const databases: Databases = useMockData
  ? (createMockDatabases() as unknown as Databases)
  : new Databases(client);
export const teams = new Teams(client);
export const storage = new Storage(client);

if (useMockData) {
  console.warn('[Appwrite] Using mock databases for local development/testing');
}

// Export realtime functionality through the client
export const realtime = client;

/**
 * Reusable helper function for subscribing to collections with optional filtering.
 * @param collectionId - The ID of the collection to subscribe to
 * @param documentId - Optional document ID for document-specific subscriptions
 * @param filter - Optional filter function to apply to responses
 * @param callback - Callback function to handle filtered responses
 * @returns Unsubscribe function
 */
export const subscribeToCollectionFiltered = (
  collectionId: string,
  documentId: string | null,
  filter: SubscriptionFilter | null,
  callback: SubscriptionCallback
) => {
  const channel = documentId
    ? `databases.${APPWRITE_DATABASE_ID}.collections.${collectionId}.documents.${documentId}`
    : `databases.${APPWRITE_DATABASE_ID}.collections.${collectionId}.documents`;

  console.log(`Subscribing to: ${channel}`);

  return client.subscribe(channel, (response) => {
    if (filter) {
      const payload = response.payload as Record<string, any>;
      if (payload && filter(payload)) {
        callback(response);
      }
    } else {
      callback(response);
    }
  });
};

/**
 * Subscribe to all documents in a collection.
 * @param collectionId - The ID of the collection to subscribe to
 * @param callback - Callback function that receives the full response object
 * @returns Unsubscribe function
 */
export const subscribeToCollection = (collectionId: string, callback: SubscriptionCallback) => {
  return subscribeToCollectionFiltered(collectionId, null, null, callback);
};

/**
 * Subscribe to a specific document in a collection.
 * @param collectionId - The ID of the collection
 * @param documentId - The ID of the document to subscribe to
 * @param callback - Callback function that receives the full response object
 * @returns Unsubscribe function
 */
export const subscribeToDocument = (collectionId: string, documentId: string, callback: SubscriptionCallback) => {
  return subscribeToCollectionFiltered(collectionId, documentId, null, callback);
};

/**
 * Subscribe to notifications for a specific user.
 * @param userId - The ID of the user to filter notifications for
 * @param callback - Callback function that receives the full response object
 * @returns Unsubscribe function
 */
export const subscribeToUserNotifications = (userId: string, callback: SubscriptionCallback) => {
  const filter: SubscriptionFilter = (payload) => payload?.user_id === userId;
  return subscribeToCollectionFiltered(COLLECTIONS.NOTIFICATIONS, null, filter, callback);
};


// Convert Appwrite user to application user model
const convertAppwriteUser = async (appwriteUser: Models.User<Models.Preferences>): Promise<User> => {
  let role = UserRole.PLAYER; // Default fallback role
  let avatarUrl: string | undefined = undefined;

  try {
    // Attempt to fetch user profile to get role and avatar
    const profile = await profileService.getProfile(appwriteUser.$id);
    
    if (profile) {
      // Use role from profile if available
      role = profile.role || UserRole.PLAYER;
      
      // Use avatar_url from profile if available, with fallbacks
      avatarUrl = profile.avatar_url || profile.avatarUrl || appwriteUser.prefs?.['avatarUrl'] || undefined;
    } else {
      // Fallback to preferences if profile doesn't exist
      avatarUrl = appwriteUser.prefs?.['avatarUrl'] || undefined;
      
      // Try to derive role from preferences as secondary fallback
      const prefsRole = appwriteUser.prefs?.['role'] as UserRole;
      if (prefsRole && Object.values(UserRole).includes(prefsRole)) {
        role = prefsRole;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch user profile, using fallback values:', error);
    // Use fallback values - preferences or defaults
    avatarUrl = appwriteUser.prefs?.['avatarUrl'] || undefined;
    const prefsRole = appwriteUser.prefs?.['role'] as UserRole;
    if (prefsRole && Object.values(UserRole).includes(prefsRole)) {
      role = prefsRole;
    }
  }

  return {
    id: appwriteUser.$id,
    email: appwriteUser.email,
    name: appwriteUser.name,
    createdAt: appwriteUser.$createdAt,
    isVerified: appwriteUser.emailVerification || false,
    role: role,
    avatarUrl: avatarUrl,
  };
};

// Authentication functions
export const getUser = async (): Promise<User | null> => {
  try {
    const appwriteUser = await account.get();
    return await convertAppwriteUser(appwriteUser);
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    const appwriteUser = await account.get();
    return { user: await convertAppwriteUser(appwriteUser), session };
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
    return await convertAppwriteUser(appwriteUser);
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

/**
 * Subscribe to matches for a specific tournament.
 * @param tournamentId - The ID of the tournament to filter matches for
 * @param callback - Callback function that receives the full response object
 * @returns Unsubscribe function
 */
export const subscribeToMatches = (tournamentId: string, callback: SubscriptionCallback) => {
  const filter: SubscriptionFilter = (payload) => payload?.tournament_id === tournamentId;
  return subscribeToCollectionFiltered(COLLECTIONS.MATCHES, null, filter, callback);
};

/**
 * Subscribe to notifications for a specific user.
 * @param userId - The ID of the user to filter notifications for
 * @param callback - Callback function that receives the full response object
 * @returns Unsubscribe function
 */
export const subscribeToNotifications = (userId: string, callback: SubscriptionCallback) => {
  return subscribeToUserNotifications(userId, callback);
};

export default client;
