
import React from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { RolePermissions } from '@/types/user';
import { UserRole } from '@/types/tournament-enums';

// Import the role-specific layouts
// Note: We're not importing these directly since they have errors, but this is the pattern
// that should be followed once those components are fixed
const LayoutComponents = {
  [UserRole.TOURNAMENT_DIRECTOR]: React.lazy(() => import('./role-layouts/LayoutDirector')),
  [UserRole.FRONT_DESK]: React.lazy(() => import('./role-layouts/LayoutFrontDesk')),
  [UserRole.ADMIN_STAFF]: React.lazy(() => import('./role-layouts/LayoutAdminStaff')),
  [UserRole.SCOREKEEPER]: React.lazy(() => import('./role-layouts/LayoutScorekeeper')),
  [UserRole.PLAYER]: React.lazy(() => import('./role-layouts/LayoutPlayer')),
  [UserRole.SPECTATOR]: React.lazy(() => import('./role-layouts/LayoutSpectator')),
};

// Define the layout props interface
export interface LayoutProps {
  children: React.ReactNode;
  permissions: typeof RolePermissions[keyof typeof RolePermissions];
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
  const permissions = RolePermissions[role] || RolePermissions[UserRole.SPECTATOR];

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
