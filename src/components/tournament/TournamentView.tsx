
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const TournamentView = () => {
  const { id } = useParams<{ id: string }>();
  const { currentTournament, setCurrentTournament } = useTournament();
  
  React.useEffect(() => {
    if (id) {
      // Here you would typically fetch tournament data
      console.log(`Loading tournament with ID: ${id}`);
    }
  }, [id]);

  if (!currentTournament) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-1/2" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{currentTournament.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            {currentTournament.description || "No description available"}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="font-medium">Location</h3>
              <p>{currentTournament.location || "TBD"}</p>
            </div>
            <div>
              <h3 className="font-medium">Format</h3>
              <p>{currentTournament.format}</p>
            </div>
            <div>
              <h3 className="font-medium">Start Date</h3>
              <p>{currentTournament.startDate.toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="font-medium">End Date</h3>
              <p>{currentTournament.endDate.toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentView;
