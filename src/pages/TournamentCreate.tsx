
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TournamentCreateComponent from './tournament/TournamentCreate';
import { useTournament } from '@/contexts/TournamentContext';

// This is a wrapper component that redirects properly after tournament creation
const TournamentCreatePage = () => {
  const navigate = useNavigate();
  const { createTournament } = useTournament();

  const handleTournamentCreated = (tournament: any) => {
    console.log("Tournament created successfully:", tournament);
    navigate(`/tournament/${tournament.id}`);
  };

  return <TournamentCreateComponent onTournamentCreated={handleTournamentCreated} />;
};

export default TournamentCreatePage;
