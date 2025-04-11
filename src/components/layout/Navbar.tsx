import React from 'react';
import { Link } from 'react-router-dom';
import { UserMenu } from '../auth/UserMenu';
import { Trophy, Calendar, Users, Settings } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">CourtMaster</span>
            </Link>

            <div className="hidden md:flex space-x-6">
              <Link to="/tournaments" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <Calendar className="h-4 w-4" />
                <span>Tournaments</span>
              </Link>
              <Link to="/teams" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <Users className="h-4 w-4" />
                <span>Teams</span>
              </Link>
              <Link to="/settings" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>

          <UserMenu />
        </div>
      </div>
    </nav>
  );
};