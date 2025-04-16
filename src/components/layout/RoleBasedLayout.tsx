
import React from 'react';
import { UserRole } from '@/types/tournament-enums';
import { RolePermissions } from '@/types/entities';
import LayoutDirector from './role-layouts/LayoutDirector';
import LayoutFrontDesk from './role-layouts/LayoutFrontDesk';
import LayoutAdminStaff from './role-layouts/LayoutAdminStaff';
import LayoutPlayer from './role-layouts/LayoutPlayer';
import LayoutScorekeeper from './role-layouts/LayoutScorekeeper';
import LayoutSpectator from './role-layouts/LayoutSpectator';

// Role permissions configuration
const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.ADMIN]: {
    viewTournament: true,
    editTournament: true,
    createTournament: true,
    deleteTournament: true,
    viewMatches: true,
    updateMatchStatus: true,
    updateMatchScore: true,
    createMatch: true,
    viewCourts: true,
    updateCourtStatus: true,
    createCourt: true,
    viewRegistrations: true,
    updateRegistrationStatus: true,
    viewParticipants: true,
    addParticipant: true,
    viewSchedule: true,
    modifySchedule: true,
    viewResults: true,
    generateBrackets: true,
    advanceTournament: true,
    manageSystemSettings: true,
    viewAnalytics: true,
    exportData: true,
    viewAdminDashboard: true,
    accessCheckIn: true,
    manageBulkOperations: true,
    viewAuditLog: true,
    sendAnnouncements: true,
    moderateMessages: true,
    canManageTournaments: true,
    canManageUsers: true,
    canManageRegistrations: true,
    canScoreMatches: true,
    canViewReports: true
  },
  [UserRole.ORGANIZER]: {
    viewTournament: true,
    editTournament: true,
    createTournament: true,
    deleteTournament: false,
    viewMatches: true,
    updateMatchStatus: true,
    updateMatchScore: true,
    createMatch: true,
    viewCourts: true,
    updateCourtStatus: true,
    createCourt: true,
    viewRegistrations: true,
    updateRegistrationStatus: true,
    viewParticipants: true,
    addParticipant: true,
    viewSchedule: true,
    modifySchedule: true,
    viewResults: true,
    generateBrackets: true,
    advanceTournament: true,
    manageSystemSettings: false,
    viewAnalytics: true,
    exportData: true,
    viewAdminDashboard: true,
    accessCheckIn: true,
    manageBulkOperations: true,
    viewAuditLog: true,
    sendAnnouncements: true,
    moderateMessages: true,
    canManageTournaments: true,
    canManageUsers: false,
    canManageRegistrations: true,
    canScoreMatches: true,
    canViewReports: true
  },
  [UserRole.SCOREKEEPER]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    viewMatches: true,
    updateMatchStatus: true,
    updateMatchScore: true,
    createMatch: false,
    viewCourts: true,
    updateCourtStatus: false,
    createCourt: false,
    viewRegistrations: true,
    updateRegistrationStatus: false,
    viewParticipants: true,
    addParticipant: false,
    viewSchedule: true,
    modifySchedule: false,
    viewResults: true,
    generateBrackets: false,
    advanceTournament: false,
    manageSystemSettings: false,
    viewAnalytics: false,
    exportData: false,
    viewAdminDashboard: false,
    accessCheckIn: false,
    manageBulkOperations: false,
    viewAuditLog: false,
    sendAnnouncements: false,
    moderateMessages: false,
    canManageTournaments: false,
    canManageUsers: false,
    canManageRegistrations: false,
    canScoreMatches: true,
    canViewReports: false
  },
  [UserRole.PLAYER]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    viewMatches: true,
    updateMatchStatus: false,
    updateMatchScore: false,
    createMatch: false,
    viewCourts: true,
    updateCourtStatus: false,
    createCourt: false,
    viewRegistrations: false,
    updateRegistrationStatus: false,
    viewParticipants: true,
    addParticipant: false,
    viewSchedule: true,
    modifySchedule: false,
    viewResults: true,
    generateBrackets: false,
    advanceTournament: false,
    manageSystemSettings: false,
    viewAnalytics: false,
    exportData: false,
    viewAdminDashboard: false,
    accessCheckIn: false,
    manageBulkOperations: false,
    viewAuditLog: false,
    sendAnnouncements: false,
    moderateMessages: false,
    canManageTournaments: false,
    canManageUsers: false,
    canManageRegistrations: false,
    canScoreMatches: false,
    canViewReports: false
  },
  [UserRole.SPECTATOR]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    viewMatches: true,
    updateMatchStatus: false,
    updateMatchScore: false,
    createMatch: false,
    viewCourts: true,
    updateCourtStatus: false,
    createCourt: false,
    viewRegistrations: false,
    updateRegistrationStatus: false,
    viewParticipants: true,
    addParticipant: false,
    viewSchedule: true,
    modifySchedule: false,
    viewResults: true,
    generateBrackets: false,
    advanceTournament: false,
    manageSystemSettings: false,
    viewAnalytics: false,
    exportData: false,
    viewAdminDashboard: false,
    accessCheckIn: false,
    manageBulkOperations: false,
    viewAuditLog: false,
    sendAnnouncements: false,
    moderateMessages: false,
    canManageTournaments: false,
    canManageUsers: false,
    canManageRegistrations: false,
    canScoreMatches: false,
    canViewReports: false
  },
  [UserRole.DIRECTOR]: {
    viewTournament: true,
    editTournament: true,
    createTournament: true,
    deleteTournament: true,
    viewMatches: true,
    updateMatchStatus: true,
    updateMatchScore: true,
    createMatch: true,
    viewCourts: true,
    updateCourtStatus: true,
    createCourt: true,
    viewRegistrations: true,
    updateRegistrationStatus: true,
    viewParticipants: true,
    addParticipant: true,
    viewSchedule: true,
    modifySchedule: true,
    viewResults: true,
    generateBrackets: true,
    advanceTournament: true,
    manageSystemSettings: true,
    viewAnalytics: true,
    exportData: true,
    viewAdminDashboard: true,
    accessCheckIn: true,
    manageBulkOperations: true,
    viewAuditLog: true,
    sendAnnouncements: true,
    moderateMessages: true,
    canManageTournaments: true,
    canManageUsers: true,
    canManageRegistrations: true,
    canScoreMatches: true,
    canViewReports: true
  },
  [UserRole.FRONT_DESK]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    viewMatches: true,
    updateMatchStatus: false,
    updateMatchScore: false,
    createMatch: false,
    viewCourts: true,
    updateCourtStatus: false,
    createCourt: false,
    viewRegistrations: true,
    updateRegistrationStatus: true,
    viewParticipants: true,
    addParticipant: true,
    viewSchedule: true,
    modifySchedule: false,
    viewResults: true,
    generateBrackets: false,
    advanceTournament: false,
    manageSystemSettings: false,
    viewAnalytics: false,
    exportData: false,
    viewAdminDashboard: false,
    accessCheckIn: true,
    manageBulkOperations: false,
    viewAuditLog: false,
    sendAnnouncements: true,
    moderateMessages: false,
    canManageTournaments: false,
    canManageUsers: false,
    canManageRegistrations: true,
    canScoreMatches: false,
    canViewReports: false
  },
  [UserRole.ADMIN_STAFF]: {
    viewTournament: true,
    editTournament: true,
    createTournament: false,
    deleteTournament: false,
    viewMatches: true,
    updateMatchStatus: true,
    updateMatchScore: true,
    createMatch: true,
    viewCourts: true,
    updateCourtStatus: true,
    createCourt: true,
    viewRegistrations: true,
    updateRegistrationStatus: true,
    viewParticipants: true,
    addParticipant: true,
    viewSchedule: true,
    modifySchedule: true,
    viewResults: true,
    generateBrackets: false,
    advanceTournament: false,
    manageSystemSettings: false,
    viewAnalytics: true,
    exportData: true,
    viewAdminDashboard: true,
    accessCheckIn: true,
    manageBulkOperations: true,
    viewAuditLog: true,
    sendAnnouncements: true,
    moderateMessages: true,
    canManageTournaments: true,
    canManageUsers: false,
    canManageRegistrations: true,
    canScoreMatches: true,
    canViewReports: true
  }
};

