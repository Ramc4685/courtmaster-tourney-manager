
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// These environment variables are automatically provided by Lovable's Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are set.');
}

// Create a Supabase client with fallback for development
export const supabase = createClient<Database>(
  supabaseUrl || 'https://your-project.supabase.co', // Fallback URL, won't actually work but prevents runtime crash
  supabaseAnonKey || 'public-anon-key-placeholder'    // Fallback key, won't actually work but prevents runtime crash
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey;
};
