import { useNavigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/lib/database.types';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'; // Import Session type

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbProfileInsert = Database['public']['Tables']['profiles']['Insert'];

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
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [error, setError] = useState<AuthError | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false); // Track if initial session check is done
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const clearError = useCallback(() => {
    if (error) {
      console.log('[AuthContext] Clearing error');
      setError(null);
    }
  }, [error]);

  const fetchOrCreateProfile = useCallback(async (authUser: User): Promise<DbProfile | null> => {
    console.log('[AuthContext] Fetching or creating profile for user:', authUser.id);
    const startTime = performance.now();

    try {
      // Try fetching existing profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        const endTime = performance.now();
        console.log(`[AuthContext] Fetched existing profile in ${Math.round(endTime - startTime)}ms:`, profile);
        return profile;
      }

      // Handle profile not found (PGRST116) or other errors
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[AuthContext] Error fetching profile:', profileError);
        // Check if the error is due to 'profiles' relation not existing (should not happen with correct setup)
        if (profileError.message.includes('relation "profiles" does not exist')) {
           throw new Error('Database schema error: The profiles table is missing.');
        }
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }

      // Profile not found, create a new one
      console.log('[AuthContext] Profile not found, creating new profile');
      const email = authUser.email; // Email is available from authUser
      const displayName = email ? email.split('@')[0] : 'User';
      const fullName = displayName; // Use display name as full name initially

      // *** FIX: Adjusted fields to match the actual schema (id, full_name, role, player_stats, preferences) ***
      const newProfile: DbProfileInsert = {
        id: authUser.id,
        full_name: fullName,
        role: 'player', // Default role
        // avatar_url: null, // Optional: Set initial avatar URL if desired
        // Initialize JSON fields with default structures
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
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('[AuthContext] Error creating profile:', createError);
        // Provide more specific error message if possible
        if (createError.message.includes('duplicate key value violates unique constraint')) {
            throw new Error('Failed to create profile: A profile for this user already exists.');
        }
        throw new Error(`Failed to create user profile: ${createError.message}`);
      }

      const endTime = performance.now();
      console.log(`[AuthContext] Created new profile in ${Math.round(endTime - startTime)}ms:`, createdProfile);
      return createdProfile;

    } catch (err) {
      console.error('[AuthContext] Error in fetchOrCreateProfile:', err);
      setError(parseAuthError(err));
      return null;
    }
  }, []);

  // Effect for handling initial session load and auth state changes
  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    let mounted = true;

    // Function to handle setting user state and navigation
    const handleAuthStateChange = async (event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      console.log('[AuthContext] Auth state changed:', event, session ? 'Session found' : 'No session');
      
      const authUser = session?.user ?? null;

      if (authUser) {
        console.log('[AuthContext] User session detected, fetching/creating profile');
        setIsLoading(true);
        const profile = await fetchOrCreateProfile(authUser);
        if (mounted) {
          setUser(profile);
          setIsLoading(false);
          console.log('[AuthContext] User state updated with profile:', profile ? profile.id : 'null');
          // Navigate on successful sign-in or initial session load with user
          if (profile && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            console.log('[AuthContext] Navigating to /tournaments after profile load');
            navigate('/tournaments', { replace: true });
          }
        }
      } else {
        console.log('[AuthContext] No user session detected');
        setUser(null);
        setIsLoading(false);
        console.log('[AuthContext] User state set to null');
        // Navigate to login on sign out or if initial session is null
        if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !authUser)) {
           console.log('[AuthContext] Navigating to / on SIGNED_OUT or null initial session');
           navigate('/', { replace: true });
        }
      }
      // Mark session as checked only after the first determination
      if (!sessionChecked && event === 'INITIAL_SESSION') {
         setSessionChecked(true);
         console.log('[AuthContext] Initial session check complete');
      }
    };

    // Check initial session state
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange('INITIAL_SESSION', session);
    }).catch(error => {
        console.error('[AuthContext] Error during initial getSession:', error);
        if (mounted) {
            setError(parseAuthError(error));
            setIsLoading(false);
            setSessionChecked(true); // Mark as checked even on error
            navigate('/', { replace: true }); // Navigate home on error during initial load
        }
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session);
    });

    // Cleanup function
    return () => {
      console.log('[AuthContext] Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrCreateProfile, navigate]); // Dependencies: fetchOrCreateProfile, navigate

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[AuthContext] Attempting sign in:', { email });
    const startTime = performance.now();
    clearError();
    setIsLoading(true);
    
    try {
      const { data: { user: authUser, session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[AuthContext] Sign in error:', signInError);
        throw signInError; // Let the state change handler manage profile fetching & navigation
      }

      if (!authUser || !session) {
        console.error('[AuthContext] No user or session returned after sign in');
        throw new Error('Sign in failed: No user or session returned');
      }
      
      // The onAuthStateChange listener will handle setting the user state, profile, and navigation
      console.log('[AuthContext] Sign in successful via Supabase, waiting for state change handler');
      const endTime = performance.now();
      console.log(`[AuthContext] signIn call completed in ${Math.round(endTime - startTime)}ms`);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });

    } catch (error) {
      console.error('[AuthContext] Sign in process error:', error);
      const parsedError = parseAuthError(error);
      setError(parsedError);
      setIsLoading(false); // Ensure loading is stopped on error
      toast({
        title: 'Sign in failed',
        description: parsedError.message,
        variant: 'destructive',
      });
      throw error; // Re-throw for the calling component (e.g., LoginPage)
    }
  }, [clearError]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    console.log('[AuthContext] Attempting sign up:', { email });
    clearError();
    setIsLoading(true);
    try {
      const { data: { user: authUser, session }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // data: { // Cannot set profile data directly during signup if columns don't match
          //   full_name: fullName,
          // }
        }
      });

      if (signUpError) {
        console.error('[AuthContext] Sign up error:', signUpError);
        throw signUpError;
      }

      if (!authUser || !session) {
        console.error('[AuthContext] No user or session returned after sign up');
        throw new Error('Sign up failed: No user or session returned');
      }

      // The onAuthStateChange listener will handle profile creation/fetching
      console.log('[AuthContext] Sign up successful via Supabase, waiting for state change handler');
      
      toast({
        title: 'Welcome to CourtMaster!',
        description: 'Your account has been created. Please check your email to verify.', // Inform about verification
      });
      // Navigation handled by state change listener

    } catch (error) {
      console.error('[AuthContext] Sign up process error:', error);
      const parsedError = parseAuthError(error);
      setError(parsedError);
      setIsLoading(false);
      toast({
        title: 'Sign up failed',
        description: parsedError.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [clearError]);

  const signOut = useCallback(async () => {
    console.log('[AuthContext] Attempting sign out');
    clearError();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Sign out error:', error);
        throw error;
      }
      // State update and navigation handled by onAuthStateChange listener
      console.log('[AuthContext] Sign out successful via Supabase');
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      console.error('[AuthContext] Sign out process error:', error);
      const parsedError = parseAuthError(error);
      setError(parsedError);
      setIsLoading(false);
      toast({
        title: 'Sign out failed',
        description: parsedError.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [clearError]);

  const updateUserProfile = useCallback(async (profileUpdate: Partial<DbProfile>) => {
    if (!user) {
      console.error('[AuthContext] Cannot update profile: No user logged in');
      setError({ type: 'SESSION_ERROR', message: 'You must be logged in to update your profile' });
      return;
    }
    console.log('[AuthContext] Attempting profile update for user:', user.id, profileUpdate);
    clearError();
    // Optimistic UI update can be added here if desired
    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('[AuthContext] Profile update error:', updateError);
        throw updateError;
      }

      setUser(data); // Update local state with the new profile data
      console.log('[AuthContext] Profile updated successfully');
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('[AuthContext] Profile update process error:', error);
      const parsedError = parseAuthError(error);
      setError(parsedError);
      // Revert optimistic UI update here if implemented
      toast({
        title: 'Profile update failed',
        description: parsedError.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [user, clearError]);

  const refreshSession = useCallback(async () => {
    console.log('[AuthContext] Attempting to refresh session');
    clearError();
    setIsLoading(true);
    try {
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('[AuthContext] Session refresh error:', refreshError);
        throw refreshError;
      }
      // The onAuthStateChange listener should handle the update if the session changes
      console.log('[AuthContext] Session refresh successful via Supabase:', session ? 'Session active' : 'No session');
      if (!session) {
         setUser(null);
      }
      // Explicitly set loading false if state handler doesn't trigger fast enough
      setIsLoading(false);
    } catch (error) {
      console.error('[AuthContext] Session refresh process error:', error);
      const parsedError = parseAuthError(error);
      setError(parsedError);
      setUser(null); // Assume session is invalid on error
      setIsLoading(false);
      throw error;
    }
  }, [clearError]);

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
    register: signUp, // Alias
    logout: signOut,   // Alias
    demoMode: false,
  }), [user, isLoading, error, isAuthenticated, sessionChecked, signIn, signUp, signOut, updateUserProfile, refreshSession, clearError]);

  // Render loading indicator only if the initial session check is not complete
  if (!sessionChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

