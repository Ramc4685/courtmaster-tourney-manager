
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, UserCredentials } from '@/types/user';
import { supabaseAuthService } from '@/services/auth/SupabaseAuthService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  login: (credentials: UserCredentials) => Promise<boolean>;
  register: (userData: UserCredentials & { name: string }) => Promise<boolean>;
  logout: () => void;
  isAdmin: (tournamentId: string) => boolean;
  isOwner: (tournamentId: string) => boolean;
  isParticipant: (tournamentId: string) => boolean;
  addTournamentRole: (userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant') => boolean;
  removeTournamentRole: (userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant') => boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check for existing user session on mount and set up auth state change listener
  useEffect(() => {
    console.log('[DEBUG] AuthContext: Setting up auth state listener');
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[DEBUG] AuthContext: Auth state changed: ${event}`, session?.user?.email || 'No user');
        
        setIsLoading(true);
        
        if (session?.user) {
          try {
            // Instead of making a separate call, just get user data from supabaseAuthService
            const currentUser = await supabaseAuthService.getCurrentUser();
            console.log('[DEBUG] AuthContext: User session found', currentUser);
            setUser(currentUser);
          } catch (error) {
            console.error('[ERROR] AuthContext: Error fetching user data:', error);
            setUser(null);
          }
        } else {
          console.log('[DEBUG] AuthContext: No session found, user is logged out');
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );
    
    // Then check for existing session
    const checkCurrentSession = async () => {
      try {
        const currentUser = await supabaseAuthService.getCurrentUser();
        console.log('[DEBUG] AuthContext: Initial session check completed', currentUser?.email || 'No user');
        setUser(currentUser);
      } catch (error) {
        console.error('[ERROR] AuthContext: Error checking current session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkCurrentSession();
    
    // Cleanup subscription when the component unmounts
    return () => {
      console.log('[DEBUG] AuthContext: Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: UserCredentials): Promise<boolean> => {
    console.log('[DEBUG] AuthContext: Login attempt for:', credentials.email);
    setIsLoading(true);
    
    try {
      const loggedInUser = await supabaseAuthService.login(credentials);
      
      if (loggedInUser) {
        setUser(loggedInUser);
        toast({
          title: "Login successful",
          description: `Welcome back, ${loggedInUser.name}!`,
        });
        console.log('[DEBUG] AuthContext: Login successful');
        return true;
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        console.log('[DEBUG] AuthContext: Login failed - invalid credentials');
        return false;
      }
    } catch (error: any) {
      console.error('[ERROR] AuthContext: Login error', error);
      toast({
        title: "Login error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const register = useCallback(async (userData: UserCredentials & { name: string }): Promise<boolean> => {
    console.log('[DEBUG] AuthContext: Registration attempt for:', userData.email);
    setIsLoading(true);
    
    try {
      const registeredUser = await supabaseAuthService.register(userData);
      
      if (registeredUser) {
        setUser(registeredUser);
        toast({
          title: "Registration successful",
          description: `Welcome, ${registeredUser.name}!`,
        });
        console.log('[DEBUG] AuthContext: Registration successful');
        return true;
      } else {
        toast({
          title: "Registration failed",
          description: "An account with this email already exists",
          variant: "destructive",
        });
        console.log('[DEBUG] AuthContext: Registration failed - email already exists');
        return false;
      }
    } catch (error: any) {
      console.error('[ERROR] AuthContext: Registration error', error);
      toast({
        title: "Registration error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    console.log('[DEBUG] AuthContext: Logging out user');
    setIsLoading(true);
    
    try {
      await supabaseAuthService.logout();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error('[ERROR] AuthContext: Logout error', error);
      toast({
        title: "Logout error",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Role checking functions
  const isAdmin = useCallback((tournamentId: string): boolean => {
    if (!user) return false;
    return supabaseAuthService.isTournamentAdmin(user.id, tournamentId);
  }, [user]);

  const isOwner = useCallback((tournamentId: string): boolean => {
    if (!user) return false;
    return supabaseAuthService.hasRole(user.id, tournamentId, 'owner');
  }, [user]);

  const isParticipant = useCallback((tournamentId: string): boolean => {
    if (!user) return false;
    return supabaseAuthService.hasRole(user.id, tournamentId, 'participant');
  }, [user]);

  // Role management functions
  const addTournamentRole = useCallback((userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean => {
    return supabaseAuthService.addTournamentRole(userId, tournamentId, role);
  }, []);

  const removeTournamentRole = useCallback((userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean => {
    return supabaseAuthService.removeTournamentRole(userId, tournamentId, role);
  }, []);

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAdmin,
    isOwner,
    isParticipant,
    addTournamentRole,
    removeTournamentRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
