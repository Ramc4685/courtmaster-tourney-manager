
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, Profile } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/types/tournament-enums';

// Create auth context
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      try {
        // Check for session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Get user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        // Convert profile data to our Profile type with proper defaults
        setUser({
          id: profile.id,
          name: profile.name,
          full_name: profile.full_name || profile.name || '',
          display_name: profile.display_name || profile.name || '',
          email: profile.email || '',
          phone: profile.phone,
          avatar_url: profile.avatar_url || null,
          role: profile.role as UserRole,
          player_details: profile.player_details || {},
          player_stats: profile.player_stats || {
            tournaments_played: 0,
            tournaments_won: 0,
            matches_played: 0,
            matches_won: 0,
            rating: 0
          },
          preferences: profile.preferences || {
            notifications: {
              email: true,
              push: true,
              tournament_updates: true,
              match_reminders: true
            },
            privacy: {
              show_profile: true,
              show_stats: true,
              show_history: true
            }
          },
          social_links: profile.social_links || {}
        });
      } catch (error) {
        console.error('Error loading auth session:', error);
        setError(error instanceof Error ? error.message : 'Failed to load session');
        setUser(null);
        toast({
          variant: 'destructive',
          title: 'Authentication error',
          description: 'Failed to load your session. Please try logging in again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Fetch profile after sign-in
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profileError) {
          setUser({
            id: profile.id,
            full_name: profile.full_name || profile.name || '',
            display_name: profile.display_name || profile.name || '',
            name: profile.name,
            email: profile.email || '',
            phone: profile.phone,
            avatar_url: profile.avatar_url || null,
            role: profile.role as UserRole,
            player_details: profile.player_details || {},
            player_stats: profile.player_stats || {
              tournaments_played: 0,
              tournaments_won: 0,
              matches_played: 0,
              matches_won: 0,
              rating: 0
            },
            preferences: profile.preferences || {
              notifications: {
                email: true,
                push: true,
                tournament_updates: true,
                match_reminders: true
              },
              privacy: {
                show_profile: true,
                show_stats: true,
                show_history: true
              }
            },
            social_links: profile.social_links || {}
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      // Create profile for new user
      if (authData.user) {
        // Need to update this to match the schema
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: data.fullName,
            full_name: data.fullName,
            display_name: data.displayName || data.fullName,
            email: email,
            role: UserRole.PLAYER,  // Default role for new users
            player_details: {},
            player_stats: {
              tournaments_played: 0,
              tournaments_won: 0,
              matches_played: 0,
              matches_won: 0,
              rating: 0
            }
          });

        toast({
          title: 'Account created',
          description: 'Your account has been created successfully! Please check your email for verification.',
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create account');
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Failed to create account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    if (isDemo) return true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Navigate to dashboard after successful login
      navigate('/dashboard');
      
      toast({
        title: 'Logged in successfully',
        description: 'Welcome back!',
      });
      
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Failed to sign in',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    if (isDemo) {
      setIsDemo(false);
      setUser(null);
      navigate('/login');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      navigate('/login');
      
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for a link to reset your password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset password');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send reset email. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update password function
  const updatePassword = async (password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully.',
      });
    } catch (error) {
      console.error('Update password error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update password');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile function
  const updateUserProfile = async (data: Partial<Profile>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          full_name: data.full_name,
          display_name: data.display_name,
          phone: data.phone,
          avatar_url: data.avatar_url,
          player_details: data.player_details,
          player_stats: data.player_stats,
          preferences: data.preferences,
          social_links: data.social_links
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...data } : null);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enable demo mode function
  const enableDemoMode = (enable: boolean) => {
    setIsDemo(enable);
    
    if (enable) {
      // Set a demo user
      setUser({
        id: 'demo-user',
        name: 'Demo User',
        full_name: 'Demo User',
        display_name: 'Demo User',
        email: 'demo@example.com',
        role: UserRole.ORGANIZER,
        player_details: {},
        player_stats: {
          tournaments_played: 0,
          tournaments_won: 0,
          matches_played: 0,
          matches_won: 0,
          rating: 0
        },
        preferences: {
          notifications: {
            email: true,
            push: true,
            tournament_updates: true,
            match_reminders: true
          },
          privacy: {
            show_profile: true,
            show_stats: true,
            show_history: true
          }
        },
        social_links: {}
      });
      
      navigate('/dashboard');
      
      toast({
        title: 'Demo mode activated',
        description: 'You are now using the application in demo mode.',
      });
    } else {
      setUser(null);
    }
  };

  // Add alias functions for compatibility
  const login = signIn;
  const logout = signOut;
  const register = signUp;
  const demoMode = isDemo;
  const updateProfile = updateUserProfile;

  const value: AuthContextType = {
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isLoading,
    error,
    isDemo,
    updateUserProfile,
    isAuthenticated,
    login,
    enableDemoMode,
    register,
    logout,
    demoMode,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
