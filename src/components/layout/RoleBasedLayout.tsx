
import React from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { RolePermissions } from '@/types/user';
import { UserRole } from '@/types/tournament-enums';

// Import the role-specific layouts
import { LayoutDirector } from './role-layouts/LayoutDirector';
import { LayoutFrontDesk } from './role-layouts/LayoutFrontDesk';
import { LayoutAdminStaff } from './role-layouts/LayoutAdminStaff';
import { LayoutScorekeeper } from './role-layouts/LayoutScorekeeper';
import { LayoutPlayer } from './role-layouts/LayoutPlayer';
import { LayoutSpectator } from './role-layouts/LayoutSpectator';

// Define the role permissions object
const rolePermissionsMap: Record<UserRole, RolePermissions> = {
  [UserRole.ADMIN]: {
    viewTournament: true,
    editTournament: true,
    createTournament: true,
    deleteTournament: true,
    viewMatch: true,
    editMatch: true,
    createMatch: true,
    deleteMatch: true,
    viewRegistration: true,
    editRegistration: true,
    createRegistration: true,
    deleteRegistration: true,
    viewCourt: true,
    editCourt: true,
    createCourt: true,
    deleteCourt: true,
    viewTeam: true,
    editTeam: true,
    createTeam: true,
    deleteTeam: true,
    viewPlayer: true,
    editPlayer: true,
    createPlayer: true,
    deletePlayer: true,
    viewScoring: true,
    editScoring: true,
    manageCheckIn: true,
    manageSchedule: true,
    viewDashboard: true
  },
  [UserRole.ORGANIZER]: {
    viewTournament: true,
    editTournament: true,
    createTournament: true,
    deleteTournament: false,
    viewMatch: true,
    editMatch: true,
    createMatch: true,
    deleteMatch: true,
    viewRegistration: true,
    editRegistration: true,
    createRegistration: true,
    deleteRegistration: true,
    viewCourt: true,
    editCourt: true,
    createCourt: true,
    deleteCourt: true,
    viewTeam: true,
    editTeam: true,
    createTeam: true,
    deleteTeam: true,
    viewPlayer: true,
    editPlayer: true,
    createPlayer: true,
    deletePlayer: true,
    viewScoring: true,
    editScoring: true,
    manageCheckIn: true,
    manageSchedule: true,
    viewDashboard: true
  },
  [UserRole.SCOREKEEPER]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    viewMatch: true,
    editMatch: true,
    createMatch: false,
    deleteMatch: false,
    viewRegistration: true,
    editRegistration: false,
    createRegistration: false,
    deleteRegistration: false,
    viewCourt: true,
    editCourt: false,
    createCourt: false,
    deleteCourt: false,
    viewTeam: true,
    editTeam: false,
    createTeam: false,
    deleteTeam: false,
    viewPlayer: true,
    editPlayer: false,
    createPlayer: false,
    deletePlayer: false,
    viewScoring: true,
    editScoring: true,
    manageCheckIn: false,
    manageSchedule: false,
    viewDashboard: true
  },
  [UserRole.PLAYER]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    viewMatch: true,
    editMatch: false,
    createMatch: false,
    deleteMatch: false,
    viewRegistration: true,
    editRegistration: false,
    createRegistration: true,
    deleteRegistration: false,
    viewCourt: true,
    editCourt: false,
    createCourt: false,
    deleteCourt: false,
    viewTeam: true,
    editTeam: false,
    createTeam: false,
    deleteTeam: false,
    viewPlayer: true,
    editPlayer: false,
    createPlayer: false,
    deletePlayer: false,
    viewScoring: true,
    editScoring: false,
    manageCheckIn: false,
    manageSchedule: false,
    viewDashboard: true
  },
  [UserRole.SPECTATOR]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    viewMatch: true,
    editMatch: false,
    createMatch: false,
    deleteMatch: false,
    viewRegistration: false,
    editRegistration: false,
    createRegistration: false,
    deleteRegistration: false,
    viewCourt: true,
    editCourt: false,
    createCourt: false,
    deleteCourt: false,
    viewTeam: true,
    editTeam: false,
    createTeam: false,
    deleteTeam: false,
    viewPlayer: true,
    editPlayer: false,
    createPlayer: false,
    deletePlayer: false,
    viewScoring: true,
    editScoring: false,
    manageCheckIn: false,
    manageSchedule: false,
    viewDashboard: false
  },
  [UserRole.FRONT_DESK]: {
    viewTournament: true,
    editTournament: false,
    createTournament: false,
    deleteTournament: false,
    viewMatch: true,
    editMatch: false,
    createMatch: false,
    deleteMatch: false,
    viewRegistration: true,
    editRegistration: true,
    createRegistration: true,
    deleteRegistration: false,
    viewCourt: true,
    editCourt: false,
    createCourt: false,
    deleteCourt: false,
    viewTeam: true,
    editTeam: false,
    createTeam: false,
    deleteTeam: false,
    viewPlayer: true,
    editPlayer: true,
    createPlayer: true,
    deletePlayer: false,
    viewScoring: true,
    editScoring: false,
    manageCheckIn: true,
    manageSchedule: false,
    viewDashboard: true
  },
  [UserRole.ADMIN_STAFF]: {
    viewTournament: true,
    editTournament: true,
    createTournament: false,
    deleteTournament: false,
    viewMatch: true,
    editMatch: true,
    createMatch: false,
    deleteMatch: false,
    viewRegistration: true,
    editRegistration: true,
    createRegistration: true,
    deleteRegistration: false,
    viewCourt: true,
    editCourt: true,
    createCourt: true,
    deleteCourt: false,
    viewTeam: true,
    editTeam: true,
    createTeam: true,
    deleteTeam: false,
    viewPlayer: true,
    editPlayer: true,
    createPlayer: true,
    deletePlayer: false,
    viewScoring: true,
    editScoring: true,
    manageCheckIn: true,
    manageSchedule: true,
    viewDashboard: true
  },
  [UserRole.DIRECTOR]: {
    viewTournament: true,
    editTournament: true,
    createTournament: true,
    deleteTournament: true,
    viewMatch: true,
    editMatch: true,
    createMatch: true,
    deleteMatch: true,
    viewRegistration: true,
    editRegistration: true,
    createRegistration: true,
    deleteRegistration: true,
    viewCourt: true,
    editCourt: true,
    createCourt: true,
    deleteCourt: true,
    viewTeam: true,
    editTeam: true,
    createTeam: true,
    deleteTeam: true,
    viewPlayer: true,
    editPlayer: true,
    createPlayer: true,
    deletePlayer: true,
    viewScoring: true,
    editScoring: true,
    manageCheckIn: true,
    manageSchedule: true,
    viewDashboard: true
  }
};

