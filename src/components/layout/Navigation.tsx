import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground';
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              CourtMaster
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/')}`}
              >
                Home
              </Link>
              <Link
                to="/tournaments/new"
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/tournaments/new')}`}
              >
                Create Tournament
              </Link>
              <Link
                to="/tournaments"
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/tournaments')}`}
              >
                Tournaments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 