
import React from 'react';
import { UserRole } from '@/types/tournament-enums';
import { RolePermissions } from '@/types/entities';

export interface LayoutProps {
  permissions?: RolePermissions;
  children?: React.ReactNode;
}

interface RoleBasedLayoutProps {
  role: UserRole;
  children: React.ReactNode;
}

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.ADMIN]: {
    viewTournament: true,
    editTournament: true,
    createTournament: true,
    deleteTournament: true,
    manageRegistrations: true,
    approveRegistrations: true,
    rejectRegistrations: true,
    scheduleMatches: true,
    scoreMatches: true,
    manageCourts: true,
    manageUsers: true,
    manageSystem: true,
    viewReports: true,
    exportData: true,
    // Legacy permissions
    can_manage_tournaments: true,
    can_manage_users: true,
    can_manage_registrations: true,
    can_score_matches: true,
    can_view_reports: true
  },
  [UserRole.DIRECTOR]: {
    viewTournament: true,
    editTournament: true,
    createTournament: true,
    deleteTournament: true,
    manageRegistrations: true,
    approveRegistrations: true,
    rejectRegistrations: true,
    scheduleMatches: true,
    scoreMatches: true,
    manageCourts: true,
    manageUsers: false,
    manageSystem: false,
    viewReports: true,
    exportData: true,
    // Legacy permissions
    can_manage_tournaments: true,
    can_manage_users: false,
    can_manage_registrations: true,
    can_score_matches: true,
    can_view_reports: true
  },
  [UserRole.ORGANIZER]: {
    viewTournament: true,
    editTournament: true,
    createTournament: true,
    deleteTournament: false,
    manageRegistrations: true,
    approveRegistrations: true,
    rejectRegistrations: true,
    scheduleMatches: true,
    scoreMatches: true,
    manageCourts: true,
    manageUsers: false,
    manageSystem: false,
    viewReports: true,
    exportData: true,
    // Legacy permissions
    can_manage_tournaments: true,
    can_manage_users: false,
    can_manage_registrations: true,
    can_score_matches: true,
    can_view_reports: true
  },
  [UserRole.SCOREKEEPER]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    manageRegistrations: false,
    approveRegistrations: false,
    rejectRegistrations: false,
    scheduleMatches: false,
    scoreMatches: true,
    manageCourts: false,
    manageUsers: false,
    manageSystem: false,
    viewReports: false,
    exportData: false,
    // Legacy permissions
    can_manage_tournaments: false,
    can_manage_users: false,
    can_manage_registrations: false,
    can_score_matches: true,
    can_view_reports: false
  },
  [UserRole.FRONT_DESK]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    manageRegistrations: true,
    approveRegistrations: true,
    rejectRegistrations: true,
    scheduleMatches: false,
    scoreMatches: false,
    manageCourts: false,
    manageUsers: false,
    manageSystem: false,
    viewReports: false,
    exportData: false,
    // Legacy permissions
    can_manage_tournaments: false,
    can_manage_users: false,
    can_manage_registrations: true,
    can_score_matches: false,
    can_view_reports: false
  },
  [UserRole.ADMIN_STAFF]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    manageRegistrations: true,
    approveRegistrations: true,
    rejectRegistrations: true,
    scheduleMatches: true,
    scoreMatches: true,
    manageCourts: true,
    manageUsers: false,
    manageSystem: false,
    viewReports: true,
    exportData: false,
    // Legacy permissions
    can_manage_tournaments: false,
    can_manage_users: false,
    can_manage_registrations: true,
    can_score_matches: true,
    can_view_reports: true
  },
  [UserRole.PLAYER]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    manageRegistrations: false,
    approveRegistrations: false,
    rejectRegistrations: false,
    scheduleMatches: false,
    scoreMatches: false,
    manageCourts: false,
    manageUsers: false,
    manageSystem: false,
    viewReports: false,
    exportData: false,
    // Legacy permissions
    can_manage_tournaments: false,
    can_manage_users: false,
    can_manage_registrations: false,
    can_score_matches: false,
    can_view_reports: false
  },
  [UserRole.SPECTATOR]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    manageRegistrations: false,
    approveRegistrations: false,
    rejectRegistrations: false,
    scheduleMatches: false,
    scoreMatches: false,
    manageCourts: false,
    manageUsers: false,
    manageSystem: false,
    viewReports: false,
    exportData: false,
    // Legacy permissions
    can_manage_tournaments: false,
    can_manage_users: false,
    can_manage_registrations: false,
    can_score_matches: false,
    can_view_reports: false
  }
};

const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({ role, children }) => {
  // Get permissions for the current role
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[UserRole.SPECTATOR];

  return (
    <div className="role-based-layout">
      {/* Pass permissions to children if needed */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { permissions });
        }
        return child;
      })}
    </div>
  );
};

export default RoleBasedLayout;
