import React from 'react';
import { Tournament } from '@/types/tournament';
import { TeamRegistration } from './registration/TeamRegistration';

interface TournamentTeamsProps {
  tournament: Tournament;
  onUpdate: (tournament: Tournament) => Promise<void>;
}

export const TournamentTeams: React.FC<TournamentTeamsProps> = ({ tournament, onUpdate }) => {
  // Use the enhanced TeamRegistration component for better functionality
  return <TeamRegistration tournament={tournament} onUpdate={onUpdate} />;
}; 