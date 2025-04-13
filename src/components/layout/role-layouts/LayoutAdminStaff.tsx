
import React from 'react';
import { RolePermissions } from '@/types/user';
import { Sidebar } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  permissions: RolePermissions;
}

export const LayoutAdminStaff: React.FC<LayoutProps> = ({ children, permissions }) => {
  const menuItems = [
    { label: 'Tournament Overview', href: '/tournaments' },
    { label: 'Court Management', href: '/courts' },
    { label: 'Schedule Changes', href: '/schedule' },
    { label: 'Player Management', href: '/players' }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar items={menuItems} title="Admin Staff" />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};
