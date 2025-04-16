import { useNavigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { UserRole } from '@/types/tournament-enums';
import type { Profile } from '@/types/user';

// Types
interface AuthContextType {
  user: Profile | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  signUp: (email: string, password: string, data: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isAuthenticated: boolean;
  updateUserProfile: (data: Partial<Profile>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Create auth context
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        // Check for session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
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

        if (mounted) {
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
        }
      } catch (error) {
        console.error('Error loading auth session:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to load session');
          setUser(null);
          toast({
            variant: 'destructive',
            title: 'Authentication error',
            description: 'Failed to load your session. Please try logging in again.',
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('[DEBUG] AuthContext: Auth state change event:', event);
      console.log('[DEBUG] AuthContext: Session state:', session ? 'exists' : 'null', session?.user?.id);

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (!session) {
          console.log('[DEBUG] AuthContext: No session found for', event);
          setUser(null);
          return;
        }

        setIsLoading(true);
        try {
          console.log('[DEBUG] AuthContext: Fetching user profile for', session.user.id);
          // Fetch profile for initial session
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('[DEBUG] AuthContext: Profile fetch error:', profileError);
            throw profileError;
          }

          if (mounted) {
            const userData = {
              id: session.user.id,
              full_name: profile?.full_name || profile?.name || '',
              display_name: profile?.display_name || profile?.name || '',
              name: profile?.name,
              email: session.user.email || '',
              phone: profile?.phone,
              avatar_url: profile?.avatar_url || null,
              role: (profile?.role || 'PLAYER') as UserRole,
              player_details: profile?.player_details || {},
              player_stats: profile?.player_stats || {
                tournaments_played: 0,
                tournaments_won: 0,
                matches_played: 0,
                matches_won: 0,
                rating: 0
              },
              preferences: profile?.preferences || {
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
              social_links: profile?.social_links || {}
            };

            console.log('[DEBUG] AuthContext: Setting user data:', userData.id);
            setUser(userData);
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('[DEBUG] AuthContext: Error in auth flow:', error);
          if (mounted) {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Failed to load user profile.',
            });
          }
        } finally {
          if (mounted) setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[DEBUG] AuthContext: User signed out');
        setUser(null);
        navigate('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

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
    setIsLoading(true);
    setError(null);
    
    try {
      // Regular Supabase authentication
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

      // Don't navigate here - let the auth state change handler do it
      // The navigation will happen in the INITIAL_SESSION or SIGNED_IN event
      
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

  const value: AuthContextType = {
    user,
    signIn,
    signOut,
    isLoading,
    signUp,
    resetPassword,
    updatePassword,
    isAuthenticated,
    updateUserProfile,
    refreshSession: async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) {
          setUser(null);
          return;
        }
        // Refresh profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) throw profileError;
        setUser(profile);
      } catch (error) {
        console.error('Error refreshing session:', error);
        toast({
          variant: 'destructive',
          title: 'Session Error',
          description: 'Failed to refresh your session.',
        });
      } finally {
        setIsLoading(false);
      }
    }
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
