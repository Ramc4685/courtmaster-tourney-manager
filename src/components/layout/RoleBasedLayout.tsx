
import React from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { RolePermissions } from '@/types/user';
import { 
  LayoutDirector, 
  LayoutFrontDesk,
  LayoutAdminStaff,
  LayoutScorekeeper,
  LayoutPlayer,
  LayoutSpectator 
} from './role-layouts';

const RoleBasedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <LayoutSpectator>{children}</LayoutSpectator>;
  }

  const roleLayouts = {
    tournament_director: LayoutDirector,
    front_desk: LayoutFrontDesk,
    admin_staff: LayoutAdminStaff,
    scorekeeper: LayoutScorekeeper,
    player: LayoutPlayer,
    spectator: LayoutSpectator
  };

  const RoleLayout = roleLayouts[user.role] || LayoutSpectator;
  const permissions = RolePermissions[user.role];

  return (
    <RoleLayout permissions={permissions}>
      {children}
    </RoleLayout>
  );
};

export default RoleBasedLayout;
