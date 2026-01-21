#!/usr/bin/env node

import { Client, Databases, ID } from 'node-appwrite';

// Configuration from environment
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6892291d0017aacbddfb';
const DATABASE_ID = '68922acc003b365f1777';
const API_KEY = 'standard_a3bea38b25e5a52150d65b6f3b423494dc212bfb53f1de269f18eae67de8bb17affbdc2b164e0a9bbf508b6042568c3546c53bed2e7aee0f96b09b18df6053696a14f11536cf1d71b7fb216879389cac84e892c1d11087fb32aecb1cb6ed287f5e88e20a7c2007dbc2f8ccbe9f205ae08457a2361cc16583e202b8b6d7d95ce8';

// User details from the logs
const USER_ID = '68923fd00016608c67eb';

async function createUserProfile() {
    console.log('🔧 Creating missing user profile...');
    
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(API_KEY);
    
    const databases = new Databases(client);
    
    try {
        // Create the user profile document with only the attributes that exist
        const profile = await databases.createDocument(
            DATABASE_ID,
            'profiles',
            USER_ID, // Use user ID as document ID
            {
                user_id: USER_ID,
                full_name: 'Pilot User',
                display_name: 'Pilot User',
                avatar_url: '',
                phone: '',
                player_stats: '{}'
            }
        );
        
        console.log('✅ User profile created successfully:', profile.$id);
        console.log('📋 Profile details:', {
            user_id: profile.user_id,
            full_name: profile.full_name,
            display_name: profile.display_name
        });
        
    } catch (error) {
        if (error.code === 409) {
            console.log('✅ User profile already exists');
        } else {
            console.error('❌ Error creating user profile:', error.message);
            console.error('Error details:', error);
        }
    }
}

// Run the script
createUserProfile().catch(console.error);
