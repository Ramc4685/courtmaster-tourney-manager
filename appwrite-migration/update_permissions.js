import { Client, Databases, Permission, Role } from 'node-appwrite';
import { config } from 'dotenv';
config({ path: '.env.local' });

// Configuration
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '';
const DATABASE_NAME = 'CourtMaster';

// Collection IDs - Use environment variables if available, otherwise use default string IDs
const PROFILES_ID = process.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || 'profiles';
const TOURNAMENTS_ID = process.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || 'tournaments';
const DIVISIONS_ID = process.env.VITE_APPWRITE_DIVISIONS_COLLECTION_ID || 'divisions';
const TEAMS_ID = process.env.VITE_APPWRITE_TEAMS_COLLECTION_ID || 'teams';
const TEAM_MEMBERS_ID = process.env.VITE_APPWRITE_TEAM_MEMBERS_COLLECTION_ID || 'team_members';
const REGISTRATIONS_ID = process.env.VITE_APPWRITE_REGISTRATIONS_COLLECTION_ID || 'registrations';
const MATCHES_ID = process.env.VITE_APPWRITE_MATCHES_COLLECTION_ID || 'matches';
const COURTS_ID = process.env.VITE_APPWRITE_COURTS_COLLECTION_ID || 'courts';
const NOTIFICATIONS_ID = process.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications';
const TOURNAMENT_MESSAGES_ID = process.env.VITE_APPWRITE_TOURNAMENT_MESSAGES_COLLECTION_ID || 'tournament_messages';
const PLAYER_HISTORY_ID = process.env.VITE_APPWRITE_PLAYER_HISTORY_COLLECTION_ID || 'player_history';

// Helper function to update collection permissions
async function updateCollectionPermissions(databases, collectionId, collectionName) {
    try {
        console.log(`Updating permissions for ${collectionName} collection...`);
        
        // Update collection permissions to allow all operations for all users
        await databases.updateCollection(
            DATABASE_ID,
            collectionId,
            collectionName,
            [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any()),
            ]
        );
        
        console.log(`Permissions updated successfully for ${collectionName} collection.`);
    } catch (error) {
        console.error(`Error updating permissions for ${collectionName} collection:`, error);
    }
}

// Main function
async function main() {
    // Validate required environment variables
    if (!APPWRITE_API_KEY) {
        console.error("APPWRITE_API_KEY is missing. Please set it in your .env.local file.");
        return;
    }

    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        console.log(`Checking for database '${DATABASE_NAME}'...`);
        await databases.get(DATABASE_ID);
        console.log(`Database '${DATABASE_NAME}' exists. Updating collection permissions...`);
        
        // Update permissions for all collections
        await updateCollectionPermissions(databases, PROFILES_ID, 'Profiles');
        await updateCollectionPermissions(databases, TOURNAMENTS_ID, 'Tournaments');
        await updateCollectionPermissions(databases, DIVISIONS_ID, 'Divisions');
        await updateCollectionPermissions(databases, TEAMS_ID, 'Teams');
        await updateCollectionPermissions(databases, TEAM_MEMBERS_ID, 'Team Members');
        await updateCollectionPermissions(databases, REGISTRATIONS_ID, 'Registrations');
        await updateCollectionPermissions(databases, MATCHES_ID, 'Matches');
        await updateCollectionPermissions(databases, COURTS_ID, 'Courts');
        await updateCollectionPermissions(databases, NOTIFICATIONS_ID, 'Notifications');
        await updateCollectionPermissions(databases, TOURNAMENT_MESSAGES_ID, 'Tournament Messages');
        await updateCollectionPermissions(databases, PLAYER_HISTORY_ID, 'Player History');
        
        console.log('All collection permissions updated successfully!');
    } catch (error) {
        console.error('Error:', error);
        return;
    }
}

// Run the script
main().catch(console.error);
