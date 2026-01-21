// Appwrite configuration
import { COLLECTIONS, APPWRITE_DATABASE_ID } from '@/lib/constants';

export const APPWRITE_CONFIG = {
  databaseId: APPWRITE_DATABASE_ID,
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
