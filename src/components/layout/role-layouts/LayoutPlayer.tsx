
import React from 'react';
import { UserPermissions } from '@/types/user';
import { Sidebar } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  permissions: UserPermissions;
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
      <Sidebar items={menuItems} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};
