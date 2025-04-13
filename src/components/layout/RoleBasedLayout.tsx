
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
      return <LayoutDirector permissions={permissions}>{children}</LayoutDirector>;
    case UserRole.ORGANIZER:
      return <LayoutDirector permissions={permissions}>{children}</LayoutDirector>;
    case UserRole.SCOREKEEPER:
      return <LayoutScorekeeper permissions={permissions}>{children}</LayoutScorekeeper>;
    case UserRole.PLAYER:
      return <LayoutPlayer permissions={permissions}>{children}</LayoutPlayer>;
    case UserRole.SPECTATOR:
      return <LayoutSpectator permissions={permissions}>{children}</LayoutSpectator>;
    default:
      return <LayoutSpectator permissions={permissions}>{children}</LayoutSpectator>;
  }
};

export default RoleBasedLayout;
