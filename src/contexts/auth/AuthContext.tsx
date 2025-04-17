import { useNavigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/lib/database.types';
import { User } from '@supabase/supabase-js';

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbProfileInsert = Database['public']['Tables']['profiles']['Insert'];

interface AuthContextType {
  user: DbProfile | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: Partial<DbProfile>) => Promise<void>;
  refreshSession: () => Promise<void>;
  // Alias methods for components that use different naming conventions
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  // For backward compatibility
  demoMode?: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const fetchProfile = async (userId: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    return profile;
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } catch (error) {
        console.error('Error loading session:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!authUser) {
        throw new Error('No user returned after sign in');
      }

      const profile = await fetchProfile(authUser.id);
      setUser(profile);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Failed to sign in',
        variant: 'destructive',
      });
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
      setError(error instanceof Error ? error.message : 'Failed to sign up');
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
      setError(error instanceof Error ? error.message : 'Failed to refresh session');
    }
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    refreshSession,
    // Aliases for compatibility
    register: signUp,
    logout: signOut,
    demoMode: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
