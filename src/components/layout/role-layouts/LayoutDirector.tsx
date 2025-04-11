
import React from 'react';
import { UserPermissions } from '@/types/user';
import { Sidebar } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  permissions: UserPermissions;
}

export const LayoutDirector: React.FC<LayoutProps> = ({ children, permissions }) => {
  const menuItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Tournaments', href: '/tournaments' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'User Management', href: '/users' },
    { label: 'System Settings', href: '/settings' }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar items={menuItems} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};
