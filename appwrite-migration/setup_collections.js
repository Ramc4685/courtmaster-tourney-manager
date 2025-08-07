import { Client, Databases, ID } from 'node-appwrite';
import { config } from 'dotenv';
config({ path: '.env.local' });

// Configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6892291d0017aacbddfb';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'courtmaster-db';
const DATABASE_NAME = 'CourtMaster DB';

// Collection IDs - Using the same IDs as in .env.local for consistency
// Read from environment variables if available, otherwise use default string IDs
const PROFILES_ID = process.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || 'profiles';
const TOURNAMENTS_ID = process.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || '68922b290000e9ac3ec4'; // Using the ID from .env.local
const DIVISIONS_ID = process.env.VITE_APPWRITE_DIVISIONS_COLLECTION_ID || 'divisions';
const TEAMS_ID = process.env.VITE_APPWRITE_TEAMS_COLLECTION_ID || 'teams';
const TEAM_MEMBERS_ID = process.env.VITE_APPWRITE_TEAM_MEMBERS_COLLECTION_ID || 'team_members';
const REGISTRATIONS_ID = process.env.VITE_APPWRITE_REGISTRATIONS_COLLECTION_ID || 'registrations';
const MATCHES_ID = process.env.VITE_APPWRITE_MATCHES_COLLECTION_ID || 'matches';
const COURTS_ID = process.env.VITE_APPWRITE_COURTS_COLLECTION_ID || 'courts';
const NOTIFICATIONS_ID = process.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications';
const TOURNAMENT_MESSAGES_ID = process.env.VITE_APPWRITE_TOURNAMENT_MESSAGES_COLLECTION_ID || 'tournament_messages';
const PLAYER_HISTORY_ID = process.env.VITE_APPWRITE_PLAYER_HISTORY_COLLECTION_ID || 'player_history';

// Helper functions
async function createCollection(databases, collectionId, collectionName, attributes) {
    try {
        await databases.createCollection(DATABASE_ID, collectionId, collectionName, [
            'read("any")', // Anyone can read documents
            'create("any")', // Anyone can create documents
            'update("any")', // Anyone can update documents
            'delete("any")' // Anyone can delete documents
        ]);
        console.log(`Collection '${collectionName}' created successfully with open permissions.`);
        for (const attr of attributes) {
            await createAttribute(databases, collectionId, attr);
        }
    } catch (error) {
        if (error.code === 409) {
            console.log(`Collection '${collectionName}' already exists. Updating permissions...`);
            // Update permissions for existing collection
            try {
                await databases.updateCollection(DATABASE_ID, collectionId, collectionName, [
                    'read("any")', // Anyone can read documents
                    'create("any")', // Anyone can create documents
                    'update("any")', // Anyone can update documents
                    'delete("any")' // Anyone can delete documents
                ]);
                console.log(`Permissions updated for collection '${collectionName}'.`);
            } catch (permError) {
                console.error(`Error updating permissions for collection '${collectionName}':`, permError);
            }
        } else {
            console.error(`Error creating collection '${collectionName}':`, error);
        }
    }
}

async function createAttribute(databases, collectionId, attr) {
    try {
        const { key, type, size, required, default: defaultValue, array } = attr;
        console.log(`  - Creating attribute '${key}' in '${collectionId}'...`);

        switch (type) {
            case 'string':
                await databases.createStringAttribute(DATABASE_ID, collectionId, key, size, required, defaultValue, array);
                break;
            case 'integer':
                await databases.createIntegerAttribute(DATABASE_ID, collectionId, key, required, undefined, undefined, defaultValue, array);
                break;
            case 'boolean':
                await databases.createBooleanAttribute(DATABASE_ID, collectionId, key, required, defaultValue, array);
                break;
            case 'datetime':
                await databases.createDatetimeAttribute(DATABASE_ID, collectionId, key, required, defaultValue, array);
                break;
            default:
                console.warn(`  - Unsupported attribute type: ${type}`);
                return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`  - Attribute '${key}' created.`);
    } catch (error) {
        if (error.code === 409) {
            console.log(`  - Attribute '${attr.key}' already exists. Skipping.`);
        } else {
            console.error(`  - Error creating attribute '${attr.key}':`, error.message);
        }
    }
}

