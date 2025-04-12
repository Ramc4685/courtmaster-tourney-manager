import { supabase } from '@/integrations/supabase/client';
import { User, UserCredentials, TournamentUserRole } from '@/types/user';
import { initializeStorageService } from '@/services/storage/StorageService';
import type { Profile, UserRole } from '@/types/entities';
import { DEMO_USER, DEMO_ADMIN_USER } from '@/utils/demoData';

export class SupabaseAuthService {
  private tournamentRoles: TournamentUserRole[] = [];
  private demoMode: boolean = false;
  
  // Enable/disable demo mode
  public enableDemoMode(enable: boolean = true): void {
    this.demoMode = enable;
    console.log(`[DEBUG] SupabaseAuthService: Demo mode ${enable ? 'enabled' : 'disabled'}`);
  }
  
  // Check if we're in demo mode
  public isDemoMode(): boolean {
    return this.demoMode;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // If in demo mode, return a demo user
      if (this.demoMode) {
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
          console.log('[DEBUG] SupabaseAuthService: Returning demo user from localStorage');
          return JSON.parse(demoUser);
        }
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
      
      if (!profile) {
        console.error('Profile not found for user:', data.session.user.id);
        return null;
      }
      
      return {
        id: data.session.user.id,
        email: data.session.user.email || '',
        name: profile.name || data.session.user.email?.split('@')[0] || '',
        createdAt: profile.created_at || data.session.user.created_at || new Date().toISOString(),
        updatedAt: profile.updated_at,
        isVerified: data.session.user.email_confirmed_at !== null,
        role: profile.role === 'admin' ? 'admin' : 'user'
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async login(credentials: UserCredentials): Promise<User | null> {
    try {
      // Check for demo credentials
      if (this.demoMode || (credentials.email === 'demo@example.com' && credentials.password === 'demo123')) {
        console.log('[DEBUG] SupabaseAuthService: Using demo login');
        this.demoMode = true; // Automatically enable demo mode when using demo credentials
        
        // Get the appropriate demo profile
        const demoProfile = credentials.email.includes('admin') ? DEMO_ADMIN_USER : DEMO_USER;
        
        // Create a demo user from the profile
        const demoUser: User = {
          id: demoProfile.id,
          email: demoProfile.email,
          name: demoProfile.full_name || 'Demo User',
          role: demoProfile.role === 'admin' ? 'admin' : 'user',
          createdAt: demoProfile.created_at,
          updatedAt: demoProfile.updated_at,
          isVerified: true
        };
        
        // Initialize storage service in demo mode
        initializeStorageService({
          isDemoMode: true,
          demoUser: demoProfile
        });
        
        // Store demo user in localStorage
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        console.log('[DEBUG] SupabaseAuthService: Demo login successful');
        return demoUser;
      }
      
      // Regular Supabase login
      console.log('[DEBUG] SupabaseAuthService: Attempting Supabase login');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        console.error('[ERROR] SupabaseAuthService: Login error:', error.message);
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
        createdAt: profile?.created_at || data.user.created_at || new Date().toISOString(),
        updatedAt: profile?.updated_at,
        isVerified: data.user.email_confirmed_at !== null,
        role: profile?.role === 'admin' ? 'admin' : 'user'
      };
    } catch (error) {
      console.error('[ERROR] SupabaseAuthService: Error during login:', error);
      throw error;
    }
  }

  async register(userData: UserCredentials & { name: string }): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          },
        },
      });
      
      if (error) {
        console.error('Registration error:', error.message);
        throw new Error(error.message);
      }
      
      if (!data.user) {
        return null;
      }
      
      // The profile should be created automatically by the database trigger
      return {
        id: data.user.id,
        email: data.user.email || '',
        name: userData.name,
        createdAt: data.user.created_at || new Date().toISOString(),
        isVerified: data.session?.user.email_confirmed_at !== null,
        role: 'user'
      };
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Handle demo logout
      if (this.demoMode) {
        console.log('[DEBUG] SupabaseAuthService: Demo logout');
        localStorage.removeItem('demo_user');
        // Reset storage service to default
        initializeStorageService();
        this.demoMode = false;
        return;
      }
      
      // Regular Supabase logout
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[ERROR] SupabaseAuthService: Logout error:', error.message);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('[ERROR] SupabaseAuthService: Error during logout:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('Password reset error:', error.message);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error during password reset:', error);
      throw error;
    }
  }

  async updateUserProfile(userData: Partial<User>): Promise<User | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('Not authenticated');
      }
      
      // Update auth user data if email is changing
      if (userData.email) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          email: userData.email,
        });
        
        if (authUpdateError) {
          throw authUpdateError;
        }
      }
      
      // Update profile data
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          // Only update email if it's provided
          ...(userData.email && { email: userData.email }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionData.session.user.id);
      
      if (profileUpdateError) {
        throw profileUpdateError;
      }
      
      return this.getCurrentUser();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Role checking functions
  isTournamentAdmin(userId: string, tournamentId: string): boolean {
    // In demo mode, allow admin access to demo admin
    if (this.demoMode && userId === 'demo-user-id') {
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        const user = JSON.parse(demoUser);
        if (user.role === 'admin') return true;
      }
    }
    
    return this.hasRole(userId, tournamentId, 'owner') || 
           this.hasRole(userId, tournamentId, 'admin');
  }

  hasRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    // In demo mode, grant roles to demo user
    if (this.demoMode && userId === 'demo-user-id') {
      // For simplicity, in demo mode the demo user has all roles for all tournaments
      return true;
    }
    
    // First check in-memory cache
    if (this.tournamentRoles.some(
      tr => tr.userId === userId && tr.tournamentId === tournamentId && tr.role === role
    )) {
      return true;
    }
    
    // For a real implementation, we would check the database
    // This is a simplified version - in production, we would query the user_tournaments table
    return false;
  }

  // Add a role to a user for a tournament
  addTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    try {
      // In a real implementation, we would insert into the database
      // For now, just update our in-memory cache
      if (!this.tournamentRoles.some(
        tr => tr.userId === userId && tr.tournamentId === tournamentId && tr.role === role
      )) {
        this.tournamentRoles.push({ userId, tournamentId, role });
        
        // In a production implementation, we would also insert into the database
        // supabase.from('user_tournaments').insert({
        //   user_id: userId,
        //   tournament_id: tournamentId,
        //   role: role
        // });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding tournament role:', error);
      return false;
    }
  }

  // Remove a role from a user for a tournament
  removeTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    try {
      // Update our in-memory cache
      const initialLength = this.tournamentRoles.length;
      this.tournamentRoles = this.tournamentRoles.filter(
        tr => !(tr.userId === userId && tr.tournamentId === tournamentId && tr.role === role)
      );
      
      // In a production implementation, we would also delete from the database
      // supabase.from('user_tournaments').delete()
      //   .match({ user_id: userId, tournament_id: tournamentId, role: role });
      
      return this.tournamentRoles.length !== initialLength;
    } catch (error) {
      console.error('Error removing tournament role:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const supabaseAuthService = new SupabaseAuthService();
