import { useNavigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { account } from '@/lib/appwrite'; // For OAuth
import type { Profile as DbProfile } from '@/types/entities';

export interface AuthError {
  type: string;
  message: string;
  originalError?: unknown;
}

import { toast } from '@/components/ui/use-toast';
import { appwriteAuthService } from '@/services/auth/AppwriteAuthService';

export interface AuthContextType {
  user: DbProfile | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  sessionChecked: boolean;
  signIn: (email: string, password: string) => Promise<DbProfile | null>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profileData: Partial<DbProfile>) => Promise<void>;
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
    
    if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
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
  const navigate = useNavigate();
  const [user, setUser] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [sessionChecked, setSessionChecked] = useState<boolean>(false);

  const isAuthenticated = !!user;

  const clearError = useCallback(() => {
    if (error) {
      setError(null);
    }
  }, [error]);

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await appwriteAuthService.getCurrentUser();
      setUser(profile);
    } catch (err) {
      // This is not a critical error, just means no session
      setUser(null);
    } finally {
      setSessionChecked(true);
      setIsLoading(false);
    }
  }, []);

  // Load session on mount
  useEffect(() => {
    if (!sessionChecked) {
      refreshSession();
    }
  }, [sessionChecked, refreshSession]);

  const signIn = useCallback(async (email: string, password: string): Promise<DbProfile | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userSession = await appwriteAuthService.login(email, password);
      if (!userSession) {
        throw new Error('Failed to login');
      }
      
      const profile = await appwriteAuthService.getCurrentUser();
      setUser(profile);
      return profile;
    } catch (err) {
      console.error('Error signing in:', err);
      const parsedError = parseAuthError(err);
      setError(parsedError);
      throw parsedError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await account.createOAuth2Session(
        'google' as any,
        `${window.location.origin}/auth/callback`,
        `${window.location.origin}/auth/callback/error`
      );
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError(parseAuthError(err));
      setIsLoading(false);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await account.createOAuth2Session(
        'apple' as any,
        `${window.location.origin}/auth/callback`,
        `${window.location.origin}/auth/callback/error`
      );
    } catch (err) {
      console.error('Error signing in with Apple:', err);
      setError(parseAuthError(err));
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await appwriteAuthService.register({
        email,
        password,
        name: fullName
      });
      
      // After successful registration, sign the user in to create a session and get the profile
      const profile = await signIn(email, password);
      if (!profile) {
        throw new Error('Failed to sign in after registration');
      }

      // No need to call setUser here, as signIn already does it.
      navigate('/');
    } catch (err) {
      console.error('Error signing up:', err);
      setError(parseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await appwriteAuthService.logout();
      setUser(null);
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setError(parseAuthError(err));
      toast({
        title: 'Sign out failed',
        description: 'An error occurred while signing out.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const updateUserProfile = useCallback(async (profileData: Partial<DbProfile>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    try {
      setIsLoading(true);
      const updatedProfile = await appwriteAuthService.updateUserProfile(profileData);
      
      if (!updatedProfile) {
        throw new Error('Failed to update profile');
      }
      
      setUser(updatedProfile);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(parseAuthError(err));
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    isLoading,
    error,
    isAuthenticated,
    sessionChecked,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signUp,
    signOut,
    updateUserProfile,
    refreshSession,
    clearError,
    register: signUp,
    logout: signOut,
    demoMode: false,
  }), [user, isLoading, error, isAuthenticated, sessionChecked, signIn, signInWithGoogle, signInWithApple, signUp, signOut, updateUserProfile, refreshSession, clearError]);

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

