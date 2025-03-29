import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, UserCredentials } from '@/types/user';

export class SupabaseAuthService {
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Unable to get current user.');
      return null;
    }
    
    const { data } = await supabase.auth.getSession();
    
    if (!data.session) {
      return null;
    }
    
    // Get the user profile from the profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();
    
    return {
      id: data.session.user.id,
      email: data.session.user.email || '',
      name: profile?.name || data.session.user.email?.split('@')[0] || '',
      createdAt: data.session.user.created_at || new Date().toISOString(),
      isVerified: data.session.user.email_confirmed_at !== null,
      role: (profile?.role as "admin" | "user") || 'user',
    };
  }

  async login(credentials: UserCredentials): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Unable to log in.');
      throw new Error('Supabase is not configured. Please set up your Supabase project first.');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    
    if (error) {
      console.error('Login error:', error.message);
      throw new Error(error.message);
    }
    
    if (!data.user) {
      return null;
    }
    
    // Get the user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    return {
      id: data.user.id,
      email: data.user.email || '',
      name: profile?.name || data.user.email?.split('@')[0] || '',
      createdAt: data.user.created_at || new Date().toISOString(),
      isVerified: data.user.email_confirmed_at !== null,
      role: (profile?.role as "admin" | "user") || 'user',
    };
  }

  async register(credentials: UserCredentials, name: string): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Unable to register.');
      throw new Error('Supabase is not configured. Please set up your Supabase project first.');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });
    
    if (error) {
      console.error('Registration error:', error.message);
      throw new Error(error.message);
    }
    
    if (!data.user) {
      return null;
    }
    
    // Create a profile for the new user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        name,
        role: 'user',
      });
    
    if (profileError) {
      console.error('Error creating user profile:', profileError);
    }
    
    return {
      id: data.user.id,
      email: data.user.email || '',
      name,
      createdAt: data.user.created_at || new Date().toISOString(),
      isVerified: false, // New users need to verify email
      role: 'user',
    };
  }

  async logout(): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Unable to log out.');
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      throw new Error(error.message);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Unable to reset password.');
      throw new Error('Supabase is not configured. Please set up your Supabase project first.');
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('Password reset error:', error.message);
      throw new Error(error.message);
    }
  }

  async updateUserProfile(user: Partial<User>): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Unable to update profile.');
      throw new Error('Supabase is not configured. Please set up your Supabase project first.');
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      throw new Error('Not authenticated');
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        name: user.name,
      })
      .eq('id', sessionData.session.user.id);
    
    if (error) {
      console.error('Update profile error:', error.message);
      throw new Error(error.message);
    }
    
    return this.getCurrentUser();
  }
}

// Export a singleton instance
export const supabaseAuthService = new SupabaseAuthService();
