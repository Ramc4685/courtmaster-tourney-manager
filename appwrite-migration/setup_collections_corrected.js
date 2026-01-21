import { Client, Databases, ID } from 'node-appwrite';
import { config } from 'dotenv';
config({ path: '.env.development' });

// Configuration
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6892291d0017aacbddfb';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'courtmaster-db';
const DATABASE_NAME = 'CourtMaster DB';

// Helper function to get collection ID with backward compatibility
function getCollectionId(collectionName) {
    const appwriteKey = `APPWRITE_${collectionName}_COLLECTION_ID`;
    const viteKey = `VITE_APPWRITE_${collectionName}_COLLECTION_ID`;

    return process.env[appwriteKey] || process.env[viteKey] || collectionName.toLowerCase();
}

// Collection IDs - Using environment variables with backward compatibility
const PROFILES_ID = getCollectionId('PROFILES');
const TOURNAMENTS_ID = getCollectionId('TOURNAMENTS');
const DIVISIONS_ID = getCollectionId('DIVISIONS');
const TEAMS_ID = getCollectionId('TEAMS');
const TEAM_MEMBERS_ID = getCollectionId('TEAM_MEMBERS');
const REGISTRATIONS_ID = getCollectionId('REGISTRATIONS');
const MATCHES_ID = getCollectionId('MATCHES');
const COURTS_ID = getCollectionId('COURTS');
const NOTIFICATIONS_ID = getCollectionId('NOTIFICATIONS');

// Helper function to get collection permissions
function getCollectionPermissions() {
    const envPerms = process.env.APPWRITE_COLLECTION_PERMS;
    if (envPerms) {
        return envPerms.split(',').map(p => p.trim());
    }

    // Development permissions - more restrictive than original
    return [
        'read("any")',
        'create("users")',
        'update("users")',
        'delete("users")'
    ];
}

