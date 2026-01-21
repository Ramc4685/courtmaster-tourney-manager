#!/usr/bin/env node

import { Client, Databases } from 'node-appwrite';

// Configuration
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6892291d0017aacbddfb';
const DATABASE_ID = '68922acc003b365f1777';
const API_KEY = 'standard_a3bea38b25e5a52150d65b6f3b423494dc212bfb53f1de269f18eae67de8bb17affbdc2b164e0a9bbf508b6042568c3546c53bed2e7aee0f96b09b18df6053696a14f11536cf1d71b7fb216879389cac84e892c1d11087fb32aecb1cb6ed287f5e88e20a7c2007dbc2f8ccbe9f205ae08457a2361cc16583e202b8b6d7d95ce8';

async function checkDatabaseStructure() {
    console.log('🔍 Checking database structure...');
    
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(API_KEY);
    
    const databases = new Databases(client);
    
    try {
        // Get database info
        const database = await databases.get(DATABASE_ID);
        console.log('📊 Database:', database.name);
        
        // List collections
        const collections = await databases.listCollections(DATABASE_ID);
        console.log('📁 Collections found:', collections.total);
        
        // Check if profiles collection exists
        let profilesCollection = null;
        for (const collection of collections.collections) {
            console.log(`\n📋 Collection: ${collection.name} (${collection.$id})`);
            
            if (collection.$id === 'profiles' || collection.name === 'profiles') {
                profilesCollection = collection;
                
                // Get collection details with attributes
                const collectionDetails = await databases.getCollection(DATABASE_ID, collection.$id);
                console.log('🏷️  Profiles Collection Attributes:');
                
                if (collectionDetails.attributes.length === 0) {
                    console.log('   No attributes defined');
                } else {
                    collectionDetails.attributes.forEach(attr => {
                        console.log(`   - ${attr.key}: ${attr.type}${attr.required ? ' (required)' : ''}`);
                    });
                }
            }
        }
        
        if (!profilesCollection) {
            console.log('❌ Profiles collection not found!');
            console.log('📝 Available collections:');
            collections.collections.forEach(col => {
                console.log(`   - ${col.name} (${col.$id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    }
}

// Run the script
checkDatabaseStructure().catch(console.error);
