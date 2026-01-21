import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import { config } from 'dotenv';
config({ path: '../.env.local' });

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const CATEGORIES_ID = 'categories';

async function main() {
    console.log('Creating Categories collection...');
    console.log('Endpoint:', APPWRITE_ENDPOINT);
    console.log('Project ID:', APPWRITE_PROJECT_ID);
    console.log('Database ID:', DATABASE_ID);

    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        // Create the collection
        await databases.createCollection(
            DATABASE_ID,
            CATEGORIES_ID,
            'Categories',
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        );
        console.log('Collection created successfully');

        // Add attributes
        console.log('Adding division_id attribute...');
        await databases.createStringAttribute(DATABASE_ID, CATEGORIES_ID, 'division_id', 255, true);
        
        console.log('Adding name attribute...');
        await databases.createStringAttribute(DATABASE_ID, CATEGORIES_ID, 'name', 255, true);
        
        console.log('Adding type attribute...');
        await databases.createStringAttribute(DATABASE_ID, CATEGORIES_ID, 'type', 50, true);
        
        console.log('Adding format attribute...');
        await databases.createStringAttribute(DATABASE_ID, CATEGORIES_ID, 'format', 50, false);
        
        console.log('Adding capacity attribute...');
        await databases.createIntegerAttribute(DATABASE_ID, CATEGORIES_ID, 'capacity', false);

        // Wait for attributes to be ready
        console.log('Waiting for attributes to be ready...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Create index
        console.log('Creating division_id index...');
        await databases.createIndex(DATABASE_ID, CATEGORIES_ID, 'division_id_idx', 'key', ['division_id']);

        console.log('Categories collection created successfully!');
    } catch (error) {
        if (error.code === 409) {
            console.log('Collection already exists');
        } else {
            console.error('Error:', error);
        }
    }
}

main();
