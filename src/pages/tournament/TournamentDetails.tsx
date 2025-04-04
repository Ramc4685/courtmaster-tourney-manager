
import React from 'react';
import { useParams } from 'react-router-dom';

const TournamentDetails = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tournament Details</h1>
      <p>Loading tournament details for ID: {tournamentId}</p>
      <p>This is a placeholder component. The actual implementation will be added later.</p>
    </div>
  );
};

export default TournamentDetails;
