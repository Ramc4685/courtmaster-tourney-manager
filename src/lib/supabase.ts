
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// These environment variables are automatically provided by Lovable's Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
