
import React from 'react';
import { UserPermissions } from '@/types/user';

interface LayoutProps {
  children: React.ReactNode;
  permissions: UserPermissions;
}

export const LayoutSpectator: React.FC<LayoutProps> = ({ children, permissions }) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="container mx-auto p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">CourtMaster</h1>
            <div className="space-x-4">
              <a href="/tournaments" className="text-foreground/80 hover:text-foreground">
                Live Matches
              </a>
              <a href="/results" className="text-foreground/80 hover:text-foreground">
                Results
              </a>
            </div>
          </div>
        </nav>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
      
      <footer className="border-t mt-auto">
        <div className="container mx-auto p-4 text-center text-sm text-muted-foreground">
          Live Tournament Updates
        </div>
      </footer>
    </div>
  );
};


