import { useNavigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/lib/database.types';
import { User } from '@supabase/supabase-js';

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbProfileInsert = Database['public']['Tables']['profiles']['Insert'];

// Add error types
type AuthErrorType = 
  | 'INVALID_CREDENTIALS'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'PROFILE_ERROR'
  | 'SESSION_ERROR'
  | 'UNKNOWN_ERROR';

interface AuthError {
  type: AuthErrorType;
  message: string;
  originalError?: unknown;
}

interface AuthContextType {
  user: DbProfile | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  sessionChecked: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: Partial<DbProfile>) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  // Alias methods for components that use different naming conventions
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  // For backward compatibility
  demoMode?: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseAuthError(error: unknown): AuthError {
  console.log('[AuthContext] Parsing error:', error);
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials')) {
      return { type: 'INVALID_CREDENTIALS', message: 'Invalid email or password', originalError: error };
    }
    if (message.includes('rate limit')) {
      return { type: 'RATE_LIMIT', message: 'Too many attempts. Please try again later', originalError: error };
    }
    if (message.includes('network') || message.includes('fetch')) {
      return { type: 'NETWORK_ERROR', message: 'Network connection error', originalError: error };
    }
    if (message.includes('profile')) {
      return { type: 'PROFILE_ERROR', message: 'Error accessing user profile', originalError: error };
    }
    if (message.includes('session')) {
      return { type: 'SESSION_ERROR', message: 'Session error', originalError: error };
    }
  }
  
  return { 
    type: 'UNKNOWN_ERROR', 
    message: 'An unexpected error occurred', 
    originalError: error 
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const clearError = () => {
    if (error) {
      console.log('[AuthContext] Clearing error');
      setError(null);
    }
  };

  const fetchProfile = async (userId: string) => {
    console.log('[AuthContext] Fetching profile for user:', userId);
    const startTime = performance.now();
    
    try {
      // First try to get the profile through RPC function
      const { data: rpcProfile, error: rpcError } = await supabase
        .rpc('get_user_profile', { user_id: userId });
        
      if (!rpcError && rpcProfile) {
        const endTime = performance.now();
        console.log(`[AuthContext] Fetched existing profile via RPC in ${Math.round(endTime - startTime)}ms:`, rpcProfile);
        return rpcProfile;
      }

      // If RPC fails or profile doesn't exist, try direct query
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.log('[AuthContext] Profile fetch error:', profileError);
        
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          console.log('[AuthContext] Profile not found, creating new profile');
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.user) {
            throw new Error('No user session available for profile creation');
          }
          
          // Get user email from session
          const email = session.session.user.email;
          const displayName = email ? email.split('@')[0] : 'User';
          
          // Try to create profile through RPC function first
          const { data: rpcCreatedProfile, error: rpcCreateError } = await supabase
            .rpc('create_user_profile', { 
              user_id: userId,
              user_email: email,
              display_name: displayName
            });
            
          if (!rpcCreateError && rpcCreatedProfile) {
            const endTime = performance.now();
            console.log(`[AuthContext] Created new profile via RPC in ${Math.round(endTime - startTime)}ms:`, rpcCreatedProfile);
            return rpcCreatedProfile;
          }

          // If RPC fails, try direct insert
          const newProfile = {
            id: userId,
            full_name: displayName,
            display_name: displayName,
            role: 'player',
            email: email,
            player_stats: {
              matches_played: 0,
              matches_won: 0,
              tournaments_played: 0,
              tournaments_won: 0,
              rating: 1000,
              ranking: null
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
              },
              display: {
                theme: 'light',
                language: 'en'
              }
            }
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (createError) {
            console.error('[AuthContext] Error creating profile:', createError);
            throw new Error(`Failed to create user profile: ${createError.message}`);
          }
          
          const endTime = performance.now();
          console.log(`[AuthContext] Created new profile via direct insert in ${Math.round(endTime - startTime)}ms:`, createdProfile);
          return createdProfile;
        }
        
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }

      const endTime = performance.now();
      console.log(`[AuthContext] Fetched existing profile via direct query in ${Math.round(endTime - startTime)}ms:`, profile);
      return profile;
    } catch (error) {
      console.error('[AuthContext] Error in fetchProfile:', error);
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('[AuthContext] Initializing auth state');
    let mounted = true;

    const loadSession = async () => {
      try {
        console.log('[AuthContext] Loading session');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthContext] Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log('[AuthContext] No session found');
          if (mounted) {
            setUser(null);
            setIsLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        console.log('[AuthContext] Session found, fetching profile');
        const profile = await fetchProfile(session.user.id);
        if (mounted) {
          console.log('[AuthContext] Setting user profile:', profile);
          setUser(profile);
          setIsLoading(false);
          setSessionChecked(true);
        }
      } catch (error) {
        console.error('[AuthContext] Error loading session:', error);
        if (mounted) {
          setError(parseAuthError(error));
          setIsLoading(false);
          setSessionChecked(true);
        }
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, {
        hasSession: !!session,
        currentUser: !!user
      });

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('[AuthContext] User signed in, fetching profile');
          try {
            const profile = await fetchProfile(session.user.id);
            if (mounted) {
              setUser(profile);
              setSessionChecked(true);
            }
          } catch (error) {
            console.error('[AuthContext] Error fetching profile after auth state change:', error);
            if (mounted) {
              setError(parseAuthError(error));
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out');
        if (mounted) {
          setUser(null);
          setSessionChecked(true);
          navigate('/', { replace: true });
        }
      }
    });

    return () => {
      console.log('[AuthContext] Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] Attempting sign in:', { email });
    const startTime = performance.now();
    clearError();
    
    try {
      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[AuthContext] Sign in error:', signInError);
        const parsedError = parseAuthError(signInError);
        setError(parsedError);
        throw signInError;
      }

      if (!authUser) {
        console.error('[AuthContext] No user returned after sign in');
        const error = new Error('No user returned after sign in');
        setError(parseAuthError(error));
        throw error;
      }

      console.log('[AuthContext] Sign in successful, fetching profile');
      const profile = await fetchProfile(authUser.id);
      setUser(profile);
      
      const endTime = performance.now();
      console.log(`[AuthContext] Sign in process completed in ${Math.round(endTime - startTime)}ms`);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate('/tournaments');
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error);
      const parsedError = parseAuthError(error);
      setError(parsedError);
      toast({
        title: 'Sign in failed',
        description: parsedError.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authUser) {
        throw new Error('No user returned after sign up');
      }

      const newProfile: DbProfileInsert = {
        id: authUser.id,
        full_name: fullName,
        display_name: fullName.split(' ')[0],
        role: 'player',
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      setUser(profile);
      toast({
        title: 'Welcome to CourtMaster!',
        description: 'Your account has been created successfully.',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Sign up error:', error);
      setError(parseAuthError(error));
      toast({
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'Failed to sign up',
        variant: 'destructive',
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      navigate('/');
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setError(parseAuthError(error));
      toast({
        title: 'Sign out failed',
        description: error instanceof Error ? error.message : 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  const updateUserProfile = async (profile: Partial<DbProfile>) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUser(data);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Profile update error:', error);
      setError(parseAuthError(error));
      toast({
        title: 'Profile update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      if (!session) {
        setUser(null);
        return;
      }

      const profile = await fetchProfile(session.user.id);
      setUser(profile);
    } catch (error) {
      console.error('Session refresh error:', error);
      setError(parseAuthError(error));
    }
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    error,
    isAuthenticated,
    sessionChecked,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    refreshSession,
    clearError,
    // Aliases for compatibility
    register: signUp,
    logout: signOut,
    demoMode: false,
  }), [user, isLoading, error, isAuthenticated, sessionChecked]);

  // Don't render children until initial session check is complete
  if (!sessionChecked) {
    console.log('[AuthContext] Waiting for session check');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
