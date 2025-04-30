import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Default values for local development if environment variables are not set
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://psbcrxgcfgqvrgkxilgi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYmNyeGdjZmdxdnJna3hpbGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMjI3NDUsImV4cCI6MjA1ODc5ODc0NX0.gmFiigBSe9ziFP2oFJWLqqwKbQVrZnrlJMN0uGPuzKo';

// Create and export the Supabase client
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

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Real-time subscription helpers - keeping these as they were
export const subscribeToMatches = (tournamentId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`matches:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};
