
import React from 'react';
import { Link } from 'react-router-dom';

export interface SidebarItem {
  label: string;
  href: string;
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, title = "CourtMaster" }) => {
  return (
    <div className="bg-slate-800 text-white w-60 h-full p-4">
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <nav>
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.href}>
              <Link 
                to={item.href}
                className="block p-2 hover:bg-slate-700 rounded transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
