import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { tournamentService } from '@/services/tournament/TournamentService';
import { Tournament } from "@/types/tournament";
import { TournamentStatus } from "@/types/tournament-enums";
import { Plus, Search } from 'lucide-react';

export default function TournamentListPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        console.log('[DEBUG] Loading tournaments...');
        const data = await tournamentService.getTournaments();
        console.log('[DEBUG] Loaded tournaments:', data);
        setTournaments(data);
        setError(null);
      } catch (error) {
        console.error('Error loading tournaments:', error);
        setError('Failed to load tournaments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.IN_PROGRESS:
        return 'bg-blue-500';
      case TournamentStatus.COMPLETED:
        return 'bg-green-500';
      case TournamentStatus.PUBLISHED:
        return 'bg-yellow-500';
      case TournamentStatus.CANCELLED:
        return 'bg-red-500';
      case TournamentStatus.DRAFT:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!tournaments.length) {
    return (
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Tournaments
            </h2>
          </div>
          {(user?.role === 'admin' || user?.role === 'organizer') && (
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                to="/tournaments/new"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                New Tournament
              </Link>
            </div>
          )}
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">No tournaments found.</p>
          {(user?.role === 'admin' || user?.role === 'organizer') && (
            <p className="mt-2">
              <Link
                to="/tournaments/new"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Create your first tournament
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Tournaments
          </h2>
        </div>
        {(user?.role === 'admin' || user?.role === 'organizer') && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/tournaments/new"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Tournament
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search tournaments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-shrink-0">
              <select
                id="status"
                name="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="registration">Registration</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Venue
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTournaments.map((tournament) => (
                        <tr key={tournament.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link
                              to={`/tournaments/${tournament.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {tournament.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(tournament.status)}`}
                            >
                              {tournament.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(tournament.startDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tournament.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/tournaments/${tournament.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 