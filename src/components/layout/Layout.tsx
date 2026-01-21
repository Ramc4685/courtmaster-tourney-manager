
import React from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <Navigation />
        <main className="flex flex-1 justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="w-full flex flex-col gap-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
