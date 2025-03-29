
# Setting Up Supabase for Badminton Tournament Manager

This document explains how to set up and configure your Supabase project to work with the Badminton Tournament Manager application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new or existing Supabase project

## Setup Steps

### 1. Database Setup

1. Go to your Supabase project's SQL Editor
2. Copy and paste the contents of the `schema.sql` file (located in this directory)
3. Run the SQL script to create all necessary tables and security policies

### 2. Authentication Setup

1. Go to Authentication → Settings in your Supabase dashboard
2. Configure the email provider:
   - Enable "Enable Email Signup"
   - Set appropriate redirect URLs for your application

### 3. Storage Setup (Optional)

If you plan to store files (like player photos, etc.):

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called "tournament-files"
3. Configure the bucket's security policies as needed

### 4. Row Level Security (RLS)

The schema file includes Row Level Security policies to control access to data:

- Users can only see and modify tournaments they have access to
- Tournament owners can manage user access
- Profiles have appropriate access controls

### 5. Connect to Your Application

The application is already configured to connect to Supabase using environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase project anon/public key

These are automatically provided by the Lovable-Supabase integration.

## Testing the Setup

After configuring your Supabase project:

1. Register a new user in the application
2. Create a tournament
3. Verify the data is being saved to your Supabase database tables

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify your Supabase project's URL and anon key are correct
3. Ensure the SQL schema has been applied correctly
4. Verify that RLS (Row Level Security) policies are not blocking access to data

## Migration from LocalStorage

The application includes a hybrid storage approach that will gradually migrate data from localStorage to Supabase. This happens automatically when users interact with tournaments.

For a full migration, users can export their data from localStorage and import it into Supabase using the application's import/export features.
