import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const UserMenu = () => {
  const { user, logout, demoMode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={toggleMenu}
        className="rounded-full h-9 w-9 flex items-center justify-center"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.display_name || user?.full_name || 'User'}`} />
          <AvatarFallback>{user?.display_name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      </Button>
      
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            <div className="px-4 py-3">
              <p className="text-sm">Signed in as</p>
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.full_name || user?.display_name || 'User'}
              </p>
              <p className="truncate text-sm text-gray-500">
                {user?.email || 'No email available'}
              </p>
            </div>
            
            <button
              type="button"
              className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              role="menuitem"
              tabIndex={-1}
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
