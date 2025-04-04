
import React from 'react';
import { useTournament } from '@/contexts/tournament/useTournament';

const Tournaments = () => {
  const tournament = useTournament();
  
  // Create wrapper functions for the methods
  const handleLoadSample = async () => {
    try {
      await tournament.loadSampleData();
    } catch (error) {
      console.error("Failed to load sample data", error);
    }
  }
  
  const handleDeleteTournament = async (id: string) => {
    try {
      await tournament.deleteTournament(id);
    } catch (error) {
      console.error("Failed to delete tournament", error);
    }
  }
  
  return (
    <div>
      {/* Use wrapper functions instead of directly calling methods */}
      <button onClick={handleLoadSample}>Load Sample Data</button>
      {tournament.tournaments.map(t => (
        <div key={t.id}>
          {t.name}
          <button onClick={() => handleDeleteTournament(t.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default Tournaments;
