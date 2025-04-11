
import React from 'react';
import { RolePermissions } from '@/types/user';

interface LayoutProps {
  children: React.ReactNode;
  permissions: typeof RolePermissions[keyof typeof RolePermissions];
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
      <div className="bg-slate-800 text-white w-60 p-4">
        <h2 className="text-xl font-bold mb-6">Player Portal</h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map(item => (
              <li key={item.href}>
                <a 
                  href={item.href}
                  className="block p-2 hover:bg-slate-700 rounded transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
};
