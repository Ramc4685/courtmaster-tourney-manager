
import { useContext } from 'react';
import { TournamentContext } from './TournamentContext';
import { Tournament, Match, Court, Team, Division, TournamentFormat } from '@/types/tournament';
import { schedulingService } from '@/services/tournament/SchedulingService';

export const useTournament = () => {
  const context = useContext(TournamentContext);
  
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  
  // Add our refined functionalities
  const generateBrackets = async (): Promise<number> => {
    if (!context.currentTournament) {
      throw new Error('No current tournament loaded');
    }
    
    // Use the scheduling service to generate brackets based on formats
    const updatedTournament = schedulingService.generateBrackets(context.currentTournament);
    
    // Update the tournament in our context
    context.updateTournament(updatedTournament);
    
    // Return the number of new matches created (calculate the difference)
    return updatedTournament.matches.length - context.currentTournament.matches.length;
  };
  
  // We'll enhance the autoAssignCourts function to be more efficient
  const enhancedAutoAssignCourts = async (): Promise<number> => {
    if (!context.currentTournament) {
      throw new Error('No current tournament loaded');
    }
    
    // Use the scheduling service to assign courts
    const result = await schedulingService.assignCourtsToScheduledMatches(context.currentTournament);
    
    // Update the tournament in our context
    context.updateTournament(result.tournament);
    
    // Return the number of courts assigned
    return result.assignedCourts;
  };
  
  return {
    ...context,
    // Override autoAssignCourts with our enhanced version
    autoAssignCourts: enhancedAutoAssignCourts,
    // Add the new generateBrackets function
    generateBrackets
  };
};
