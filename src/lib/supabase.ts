
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Using the values from the Supabase integration
const SUPABASE_URL = "https://psbcrxgcfgqvrgkxilgi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYmNyeGdjZmdxdnJna3hpbGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjI3NDUsImV4cCI6MjA1ODc5ODc0NX0.gmFiigBSe9ziFP2oFJWLqqwKbQVrZnrlJMN0uGPuzKo";

// Create a Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
  }
});

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!SUPABASE_URL && !!SUPABASE_PUBLISHABLE_KEY;
};