// Define the layout props interface
export interface LayoutProps {
  children: React.ReactNode;
  permissions: RolePermissions;
}

// Fallback component while loading the role-specific layout
const LoadingLayout: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      {children}
    </div>
  </div>
);

const RoleBasedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingLayout>{children}</LoadingLayout>;
  }

  // Default to spectator for unauthenticated users
  const role = user?.role || UserRole.SPECTATOR;
  const permissions = rolePermissionsMap[role] || rolePermissionsMap[UserRole.SPECTATOR];

  // Return the appropriate layout based on the user role
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.DIRECTOR:
      return <LayoutDirector permissions={permissions}>{children}</LayoutDirector>;
    case UserRole.ORGANIZER:
      return <LayoutDirector permissions={permissions}>{children}</LayoutDirector>;
    case UserRole.SCOREKEEPER:
      return <LayoutScorekeeper permissions={permissions}>{children}</LayoutScorekeeper>;
    case UserRole.FRONT_DESK:
      return <LayoutFrontDesk permissions={permissions}>{children}</LayoutFrontDesk>;
    case UserRole.ADMIN_STAFF:
      return <LayoutAdminStaff permissions={permissions}>{children}</LayoutAdminStaff>;
    case UserRole.PLAYER:
      return <LayoutPlayer permissions={permissions}>{children}</LayoutPlayer>;
    case UserRole.SPECTATOR:
      return <LayoutSpectator permissions={permissions}>{children}</LayoutSpectator>;
    default:
      return <LayoutSpectator permissions={permissions}>{children}</LayoutSpectator>;
  }
};

export default RoleBasedLayout;
