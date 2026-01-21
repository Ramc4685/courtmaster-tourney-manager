import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-primary font-medium' : 'text-slate-700 dark:text-slate-300 hover:text-primary';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const navElements = document.querySelectorAll('#app-navigation');
    if (navElements.length > 1) {
      console.warn(`[Navigation] Multiple navigation components detected (${navElements.length}).`);
    }
  }, []);

  return (
    <header
      id="app-navigation"
      data-testid="app-navigation"
      data-debug="navigation-root"
      className="relative flex items-center justify-between whitespace-nowrap border-b border-primary/20 dark:border-primary/30 px-10 py-3 bg-card sticky top-0 z-50"
    >
      {/* Logo and Brand */}
      <div className="flex items-center gap-4 text-slate-900 dark:text-white">
        <div className="size-6 text-primary">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
          </svg>
        </div>
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="text-lg font-bold">
          CourtMaster
        </Link>
      </div>

      {/* Desktop Navigation and User Section */}
      <div className="flex flex-1 items-center justify-end gap-6">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${isActive('/dashboard')}`}
              >
                Dashboard
              </Link>
              <Link
                to="/tournaments"
                className={`text-sm font-medium transition-colors ${isActive('/tournaments')}`}
              >
                Tournaments
              </Link>
              <Link
                to="/tournaments/new"
                className={`text-sm font-medium transition-colors ${isActive('/tournaments/new')}`}
              >
                Events
              </Link>
              <Link
                to="/profile"
                className={`text-sm font-medium transition-colors ${isActive('/profile')}`}
              >
                Players
              </Link>
              <Link
                to="/reports"
                className={`text-sm font-medium transition-colors ${isActive('/reports')}`}
              >
                Reports
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${isActive('/')}`}
              >
                Home
              </Link>
              <Link
                to="/tournaments"
                className={`text-sm font-medium transition-colors ${isActive('/tournaments')}`}
              >
                Tournaments
              </Link>
              <Link
                to="/login"
                className={`text-sm font-medium transition-colors ${isActive('/login')}`}
              >
                Login
              </Link>
            </>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          {isAuthenticated && (
            <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-background hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">
                notifications
              </span>
            </button>
          )}

          {/* User Avatar */}
          {isAuthenticated && (
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/30"
                 style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC8bWPEHd-i1S9ODpeJs8wOXqBLGoevRbF-02kvmWiQQwT6U-cb3jU4Fa7rks6TpUntoaQHZZJQ1Mcp3ICxKTYrM1gTlD5uuTD-EEGWvuki4dW6Z42XcPJotz-kph1IUC_LZ_YLE9-X56IMPUi_uNDd3kUjZwwqrs1gExRYySZbWkfYErb5Vtie7vGUQP-_KEWUjgotUfGsNPfbV1QoHmCPk_nGpM5kiudbcOOGCtG7ZoIDy7OP-q2mRJJVOqztmNGnq2nnK4npykCV")'}}>
            </div>
          )}

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
        </div>
      </div>
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden border-t border-primary/20 py-4 px-10 bg-card shadow-lg">
          <div className="flex flex-col space-y-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors ${isActive('/dashboard')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tournaments"
                  className={`text-sm font-medium transition-colors ${isActive('/tournaments')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tournaments
                </Link>
                <Link
                  to="/tournaments/new"
                  className={`text-sm font-medium transition-colors ${isActive('/tournaments/new')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Events
                </Link>
                <Link
                  to="/profile"
                  className={`text-sm font-medium transition-colors ${isActive('/profile')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Players
                </Link>
                <Link
                  to="/reports"
                  className={`text-sm font-medium transition-colors ${isActive('/reports')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Reports
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors ${isActive('/')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/tournaments"
                  className={`text-sm font-medium transition-colors ${isActive('/tournaments')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tournaments
                </Link>
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors ${isActive('/login')}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
