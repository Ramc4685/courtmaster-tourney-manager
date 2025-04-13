
import React from 'react';
import { RolePermissions } from '@/types/user';
import { Sidebar } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  permissions: RolePermissions;
}

export const LayoutPlayer: React.FC<LayoutProps> = ({ children, permissions }) => {
  const menuItems = [
    { label: 'My Matches', href: '/matches' },
    { label: 'Tournament Schedule', href: '/schedule' },
    { label: 'Results', href: '/results' },
    { label: 'Profile', href: '/profile' }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar items={menuItems} title="Player Portal" />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};