// Helper functions
async function createCollection(databases, collectionId, collectionName, attributes) {
    const permissions = getCollectionPermissions();

    try {
        await databases.createCollection(DATABASE_ID, collectionId, collectionName, permissions);
        console.log(`Collection '${collectionName}' created successfully.`);
    } catch (error) {
        if (error.code === 409) {
            console.log(`Collection '${collectionName}' already exists. Updating permissions...`);
            try {
                await databases.updateCollection(DATABASE_ID, collectionId, collectionName, permissions);
                console.log(`Permissions updated for collection '${collectionName}'.`);
            } catch (permError) {
                console.error(`Error updating permissions for collection '${collectionName}':`, permError);
            }
        } else {
            console.error(`Error creating collection '${collectionName}':`, error);
        }
    }

    // Create attributes regardless of whether collection was just created or already existed
    for (const attr of attributes) {
        await createAttribute(databases, collectionId, attr);
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

// Setup collections function with CORRECTED SCHEMA
async function setupCollections(databases) {
    console.log('Starting collection setup...');

    // 1. Profiles Collection (matches application usage)
    await createCollection(databases, PROFILES_ID, 'Profiles', [
        { key: 'user_id', type: 'string', size: 255, required: true },
        { key: 'full_name', type: 'string', size: 255, required: false },
        { key: 'display_name', type: 'string', size: 255, required: false },
        { key: 'avatar_url', type: 'string', size: 1024, required: false },
        { key: 'phone', type: 'string', size: 50, required: false },
        { key: 'role', type: 'string', size: 50, required: true, default: 'player' },
    ]);
    await createIndex(databases, PROFILES_ID, 'user_id_idx', 'key', ['user_id']);

    // 2. Tournaments Collection (matches TournamentWizard expectations)
    await createCollection(databases, TOURNAMENTS_ID, 'Tournaments', [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'description', type: 'string', size: 10000, required: false },
        { key: 'start_date', type: 'string', size: 50, required: true }, // string as expected by wizard
        { key: 'end_date', type: 'string', size: 50, required: true }, // string as expected by wizard
        { key: 'registration_deadline', type: 'datetime', required: false },
        { key: 'venue', type: 'string', size: 255, required: false },
        { key: 'status', type: 'string', size: 50, required: true, default: 'draft' },
        { key: 'organizer_id', type: 'string', size: 255, required: true },
    ]);
    await createIndex(databases, TOURNAMENTS_ID, 'organizer_id_idx', 'key', ['organizer_id']);

    // 3. Registrations Collection (matches registrationService expectations)
    await createCollection(databases, REGISTRATIONS_ID, 'Registrations', [
        { key: 'tournament_id', type: 'string', size: 255, required: true },
        { key: 'user_id', type: 'string', size: 255, required: true }, // CORRECTED from player_id
        { key: 'category_id', type: 'string', size: 255, required: false }, // CORRECTED from division_id
        { key: 'team_id', type: 'string', size: 255, required: false },
        { key: 'status', type: 'string', size: 50, required: true },
        { key: 'player_name', type: 'string', size: 255, required: false }, // ADDED
        { key: 'player_email', type: 'string', size: 255, required: false }, // ADDED
        { key: 'waiver_accepted', type: 'boolean', required: false, default: false }, // ADDED
        { key: 'payment_status', type: 'string', size: 50, required: false, default: 'pending' }, // ADDED
        { key: 'waitlist_position', type: 'integer', required: false }, // ADDED
        { key: 'team_name', type: 'string', size: 255, required: false }, // for team registrations
        { key: 'captain_id', type: 'string', size: 255, required: false }, // for team registrations
        { key: 'captain_name', type: 'string', size: 255, required: false }, // for team registrations
    ]);
    await createIndex(databases, REGISTRATIONS_ID, 'tournament_id_idx', 'key', ['tournament_id']);
    await createIndex(databases, REGISTRATIONS_ID, 'user_id_idx', 'key', ['user_id']);

    // 4. Matches Collection (matches matchService expectations)
    await createCollection(databases, MATCHES_ID, 'Matches', [
        { key: 'tournament_id', type: 'string', size: 255, required: true },
        { key: 'division_id', type: 'string', size: 255, required: false },
        { key: 'round_number', type: 'integer', required: true },
        { key: 'match_number', type: 'integer', required: true },
        { key: 'team1_id', type: 'string', size: 255, required: false },
        { key: 'team2_id', type: 'string', size: 255, required: false },
        { key: 'team1_player1', type: 'string', size: 255, required: false }, // CORRECTED from player1_id
        { key: 'team2_player1', type: 'string', size: 255, required: false }, // CORRECTED from player2_id
        { key: 'team1_player2', type: 'string', size: 255, required: false }, // ADDED for doubles
        { key: 'team2_player2', type: 'string', size: 255, required: false }, // ADDED for doubles
        { key: 'status', type: 'string', size: 50, required: true },
        { key: 'scores', type: 'string', size: 1000, required: false, default: '{}' },
        { key: 'winner_id', type: 'string', size: 255, required: false },
        { key: 'loser_id', type: 'string', size: 255, required: false }, // ADDED as expected by mapper
        { key: 'scheduled_time', type: 'datetime', required: false },
        { key: 'start_time', type: 'datetime', required: false },
        { key: 'end_time', type: 'datetime', required: false },
        { key: 'court_id', type: 'string', size: 255, required: false },
        { key: 'court_number', type: 'integer', required: false },
        { key: 'bracket_position', type: 'integer', required: false },
        { key: 'progression', type: 'string', size: 1000, required: false },
        { key: 'scorer_name', type: 'string', size: 255, required: false },
        { key: 'verified', type: 'boolean', required: false, default: false },
        { key: 'group_name', type: 'string', size: 255, required: false },
        { key: 'team1_name', type: 'string', size: 255, required: false }, // ADDED as expected by mapper
        { key: 'team2_name', type: 'string', size: 255, required: false }, // ADDED as expected by mapper
    ]);
    await createIndex(databases, MATCHES_ID, 'tournament_id_idx', 'key', ['tournament_id']);

    // 5. Teams Collection (simplified for now)
    await createCollection(databases, TEAMS_ID, 'Teams', [
        { key: 'tournament_id', type: 'string', size: 255, required: false },
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'captain_id', type: 'string', size: 255, required: false },
    ]);
    await createIndex(databases, TEAMS_ID, 'name_idx', 'key', ['name']);

    // 6. Team Members Collection
    await createCollection(databases, TEAM_MEMBERS_ID, 'Team Members', [
        { key: 'team_id', type: 'string', size: 255, required: true },
        { key: 'user_id', type: 'string', size: 255, required: true },
    ]);
    await createIndex(databases, TEAM_MEMBERS_ID, 'team_id_idx', 'key', ['team_id']);
    await createIndex(databases, TEAM_MEMBERS_ID, 'user_id_idx', 'key', ['user_id']);

    // 7. Courts Collection (simplified, tournament_id not required)
    await createCollection(databases, COURTS_ID, 'Courts', [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'number', type: 'integer', required: false },
        { key: 'status', type: 'string', size: 50, required: true, default: 'available' },
        { key: 'description', type: 'string', size: 1000, required: false },
        { key: 'tournament_id', type: 'string', size: 255, required: false }, // Not required for global courts
    ]);
    await createIndex(databases, COURTS_ID, 'name_idx', 'key', ['name']);

    // 8. Notifications Collection (matches notificationService expectations)
    await createCollection(databases, NOTIFICATIONS_ID, 'Notifications', [
        { key: 'user_id', type: 'string', size: 255, required: true },
        { key: 'title', type: 'string', size: 255, required: true },
        { key: 'message', type: 'string', size: 10000, required: true },
        { key: 'type', type: 'string', size: 50, required: true },
        { key: 'read', type: 'boolean', required: false, default: false },
        { key: 'related_entity_id', type: 'string', size: 255, required: false },
        { key: 'related_entity_type', type: 'string', size: 50, required: false },
    ]);
    await createIndex(databases, NOTIFICATIONS_ID, 'user_id_idx', 'key', ['user_id']);

    console.log('All collections and attributes created successfully with CORRECTED SCHEMA!');
}

// Main function
async function main() {
    // Validate required environment variables
    if (!APPWRITE_API_KEY) {
        console.error("APPWRITE_API_KEY is missing. Please set it in your .env.development file.");
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
            return;
        }
    }

    await setupCollections(databases);
}

// Run the script
main().catch(console.error);