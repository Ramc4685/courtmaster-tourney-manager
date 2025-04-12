import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, UserCredentials } from "@/types/user";
import { Profile } from "@/types/entities";
import { useStore } from "@/stores/store";
import { useTournamentStore } from "@/stores/tournamentStore";
import { useStandaloneMatchStore } from "@/stores/standaloneMatchStore";
import { useScoringStore } from "@/stores/scoring/store";
import { profileService } from "@/services/api";
import { DemoStorageService } from "@/services/storage/DemoStorageService";
import { storageService, createStorageService } from "@/services/storage/StorageService";
import { TournamentStage } from "@/types/tournament-enums";
import { getDefaultScoringSettings } from "@/utils/scoringRules";
import { DEMO_USER, DEMO_ADMIN_USER } from "@/utils/demoData";
import { resetAllStores } from "@/utils/storeUtils";

interface AuthContextType {
  user: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, data: { full_name: string, display_name: string, role: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  isLoading: boolean;
  isDemoMode: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const resetStore = useStore((state) => state.reset);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const profile = await profileService.getProfile(session.user.id);
          setUser(profile);
        } catch (error) {
          console.error('Error fetching profile:', error);
          await signOut();
        }
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const profile = await profileService.getProfile(session.user.id);
          setUser(profile);
        } catch (error) {
          console.error('Error fetching profile:', error);
          await signOut();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        resetStore();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email?: string, password?: string) => {
    console.log('[DEBUG] AuthProvider: Starting sign in');
    setIsLoading(true);
    try {
      // Handle demo logins first
      if (email === 'demo' || email === 'demo-admin') {
        console.log('[DEBUG] AuthProvider: Using demo login');
        const demoUser = email === 'demo-admin' ? DEMO_ADMIN_USER : DEMO_USER;
        
        // Initialize demo storage service and assign it to be used globally
        console.log('[DEBUG] AuthProvider: Initializing demo storage');
        Object.assign(storageService, new DemoStorageService({
          isDemoMode: true,
          demoUser: demoUser
        }));
        console.log('[DEBUG] AuthProvider: Demo storage initialized');

        // Reset all stores and set user
        console.log('[DEBUG] AuthProvider: Resetting stores');
        await resetAllStores();
        
        console.log('[DEBUG] AuthProvider: Setting user');
        setUser(demoUser);
        setIsDemoMode(true);

        // Load tournaments into store
        console.log('[DEBUG] AuthProvider: Loading tournaments');
        const tournamentStore = useTournamentStore.getState();
        await tournamentStore.loadTournaments();
        console.log('[DEBUG] AuthProvider: Tournaments loaded');

        setIsLoading(false);
        navigate('/tournaments');
        return;
      }

      // Regular Supabase login
      const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (authUser) {
        const profile = await profileService.getProfile(authUser.id);
        setUser(profile);
        setIsLoading(false);
        navigate('/tournaments');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('[DEBUG] AuthProvider: Signing out');
    resetAllStores();
    setUser(null);
    setIsDemoMode(false);
    // Reset storage service to default implementation
    Object.assign(storageService, createStorageService());
    if (!isDemoMode) {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) {
      throw new Error("User not authenticated to update profile");
    }
    if (isDemoMode) {
       console.log("[DEBUG] Profile update skipped in demo mode.");
       // Optionally update local demo user state if needed
       const updatedDemoUser = { ...user, ...data, player_details: {...user.player_details, ...data.player_details}, preferences: {...user.preferences, ...data.preferences}, social_links: {...user.social_links, ...data.social_links} };
       setUser(updatedDemoUser);
       return;
    }
    try {
      setIsLoading(true);
      const updated = await profileService.updateProfile(user.id, data);
      setUser(updated); // Update context user state
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error; // Re-throw error to be caught by caller
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, data: { full_name: string, display_name: string, role: string }) => {
    setIsLoading(true);
    try {
      const { data: { user: authUser }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: data.full_name,
            display_name: data.display_name,
            role: data.role
          }
        }
      });

      if (error) throw error;

      if (authUser) {
        const profile = await profileService.getProfile(authUser.id);
        setUser(profile);
        setIsLoading(false);
        navigate('/tournaments');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isLoading,
    isDemoMode,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 