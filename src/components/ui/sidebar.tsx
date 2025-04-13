
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
  footer?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  title = "CourtMaster", 
  footer,
  className
}) => {
  const location = useLocation();
  
  return (
    <div className={cn("h-screen bg-white border-r flex flex-col w-64 shrink-0", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Logo className="h-8 w-8" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {items.map((item) => {
            const isActive = location.pathname === item.href || 
                          location.pathname.startsWith(`${item.href}/`);
            
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {footer && (
        <div className="p-4 border-t mt-auto">
          {footer}
        </div>
      )}
    </div>
  );
};