async function createIndex(databases, collectionId, key, type, attributes) {
    try {
        console.log(`  - Creating index '${key}' on '${collectionId}'...`);
        await databases.createIndex(DATABASE_ID, collectionId, key, type, attributes);
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`  - Index '${key}' created.`);
    } catch (error) {
        if (error.code === 409) {
            console.log(`  - Index '${key}' already exists. Skipping.`);
        } else {
            console.error(`  - Error creating index '${key}':`, error.message);
        }
    }
}

// Setup collections function
async function setupCollections(databases) {
    console.log('Starting collection setup...');

    // 1. Profiles Collection
    await createCollection(databases, PROFILES_ID, 'Profiles', [
        { key: 'user_id', type: 'string', size: 255, required: true },
        { key: 'full_name', type: 'string', size: 255, required: false },
        { key: 'display_name', type: 'string', size: 255, required: false },
        { key: 'avatar_url', type: 'string', size: 1024, required: false },
        { key: 'phone', type: 'string', size: 50, required: false },
        { key: 'role', type: 'string', size: 50, required: true, default: 'player' },
        { key: 'player_stats', type: 'string', size: 10000, required: false, default: '{}' },
        { key: 'preferences', type: 'string', size: 10000, required: false, default: '{}' },
        { key: 'player_details', type: 'string', size: 10000, required: false, default: '{}' },
        { key: 'social_links', type: 'string', size: 10000, required: false, default: '{}' },
    ]);
    await createIndex(databases, PROFILES_ID, 'user_id_idx', 'key', ['user_id']);

    // 2. Tournaments Collection
    await createCollection(databases, TOURNAMENTS_ID, 'Tournaments', [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'description', type: 'string', size: 10000, required: false },
        { key: 'start_date', type: 'datetime', required: true },
        { key: 'end_date', type: 'datetime', required: true },
        { key: 'registration_deadline', type: 'datetime', required: false },
        { key: 'venue', type: 'string', size: 255, required: false },
        { key: 'status', type: 'string', size: 50, required: true, default: 'draft' },
        { key: 'organizer_id', type: 'string', size: 255, required: false },
    ]);
    await createIndex(databases, TOURNAMENTS_ID, 'organizer_id_idx', 'key', ['organizer_id']);

    // 3. Divisions Collection
    await createCollection(databases, DIVISIONS_ID, 'Divisions', [
        { key: 'tournament_id', type: 'string', size: 255, required: true },
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'type', type: 'string', size: 50, required: true },
        { key: 'min_age', type: 'integer', required: false },
        { key: 'max_age', type: 'integer', required: false },
        { key: 'skill_level', type: 'string', size: 100, required: false },
        { key: 'gender', type: 'string', size: 50, required: false },
    ]);
    await createIndex(databases, DIVISIONS_ID, 'tournament_id_idx', 'key', ['tournament_id']);

    // 4. Teams Collection
    await createCollection(databases, TEAMS_ID, 'Teams', [
        { key: 'tournament_id', type: 'string', size: 255, required: true },
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'captain_id', type: 'string', size: 255, required: false },
    ]);
    await createIndex(databases, TEAMS_ID, 'tournament_id_idx', 'key', ['tournament_id']);
    await createIndex(databases, TEAMS_ID, 'captain_id_idx', 'key', ['captain_id']);

    // 5. Team Members Collection
    await createCollection(databases, TEAM_MEMBERS_ID, 'Team Members', [
        { key: 'team_id', type: 'string', size: 255, required: true },
        { key: 'user_id', type: 'string', size: 255, required: true },
    ]);
    await createIndex(databases, TEAM_MEMBERS_ID, 'team_id_idx', 'key', ['team_id']);
    await createIndex(databases, TEAM_MEMBERS_ID, 'user_id_idx', 'key', ['user_id']);

    // 6. Registrations Collection
    await createCollection(databases, REGISTRATIONS_ID, 'Registrations', [
        { key: 'tournament_id', type: 'string', size: 255, required: true },
        { key: 'division_id', type: 'string', size: 255, required: true },
        { key: 'player_id', type: 'string', size: 255, required: true },
        { key: 'partner_id', type: 'string', size: 255, required: false },
        { key: 'team_id', type: 'string', size: 255, required: false },
        { key: 'status', type: 'string', size: 50, required: true }, // No default value
        { key: 'metadata', type: 'string', size: 10000, required: false, default: '{}' },
        // { key: 'notes', type: 'string', size: 10000, required: false }, // Commented out due to attribute limit
        { key: 'priority', type: 'integer', required: false, default: 0 },
    ]);
    await createIndex(databases, REGISTRATIONS_ID, 'tournament_id_idx', 'key', ['tournament_id']);
    await createIndex(databases, REGISTRATIONS_ID, 'player_id_idx', 'key', ['player_id']);

    // 7. Matches Collection
    await createCollection(databases, MATCHES_ID, 'Matches', [
        { key: 'tournament_id', type: 'string', size: 255, required: true },
        { key: 'division_id', type: 'string', size: 255, required: false },
        { key: 'round_number', type: 'integer', required: true },
        { key: 'match_number', type: 'integer', required: true },
        { key: 'player1_id', type: 'string', size: 255, required: false },
        { key: 'player2_id', type: 'string', size: 255, required: false },
        { key: 'team1_id', type: 'string', size: 255, required: false },
        { key: 'team2_id', type: 'string', size: 255, required: false },
        { key: 'status', type: 'string', size: 50, required: true }, // No default value
        { key: 'scores', type: 'string', size: 1000, required: false, default: '{}' },
        { key: 'winner_id', type: 'string', size: 255, required: false },
        { key: 'winner_team_id', type: 'string', size: 255, required: false },
        { key: 'scheduled_time', type: 'datetime', required: false },
        { key: 'start_time', type: 'datetime', required: false },
        { key: 'end_time', type: 'datetime', required: false },
        { key: 'court_id', type: 'string', size: 255, required: false },
        // { key: 'notes', type: 'string', size: 10000, required: false }, // Commented out due to attribute limit
        { key: 'verified', type: 'boolean', required: false, default: false },
    ]);
    await createIndex(databases, MATCHES_ID, 'tournament_id_idx', 'key', ['tournament_id']);

    // 8. Courts Collection
    await createCollection(databases, COURTS_ID, 'Courts', [
        { key: 'tournament_id', type: 'string', size: 255, required: true },
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'status', type: 'string', size: 50, required: true }, // No default value
        { key: 'description', type: 'string', size: 10000, required: false },
    ]);
    await createIndex(databases, COURTS_ID, 'tournament_id_idx', 'key', ['tournament_id']);

    // 9. Notifications Collection
    await createCollection(databases, NOTIFICATIONS_ID, 'Notifications', [
        { key: 'user_id', type: 'string', size: 255, required: true },
        { key: 'title', type: 'string', size: 255, required: true },
        { key: 'message', type: 'string', size: 10000, required: true },
        { key: 'type', type: 'string', size: 50, required: true },
        { key: 'read', type: 'boolean', required: false, default: false },
    ]);
    await createIndex(databases, NOTIFICATIONS_ID, 'user_id_idx', 'key', ['user_id']);

    // 10. Tournament Messages Collection
    await createCollection(databases, TOURNAMENT_MESSAGES_ID, 'Tournament Messages', [
        { key: 'tournament_id', type: 'string', size: 255, required: true },
        { key: 'sender_id', type: 'string', size: 255, required: true },
        { key: 'content', type: 'string', size: 10000, required: true },
    ]);
    await createIndex(databases, TOURNAMENT_MESSAGES_ID, 'tournament_id_idx', 'key', ['tournament_id']);

    // 11. Player History Collection
    await createCollection(databases, PLAYER_HISTORY_ID, 'Player History', [
        { key: 'player_id', type: 'string', size: 255, required: true },
        { key: 'tournament_id', type: 'string', size: 255, required: true },
        { key: 'division_id', type: 'string', size: 255, required: true },
        { key: 'partner_id', type: 'string', size: 255, required: false },
        { key: 'placement', type: 'integer', required: false },
        { key: 'points_earned', type: 'integer', required: false },
        { key: 'matches_played', type: 'integer', required: false },
        { key: 'matches_won', type: 'integer', required: false },
    ]);
    await createIndex(databases, PLAYER_HISTORY_ID, 'player_id_idx', 'key', ['player_id']);

    console.log('All collections and attributes created successfully!');
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
        console.log(`Database '${DATABASE_NAME}' already exists.`);
    } catch (error) {
        if (error.code === 404) {
            console.log(`Database '${DATABASE_NAME}' not found, creating it...`);
            try {
                await databases.create(DATABASE_ID, DATABASE_NAME);
                console.log(`Database '${DATABASE_NAME}' created successfully.`);
            } catch (createError) {
                console.error('Error creating database:', createError);
                return;
            }
        } else {
            console.error('Error getting database:', error.message);
            console.error('Error code:', error.code);
            console.error('This might indicate an authentication or permissions issue.');
            return;
        }
    }

    await setupCollections(databases);
}

// Run the script
main().catch(console.error);
