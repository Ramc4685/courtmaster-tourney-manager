
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useStore } from '../stores/store';
import NotificationDropdown from './notification/NotificationDropdown';

export default function Navbar() {
  const { signOut } = useAuth();
  const { user, notifications, unreadCount } = useStore();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                CourtMaster
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <NotificationDropdown />
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <Link
                    to="/profile"
                    className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.display_name || 'User'}`}
                      alt=""
                    />
                    <span className="ml-3 text-gray-700">{user?.display_name || 'User'}</span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
