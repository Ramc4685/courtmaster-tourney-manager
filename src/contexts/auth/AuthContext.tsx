import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, UserRole } from '@/types/entities';
import { AuthContextType } from '@/types/user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  isLoading: true,
  error: null,
  isDemo: false,
  updateUserProfile: async () => {}
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          await fetchUser(session.user.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get session');
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      setError(null);
      try {
        if (event === 'SIGNED_IN' && session) {
          await fetchUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update auth state');
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const fetchUser = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setUser(profile as Profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email?: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && email === 'demo@example.com' && password === 'demodemo') {
        setIsDemo(true);
        const demoUser: Profile = {
          id: 'demo-user-id',
          full_name: 'Demo User',
          display_name: 'Demo',
          email: 'demo@example.com',
          role: UserRole.PLAYER,
        };
        setUser(demoUser);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email!,
          password: password!,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: authResponse, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: data.fullName,
            display_name: data.displayName,
            role: data.role || UserRole.PLAYER,
          },
        },
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authResponse.user!.id,
          full_name: data.fullName,
          display_name: data.displayName,
          email: email,
          role: data.role || UserRole.PLAYER,
        });

      if (profileError) throw profileError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isDemo) {
        setIsDemo(false);
        setUser(null);
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Add the updateUserProfile function
  const updateUserProfile = async (profileData: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name || user.full_name,
          display_name: profileData.display_name || user.display_name,
          avatar_url: profileData.avatar_url || user.avatar_url,
          phone: profileData.phone || user.phone,
          // Include any other fields that need updating
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser!,
        ...profileData
      }));
    } catch (error) {
      console.error('Error updating user profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isLoading,
    error,
    isDemo,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
