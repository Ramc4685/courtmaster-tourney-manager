import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/entities';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface TournamentUserRole {
  userId: string;
  tournamentId: string;
  role: 'owner' | 'admin' | 'participant';
}

export class SupabaseAuthService {
  private tournamentRoles: TournamentUserRole[] = [];

  async getCurrentUser(): Promise<Profile | null> {
    try {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        return null;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      
      if (!profile) {
        console.error('Profile not found for user:', data.session.user.id);
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async login(email: string, password: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.user) {
        return null;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return profile;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: { email: string; password: string; name: string }): Promise<Profile | null> {
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
        throw new Error(error.message);
      }
      
      if (!data.user) {
        return null;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return profile;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
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
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error during password reset:', error);
      throw error;
    }
  }

  async updateUserProfile(userData: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', sessionData.session.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Role checking functions
  isTournamentAdmin(userId: string, tournamentId: string): boolean {
    return this.hasRole(userId, tournamentId, 'owner') || 
           this.hasRole(userId, tournamentId, 'admin');
  }

  hasRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    return this.tournamentRoles.some(
      tr => tr.userId === userId && tr.tournamentId === tournamentId && tr.role === role
    );
  }

  addTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    try {
      if (!this.tournamentRoles.some(
        tr => tr.userId === userId && tr.tournamentId === tournamentId && tr.role === role
      )) {
        this.tournamentRoles.push({ userId, tournamentId, role });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding tournament role:', error);
      return false;
    }
  }

  removeTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    try {
      const index = this.tournamentRoles.findIndex(
        tr => tr.userId === userId && tr.tournamentId === tournamentId && tr.role === role
      );
      if (index !== -1) {
        this.tournamentRoles.splice(index, 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing tournament role:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const supabaseAuthService = new SupabaseAuthService();
