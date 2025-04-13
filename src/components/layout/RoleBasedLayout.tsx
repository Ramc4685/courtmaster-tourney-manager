
import React from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { RolePermissions } from '@/types/user';
import { UserRole } from '@/types/tournament-enums';

// Define role permissions object
const rolePermissionsMap = {
  [UserRole.ADMIN]: {
    can_manage_tournaments: true,
    can_manage_users: true,
    can_manage_registrations: true,
    can_score_matches: true,
    can_view_reports: true,
  },
  [UserRole.ORGANIZER]: {
    can_manage_tournaments: true,
    can_manage_users: false,
    can_manage_registrations: true,
    can_score_matches: true,
    can_view_reports: true,
  },
  [UserRole.SCOREKEEPER]: {
    can_manage_tournaments: false,
    can_manage_users: false,
    can_manage_registrations: false,
    can_score_matches: true,
    can_view_reports: false,
  },
  [UserRole.PLAYER]: {
    can_manage_tournaments: false,
    can_manage_users: false,
    can_manage_registrations: false,
    can_score_matches: false,
    can_view_reports: false,
  },
  [UserRole.SPECTATOR]: {
    can_manage_tournaments: false,
    can_manage_users: false,
    can_manage_registrations: false,
    can_score_matches: false,
    can_view_reports: false,
  }
};

// Import the role-specific layouts
import { LayoutDirector } from './role-layouts/LayoutDirector';
import { LayoutFrontDesk } from './role-layouts/LayoutFrontDesk';
import { LayoutAdminStaff } from './role-layouts/LayoutAdminStaff';
import { LayoutScorekeeper } from './role-layouts/LayoutScorekeeper';
import { LayoutPlayer } from './role-layouts/LayoutPlayer';
import { LayoutSpectator } from './role-layouts/LayoutSpectator';

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
  const { user } = useAuth();
  
  // Default to spectator for unauthenticated users
  const role = user?.role || UserRole.SPECTATOR;
  const permissions = rolePermissionsMap[role] || rolePermissionsMap[UserRole.SPECTATOR];

  // For now, use a simplified layout until we fix the role-specific layouts
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default RoleBasedLayout;
