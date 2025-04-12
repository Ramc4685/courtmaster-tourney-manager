import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Tournament, Match, Notification } from '../types/entities';

interface AuthState {
  user: Profile | null;
  setUser: (user: Profile | null) => void;
}

interface TournamentState {
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament | null) => void;
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  updateMatch: (match: Match) => void;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
}

interface AppState extends AuthState, TournamentState, NotificationState {
  reset: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth State
      user: null,
      setUser: (user) => set({ user }),

      // Tournament State
      currentTournament: null,
      setCurrentTournament: (tournament) => set({ currentTournament: tournament }),
      matches: [],
      setMatches: (matches) => set({ matches }),
      updateMatch: (match) =>
        set((state) => ({
          matches: state.matches.map((m) => (m.id === match.id ? match : m)),
        })),

      // Notification State
      notifications: [],
      unreadCount: 0,
      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
        }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + (notification.read ? 0 : 1),
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: state.unreadCount - 1,
        })),

      // Reset function
      reset: () => set({
        user: null,
        currentTournament: null,
        matches: [],
        notifications: [],
        unreadCount: 0
      }),
    }),
    {
      name: 'courtmaster-storage',
      partialize: (state) => ({
        user: state.user,
        currentTournament: state.currentTournament,
      }),
    }
  )
); 