interface RoleBasedLayoutProps {
  userRole: UserRole;
  children: React.ReactNode;
}

const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({ userRole, children }) => {
  // Choose a layout based on the user role
  switch (userRole) {
    case UserRole.DIRECTOR:
      return <LayoutDirector>{children}</LayoutDirector>;
      
    case UserRole.FRONT_DESK:
      return <LayoutFrontDesk>{children}</LayoutFrontDesk>;
      
    case UserRole.ADMIN_STAFF:
      return <LayoutAdminStaff>{children}</LayoutAdminStaff>;
      
    case UserRole.ADMIN:
      return <LayoutDirector>{children}</LayoutDirector>; // Admin gets director layout
      
    case UserRole.ORGANIZER:
      return <LayoutDirector>{children}</LayoutDirector>; // Organizer gets director layout
      
    case UserRole.SCOREKEEPER:
      return <LayoutScorekeeper>{children}</LayoutScorekeeper>;
      
    case UserRole.PLAYER:
      return <LayoutPlayer>{children}</LayoutPlayer>;
      
    case UserRole.SPECTATOR:
      return <LayoutSpectator>{children}</LayoutSpectator>;
      
    default:
      return <LayoutPlayer>{children}</LayoutPlayer>; // Default to player layout
  }
};

export default RoleBasedLayout;
export { ROLE_PERMISSIONS };
