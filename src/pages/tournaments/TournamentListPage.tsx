import { useEffect } from 'react';
import { useTournament } from '@/contexts/tournament/TournamentContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TournamentList } from '@/components/tournament/TournamentList';
import PageHeader from '@/components/shared/PageHeader';

const TournamentListPage = () => {
  const navigate = useNavigate();
  const { tournaments, loadTournaments, isLoading, error } = useTournament();

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="Tournaments"
        description="Manage your tournaments and create new ones"
        action={
          <Button onClick={() => navigate('/tournaments/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Tournament
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : (
        <TournamentList tournaments={tournaments} />
      )}
    </div>
  );
};

export default TournamentListPage; 