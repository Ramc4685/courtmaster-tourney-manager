
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Default values for local development if environment variables are not set
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://psbcrxgcfgqvrgkxilgi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYmNyeGdjZmdxdnJna3hpbGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjI3NDUsImV4cCI6MjA1ODc5ODc0NX0.gmFiigBSe9ziFP2oFJWLqqwKbQVrZnrlJMN0uGPuzKo';

// Log which Supabase URL we're using (but don't expose full key in logs)
console.log(`[Supabase] Using URL: ${SUPABASE_URL}`);
console.log(`[Supabase] Using authentication: ${SUPABASE_PUBLISHABLE_KEY ? 'Yes (key provided)' : 'No (missing key)'}`);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: import.meta.env.DEV
  },
  global: {
    headers: {
      'x-application-name': 'courtmaster'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
