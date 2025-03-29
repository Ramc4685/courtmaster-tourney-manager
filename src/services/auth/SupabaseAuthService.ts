
import { supabase } from '@/lib/supabase';
import { User, UserCredentials, TournamentUserRole } from '@/types/user';

export class SupabaseAuthService {
  private tournamentRoles: TournamentUserRole[] = [];
  
  async getCurrentUser(): Promise<User | null> {
    try {
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
        // Use auth user's email if profile email doesn't exist
        email: data.session.user.email || '',
        name: profile.name || data.session.user.email?.split('@')[0] || '',
        createdAt: profile.created_at || data.session.user.created_at || new Date().toISOString(),
        isVerified: data.session.user.email_confirmed_at !== null,
        role: (profile.role as "admin" | "user") || 'user',
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async login(credentials: UserCredentials): Promise<User | null> {
    try {
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
        // Use auth user's email instead of profile email
        email: data.user.email || '',
        name: profile?.name || data.user.email?.split('@')[0] || '',
        createdAt: profile?.created_at || data.user.created_at || new Date().toISOString(),
        isVerified: data.user.email_confirmed_at !== null,
        role: (profile?.role as "admin" | "user") || 'user',
      };
    } catch (error) {
      console.error('Error during login:', error);
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
        role: 'user',
      };
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error during logout:', error);
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

  // Check if a user has admin rights (owner or admin) for a tournament
  isTournamentAdmin(userId: string, tournamentId: string): boolean {
    return this.hasRole(userId, tournamentId, 'owner') || 
           this.hasRole(userId, tournamentId, 'admin');
  }

  // Check if a user has a specific role for a tournament
  hasRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
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
