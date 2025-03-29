
import React from 'react';
import TournamentCreate from './tournament/TournamentCreate';

// This is just a re-export wrapper to maintain backward compatibility with the App.tsx routes
const TournamentCreatePage = () => {
  return <TournamentCreate />;
};

export default TournamentCreatePage;
