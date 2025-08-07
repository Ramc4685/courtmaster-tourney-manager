// Appwrite configuration
import { COLLECTIONS } from '@/lib/appwrite';

export const APPWRITE_CONFIG = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default',
  profilesCollectionId: COLLECTIONS.PROFILES,
  tournamentsCollectionId: COLLECTIONS.TOURNAMENTS,
  divisionsCollectionId: COLLECTIONS.DIVISIONS,
  teamsCollectionId: COLLECTIONS.TEAMS,
  teamMembersCollectionId: COLLECTIONS.TEAM_MEMBERS,
  registrationsCollectionId: COLLECTIONS.REGISTRATIONS,
  matchesCollectionId: COLLECTIONS.MATCHES,
  courtsCollectionId: COLLECTIONS.COURTS,
  notificationsCollectionId: COLLECTIONS.NOTIFICATIONS,
  tournamentMessagesCollectionId: COLLECTIONS.TOURNAMENT_MESSAGES,
  playerHistoryCollectionId: COLLECTIONS.PLAYER_HISTORY,
};
