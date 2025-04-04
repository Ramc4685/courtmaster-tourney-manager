import React from 'react';
import { useTournament } from '@/contexts/tournament/TournamentContext';

const Tournaments = () => {
  const tournament = useTournament();
  
  // Create wrapper functions for the missing methods
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
    </div>
  );
};

export default Tournaments;
