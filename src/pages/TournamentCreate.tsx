
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TournamentCreate from './tournament/TournamentCreate';

// This is just a re-export wrapper to maintain backward compatibility with the App.tsx routes
const TournamentCreatePage = () => {
  const navigate = useNavigate();
  
  return <TournamentCreate />;
};

export default TournamentCreatePage;
