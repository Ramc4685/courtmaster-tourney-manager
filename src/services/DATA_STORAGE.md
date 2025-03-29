
# Badminton Tournament Manager Data Storage

## Current Implementation

The Badminton Tournament Manager currently uses a hybrid storage approach:

1. **Local Storage**: Primary data storage for development and testing
   - Tournament data is saved in localStorage for persistence
   - Fast and simple for single-user scenarios

2. **Real-time Service Wrapper**: For multi-user functionality
   - Current implementation uses a publish/subscribe pattern
   - Enables live updates for score displays and multi-scorekeeper scenarios

## Production Deployment (Vercel)

The current implementation is compatible with Vercel deployment and includes:

1. **LocalStorageService**: Main persistence layer
2. **RealTimeStorageService**: Mock implementation that will be replaced in production

## Future-Proofing for Production

The app is designed for future migration to more robust storage solutions:

### Firebase Implementation
The app's architecture supports easy migration to Firebase:

1. **Firestore Database**: For tournament data
   ```typescript
   // Example of how Firebase implementation would look
   class FirestoreStorageService implements StorageService {
     async getItem<T>(key: string): Promise<T | null> {
       const docRef = doc(db, 'tournaments', key);
       const docSnap = await getDoc(docRef);
       return docSnap.exists() ? docSnap.data() as T : null;
     }
     
     async setItem<T>(key: string, value: T): Promise<void> {
       await setDoc(doc(db, 'tournaments', key), value);
     }
     
     async removeItem(key: string): Promise<void> {
       await deleteDoc(doc(db, 'tournaments', key));
     }
   }
   ```

2. **Firebase Realtime Database**: For live scoring and updates
   ```typescript
   // Example for realtime functionality
   class FirebaseRealtimeService {
     subscribe<T>(path: string, callback: (data: T) => void): () => void {
       const dbRef = ref(database, path);
       const handler = (snapshot) => {
         callback(snapshot.val() as T);
       };
       
       onValue(dbRef, handler);
       return () => off(dbRef, 'value', handler);
     }
     
     publish<T>(path: string, data: T): Promise<void> {
       const dbRef = ref(database, path);
       return set(dbRef, data);
     }
   }
   ```

### Other Potential Backends

The application's abstracted storage interface also supports:

1. **Supabase**: PostgreSQL + Realtime capabilities
   - Direct drop-in replacement for Firebase
   - Better SQL capabilities

2. **MongoDB Atlas**: For document-based storage
   - Good fit for the tournament document structure
   - Realm for synchronization

3. **AWS DynamoDB + AppSync**: Enterprise-grade solution
   - Scalable NoSQL storage
   - GraphQL subscriptions for real-time

## Implementation Notes

The current architecture uses dependency injection and factory patterns to make switching storage implementations simple:

```typescript
// Factory pattern used in StorageService.ts
export const createStorageService = (config?: StorageConfig): StorageService => {
  if (config?.useFirebase) {
    return new FirestoreStorageService();
  }
  
  if (config?.useSupabase) {
    return new SupabaseStorageService();
  }
  
  return new LocalStorageService();
};
```

This allows for a seamless transition from the current localStorage implementation to a production database when needed.
