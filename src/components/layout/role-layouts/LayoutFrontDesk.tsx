
import React from 'react';
import { UserPermissions } from '@/types/user';
import { Sidebar } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  permissions: UserPermissions;
}

export const LayoutFrontDesk: React.FC<LayoutProps> = ({ children, permissions }) => {
  const menuItems = [
    { label: 'Check-In', href: '/check-in' },
    { label: 'Registration', href: '/registration' },
    { label: 'Tournament Info', href: '/info' },
    { label: 'Announcements', href: '/announcements' }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar items={menuItems} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};
