
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Calendar, Users, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Navigation: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent/60 hover:text-accent-foreground';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="border-b sticky top-0 bg-white z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-xl font-bold">
              <Trophy className="h-6 w-6 mr-2 text-primary" />
              <span>CourtMaster</span>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/')}`}
              >
                Home
              </Link>
              <Link
                to="/tournaments"
                className={`rounded-md px-3 py-2 text-sm font-medium flex items-center ${isActive('/tournaments')}`}
              >
                <Calendar className="mr-1 h-4 w-4" />
                Tournaments
              </Link>
              <Link
                to="/quick-match"
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/quick-match')}`}
              >
                Quick Match
              </Link>
              <Link
                to="/login"
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/login')}`}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden border-t py-2 px-4 bg-white">
          <div className="flex flex-col space-y-2">
            <Link
              to="/"
              className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/tournaments"
              className={`rounded-md px-3 py-2 text-sm font-medium flex items-center ${isActive('/tournaments')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Calendar className="mr-1 h-4 w-4" />
              Tournaments
            </Link>
            <Link
              to="/quick-match"
              className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/quick-match')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Quick Match
            </Link>
            <Link
              to="/login"
              className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/login')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
