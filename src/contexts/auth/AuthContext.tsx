
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthContextType, UserCredentials, RegisterData } from './types';
import { Profile } from '@/types/entities';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user profile:', error);
          } else if (data) {
            setUser({
              id: data.id,
              name: data.full_name || data.name || '',
              full_name: data.full_name || data.name || '',
              display_name: data.display_name || data.name || '',
              email: data.email || session.user.email || '',
              phone: data.phone || '',
              avatar_url: data.avatar_url || '',
              role: data.role || 'player',
              preferences: data.preferences || {},
              player_stats: data.player_stats || {
                total_matches: 0,
                wins: 0,
                losses: 0,
                tournaments_played: 0,
                tournaments_won: 0,
                average_points_per_set: 0,
                win_percentage: 0
              }
            });
          }
        }
      } catch (error) {
        console.error('Error during session check:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user profile:', error);
          } else if (data) {
            setUser({
              id: data.id,
              name: data.full_name || data.name || '',
              full_name: data.full_name || data.name || '',
              display_name: data.display_name || data.name || '',
              email: data.email || session.user.email || '',
              phone: data.phone || '',
              avatar_url: data.avatar_url || '',
              role: data.role || 'player',
              preferences: data.preferences || {},
              player_stats: data.player_stats || {
                total_matches: 0,
                wins: 0,
                losses: 0,
                tournaments_played: 0,
                tournaments_won: 0,
                average_points_per_set: 0,
                win_percentage: 0
              }
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    fetchUserData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email?: string, password?: string) => {
    if (demoMode) {
      // Set a demo user
      setUser({
        id: 'demo-user',
        name: 'Demo User',
        full_name: 'Demo User',
        display_name: 'Demo User',
        email: 'demo@example.com',
        role: 'admin',
        // Add other required fields
        player_stats: {
          total_matches: 10,
          wins: 8,
          losses: 2,
          tournaments_played: 3,
          tournaments_won: 1,
          average_points_per_set: 15.5,
          win_percentage: 80
        }
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email || '',
        password: password || '',
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, data: { full_name: string, display_name: string, role: string }) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: data.full_name,
            display_name: data.display_name,
            role: data.role,
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    if (demoMode) {
      setUser(null);
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Sign out error:', error.message);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error("No user logged in");
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          phone: data.phone,
          // Add other fields as needed
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local user state
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, ...data };
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      console.error('Update profile error:', error.message);
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add updateUserProfile function to match AuthContextType
  const updateUserProfile = async (data: Partial<Profile>) => {
    return updateProfile(data);
  };

  // Legacy methods for compatibility
  const login = async (credentials: UserCredentials): Promise<boolean> => {
    try {
      await signIn(credentials.email, credentials.password);
      return true;
    } catch (error) {
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      await signUp(data.email, data.password, {
        full_name: data.name,
        display_name: data.name,
        role: 'player',
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    await signOut();
  };

  const enableDemoMode = (enabled: boolean) => {
    setDemoMode(enabled);
    if (enabled) {
      // Set demo user
      setUser({
        id: 'demo-user',
        name: 'Demo User',
        full_name: 'Demo User',
        display_name: 'Demo User',
        email: 'demo@example.com',
        role: 'admin',
        // Add other required fields
        player_stats: {
          total_matches: 10,
          wins: 8,
          losses: 2,
          tournaments_played: 3,
          tournaments_won: 1,
          average_points_per_set: 15.5,
          win_percentage: 80
        }
      });
    } else {
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isDemoMode: demoMode,
    demoMode,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateUserProfile,
    login,
    register,
    logout,
    enableDemoMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
