
import React from 'react';
import { RolePermissions } from '@/types/user';
import { Sidebar } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  permissions: RolePermissions;
}

export const LayoutScorekeeper: React.FC<LayoutProps> = ({ children, permissions }) => {
  const menuItems = [
    { label: 'Active Matches', href: '/scoring' },
    { label: 'Match History', href: '/matches' },
    { label: 'Court Status', href: '/courts' }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar items={menuItems} title="Scorekeeper" />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};
