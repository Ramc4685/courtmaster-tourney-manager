import { Profile } from '@/types/entities';

export const DEMO_USER: Profile = {
  id: 'demo-user',
  email: 'demo@example.com',
  full_name: 'Demo User',
  display_name: 'Demo User',
  avatar_url: null,
  phone: null,
  role: 'player',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
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
  },
  player_details: {
    birthdate: null,
    gender: null,
    skill_level: 'INTERMEDIATE',
    dominant_hand: null,
    location: {
      city: null,
      state: null,
      country: null
    },
    bio: null
  },
  social_links: {
    facebook: null,
    twitter: null,
    instagram: null,
    website: null
  }
};

export const DEMO_ADMIN_USER: Profile = {
  id: 'demo-admin',
  email: 'demo-admin',
  full_name: 'Demo Admin',
  display_name: 'Demo Admin',
  avatar_url: null,
  phone: null,
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  player_stats: {
    matches_played: 0,
    matches_won: 0,
    tournaments_played: 0,
    tournaments_won: 0,
    rating: 1200,
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
  },
  player_details: {
    birthdate: null,
    gender: null,
    skill_level: 'ADVANCED',
    dominant_hand: null,
    location: {
      city: null,
      state: null,
      country: null
    },
    bio: null
  },
  social_links: {
    facebook: null,
    twitter: null,
    instagram: null,
    website: null
  }
}; 