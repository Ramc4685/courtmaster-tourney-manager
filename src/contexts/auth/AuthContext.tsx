
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, UserCredentials } from '@/types/user';
import { authService } from '@/services/auth/AuthService';
import { useToast } from '@/hooks/use-toast';

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

  // Check for existing user session on mount
  useEffect(() => {
    console.log('[DEBUG] AuthContext: Checking for existing user session');
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
    console.log('[DEBUG] AuthContext: User session check completed', currentUser?.email || 'No user');
  }, []);

  const login = useCallback(async (credentials: UserCredentials): Promise<boolean> => {
    console.log('[DEBUG] AuthContext: Login attempt for:', credentials.email);
    setIsLoading(true);
    
    try {
      const loggedInUser = await authService.login(credentials);
      
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
    } catch (error) {
      console.error('[ERROR] AuthContext: Login error', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
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
      const registeredUser = await authService.register(userData);
      
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
    } catch (error) {
      console.error('[ERROR] AuthContext: Registration error', error);
      toast({
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(() => {
    console.log('[DEBUG] AuthContext: Logging out user');
    authService.logout();
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  }, [toast]);

  // Role checking functions
  const isAdmin = useCallback((tournamentId: string): boolean => {
    if (!user) return false;
    return authService.isTournamentAdmin(user.id, tournamentId);
  }, [user]);

  const isOwner = useCallback((tournamentId: string): boolean => {
    if (!user) return false;
    return authService.hasRole(user.id, tournamentId, 'owner');
  }, [user]);

  const isParticipant = useCallback((tournamentId: string): boolean => {
    if (!user) return false;
    return authService.hasRole(user.id, tournamentId, 'participant');
  }, [user]);

  // Role management functions
  const addTournamentRole = useCallback((userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean => {
    return authService.addTournamentRole(userId, tournamentId, role);
  }, []);

  const removeTournamentRole = useCallback((userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean => {
    return authService.removeTournamentRole(userId, tournamentId, role);
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
