
import React from 'react';
import { UserPermissions } from '@/types/user';
import { Sidebar } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  permissions: UserPermissions;
}

export const LayoutScorekeeper: React.FC<LayoutProps> = ({ children, permissions }) => {
  const menuItems = [
    { label: 'Active Matches', href: '/scoring' },
    { label: 'Match History', href: '/matches' },
    { label: 'Court Status', href: '/courts' }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar items={menuItems} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};
