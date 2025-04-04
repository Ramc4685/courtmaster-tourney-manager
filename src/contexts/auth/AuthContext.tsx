import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, UserCredentials } from '@/types/user';
import { supabaseAuthService } from '@/services/auth/SupabaseAuthService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Check if we should use demo mode (can be set via URL or localStorage)
const shouldUseDemoMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const demoMode = urlParams.get('demoMode') === 'true' || localStorage.getItem('demoMode') === 'true';
  return demoMode;
};

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  login: (credentials: UserCredentials) => Promise<boolean>;
  register: (userData: UserCredentials & { name: string }) => Promise<boolean>;
  logout: () => void;
  signInWithGoogle: () => Promise<void>;
  isAdmin: (tournamentId: string) => boolean;
  isOwner: (tournamentId: string) => boolean;
  isParticipant: (tournamentId: string) => boolean;
  addTournamentRole: (userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant') => boolean;
  removeTournamentRole: (userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant') => boolean;
  demoMode: boolean;
  enableDemoMode: (enable: boolean) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(shouldUseDemoMode());
  const { toast } = useToast();

  // Initialize demo mode
  useEffect(() => {
    if (demoMode) {
      console.log('[DEBUG] AuthContext: Initializing in demo mode');
      supabaseAuthService.enableDemoMode(true);
      
      // Check for existing demo user
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        setUser(JSON.parse(demoUser));
      }
    }
  }, [demoMode]);

  // Function to enable/disable demo mode
  const enableDemoMode = useCallback((enable: boolean) => {
    console.log(`[DEBUG] AuthContext: ${enable ? 'Enabling' : 'Disabling'} demo mode`);
    setDemoMode(enable);
    supabaseAuthService.enableDemoMode(enable);
    
    if (enable) {
      localStorage.setItem('demoMode', 'true');
    } else {
      localStorage.removeItem('demoMode');
      localStorage.removeItem('demo_user');
      setUser(null);
    }
  }, []);

  // Check for existing user session on mount and set up auth state change listener
  useEffect(() => {
    // Skip Supabase auth if in demo mode
    if (demoMode) {
      console.log('[DEBUG] AuthContext: Using demo mode - skipping Supabase auth setup');
      setIsLoading(false);
      return;
    }
    
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
  }, [demoMode]);

  const login = useCallback(async (credentials: UserCredentials): Promise<boolean> => {
    console.log('[DEBUG] AuthContext: Login attempt for:', credentials.email);
    setIsLoading(true);
    
    try {
      // Special case for demo login
      if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
        console.log('[DEBUG] AuthContext: Enabling demo mode for demo login');
        enableDemoMode(true);
      }
      
      // Login with the auth service (will handle demo mode internally)
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
      // Try demo login as a fallback for testing
      if (!demoMode && (error.message === 'Invalid login credentials' || error.message?.includes('Failed to fetch'))) {
        console.log('[DEBUG] AuthContext: Real login failed, trying demo login as fallback');
        try {
          // Enable demo mode and create a demo user
          enableDemoMode(true);
          const demoUser: User = {
            id: 'demo-user-id',
            email: credentials.email,
            name: credentials.email.includes('@') ? credentials.email.split('@')[0] : 'Demo User',
            createdAt: new Date().toISOString(),
            isVerified: true,
            role: credentials.email.includes('admin') ? 'admin' : 'user',
          };
          
          localStorage.setItem('demo_user', JSON.stringify(demoUser));
          setUser(demoUser);
          
          toast({
            title: "Demo login successful",
            description: `Welcome to demo mode, ${demoUser.name}!`,
          });
          console.log('[DEBUG] AuthContext: Demo login successful as fallback');
          return true;
        } catch (demoError) {
          console.error('[ERROR] AuthContext: Demo fallback login error', demoError);
        }
      }
      
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
  }, [toast, demoMode, enableDemoMode]);

  const register = useCallback(async (userData: UserCredentials & { name: string }): Promise<boolean> => {
    console.log('[DEBUG] AuthContext: Registration attempt for:', userData.email);
    setIsLoading(true);
    
    // In demo mode, just create a demo user
    if (demoMode) {
      try {
        const demoUser: User = {
          id: 'demo-user-id',
          email: userData.email,
          name: userData.name,
          createdAt: new Date().toISOString(),
          isVerified: true,
          role: 'user',
        };
        
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        setUser(demoUser);
        
        toast({
          title: "Demo registration successful",
          description: `Welcome, ${userData.name}!`,
        });
        console.log('[DEBUG] AuthContext: Demo registration successful');
        setIsLoading(false);
        return true;
      } catch (error: any) {
        console.error('[ERROR] AuthContext: Demo registration error', error);
        toast({
          title: "Registration error",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
    }
    
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
      // Try demo registration as a fallback
      console.error('[ERROR] AuthContext: Registration error, trying demo fallback', error);
      try {
        enableDemoMode(true);
        const demoUser: User = {
          id: 'demo-user-id',
          email: userData.email,
          name: userData.name,
          createdAt: new Date().toISOString(),
          isVerified: true,
          role: 'user',
        };
        
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        setUser(demoUser);
        
        toast({
          title: "Demo registration successful",
          description: `Welcome, ${userData.name}!`,
        });
        console.log('[DEBUG] AuthContext: Demo registration successful as fallback');
        return true;
      } catch (demoError) {
        console.error('[ERROR] AuthContext: Demo fallback registration error', demoError);
        toast({
          title: "Registration error",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast, demoMode, enableDemoMode]);

  const logout = useCallback(async () => {
    console.log('[DEBUG] AuthContext: Logging out user');
    setIsLoading(true);
    
    try {
      await supabaseAuthService.logout();
      setUser(null);
      
      // Disable demo mode on logout
      if (demoMode) {
        enableDemoMode(false);
      }
      
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
  }, [toast, demoMode, enableDemoMode]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/tournaments`
        }
      });

      if (error) {
        throw error;
      }

      if (data) {
        console.log('[DEBUG] AuthContext: Google sign-in successful');
      }
    } catch (error) {
      console.error('[ERROR] AuthContext: Google sign-in error', error);
      toast({
        title: "Sign-in error",
        description: "An error occurred while signing in with Google. Please try again.",
        variant: "destructive",
      });
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
    signInWithGoogle,
    isAdmin,
    isOwner,
    isParticipant,
    addTournamentRole,
    removeTournamentRole,
    demoMode,
    enableDemoMode,
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
