
import React, { createContext, useState, ReactNode, useEffect } from "react";
import { Tournament, Match, Court, Team, MatchStatus, Division } from "@/types/tournament";
import { createSampleData } from "@/utils/tournamentSampleData";
import { generateId, findMatchById, updateMatchInTournament } from "@/utils/tournamentUtils";
import { assignCourtToMatch, autoAssignCourts } from "@/utils/courtUtils";
import { TournamentContextType } from "./types";
import { 
  advanceToDivisionPlacement, 
  advanceToPlayoffKnockout 
} from "./stageProgression";
import {
  createNewTournament,
  deleteTournament as deleteT,
  addTeamToTournament,
  importTeamsToTournament,
  scheduleMatchInTournament,
  generateMultiStageTournament as generateMultiStage,
  moveTeamToDivision as moveTeam
} from "./tournamentOperations";
import {
  updateMatchScoreInTournament,
  updateMatchStatusInTournament,
  completeMatchInTournament
} from "./matchOperations";
import { realtimeTournamentService } from "@/services/realtime/RealtimeTournamentService";

export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage if available, otherwise use empty arrays/null
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const storedTournaments = localStorage.getItem('tournaments');
    console.log('[DEBUG] Loading tournaments from localStorage:', storedTournaments ? 'Found' : 'Not found');
    return storedTournaments ? JSON.parse(storedTournaments) : [];
  });
  
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(() => {
    const storedCurrentTournament = localStorage.getItem('currentTournament');
    console.log('[DEBUG] Loading current tournament from localStorage:', storedCurrentTournament ? 'Found' : 'Not found');
    return storedCurrentTournament ? JSON.parse(storedCurrentTournament) : null;
  });

  // Save to localStorage and publish updates to real-time service whenever tournaments or currentTournament change
  useEffect(() => {
    console.log('[DEBUG] Saving tournaments to localStorage. Count:', tournaments.length);
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    if (currentTournament) {
      console.log('[DEBUG] Saving current tournament to localStorage. ID:', currentTournament.id);
      localStorage.setItem('currentTournament', JSON.stringify(currentTournament));
      // Publish to real-time service
      console.log('[DEBUG] Publishing tournament update to realtime service. ID:', currentTournament.id);
      realtimeTournamentService.publishTournamentUpdate(currentTournament);
    }
  }, [currentTournament]);

  // Create a new tournament
  const createTournament = (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => {
    console.log('[DEBUG] Creating new tournament:', tournamentData.name);
    const { tournament, tournaments: newTournaments } = createNewTournament(tournamentData, tournaments);
    setTournaments(newTournaments);
    setCurrentTournament(tournament);
  };

  // Delete tournament
  const deleteTournament = (tournamentId: string) => {
    console.log('[DEBUG] Deleting tournament. ID:', tournamentId);
    const { tournaments: updatedTournaments, currentTournament: updatedCurrentTournament } = 
      deleteT(tournamentId, tournaments, currentTournament);
    
    setTournaments(updatedTournaments);
    if (currentTournament?.id === tournamentId) {
      console.log('[DEBUG] Current tournament deleted, setting current to:', updatedCurrentTournament ? updatedCurrentTournament.id : 'null');
      setCurrentTournament(updatedCurrentTournament);
    }
  };

  // Update tournament
  const updateTournament = (tournament: Tournament) => {
    console.log('[DEBUG] Updating tournament. ID:', tournament.id);
    const updatedTournament = { 
      ...tournament, 
      updatedAt: new Date() 
    };
    
    const updatedTournaments = tournaments.map(t => 
      t.id === tournament.id ? updatedTournament : t
    );
    
    setTournaments(updatedTournaments);
    
    if (currentTournament?.id === tournament.id) {
      console.log('[DEBUG] Updating current tournament.');
      setCurrentTournament(updatedTournament);
    }
    
    // Publish to real-time service
    console.log('[DEBUG] Publishing updated tournament to realtime service.');
    realtimeTournamentService.publishTournamentUpdate(updatedTournament);
  };

  // Add team to current tournament
  const addTeam = (team: Team) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot add team: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Adding team to tournament. Team:', team.name, 'Tournament:', currentTournament.id);
    const updatedTournament = addTeamToTournament(team, currentTournament);
    updateTournament(updatedTournament);
  };

  // Import multiple teams at once
  const importTeams = (teams: Team[]) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot import teams: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Importing', teams.length, 'teams to tournament. Tournament ID:', currentTournament.id);
    const updatedTournament = importTeamsToTournament(teams, currentTournament);
    updateTournament(updatedTournament);
  };

  // Update match
  const updateMatch = (match: Match) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot update match: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Updating match. Match ID:', match.id, 'Tournament ID:', currentTournament.id);
    const updatedTournament = updateMatchInTournament(currentTournament, match);
    updateTournament(updatedTournament);
  };

  // Update court
  const updateCourt = (court: Court) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot update court: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Updating court. Court ID:', court.id, 'Tournament ID:', currentTournament.id);
    const updatedCourts = currentTournament.courts.map(c => 
      c.id === court.id ? court : c
    );
    
    const updatedTournament = {
      ...currentTournament,
      courts: updatedCourts,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Assign court to match
  const assignCourt = (matchId: string, courtId: string) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot assign court: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Assigning court to match. Match ID:', matchId, 'Court ID:', courtId);
    const result = assignCourtToMatch(currentTournament, matchId, courtId);
    if (result) {
      updateTournament(result);
    } else {
      console.error('[ERROR] Failed to assign court. Match or court not found.');
    }
  };

  // Auto-assign available courts to scheduled matches
  // Updated to return Promise<number> to match the interface
  const autoAssignCourtsHandler = async (): Promise<number> => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot auto-assign courts: No current tournament selected.');
      return Promise.resolve(0);
    }
    
    console.log('[DEBUG] Auto-assigning courts to matches. Tournament ID:', currentTournament.id);
    const { tournament: updatedTournament, assignedCount } = autoAssignCourts(currentTournament);
    
    if (assignedCount > 0) {
      console.log('[DEBUG] Auto-assigned', assignedCount, 'courts to matches.');
      updateTournament(updatedTournament);
    } else {
      console.log('[DEBUG] No courts were auto-assigned.');
    }
    
    return Promise.resolve(assignedCount);
  };

  // Update match status
  const updateMatchStatus = (matchId: string, status: MatchStatus) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot update match status: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Updating match status. Match ID:', matchId, 'New status:', status);
    const updatedTournament = updateMatchStatusInTournament(matchId, status, currentTournament);
    updateTournament(updatedTournament);
  };

  // Update match score
  const updateMatchScore = (matchId: string, setIndex: number, team1Score: number, team2Score: number) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot update match score: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Updating match score. Match ID:', matchId, 'Set:', setIndex, 'Score:', team1Score, '-', team2Score);
    const updatedTournament = updateMatchScoreInTournament(
      matchId, 
      setIndex, 
      team1Score, 
      team2Score, 
      currentTournament
    );
    
    updateTournament(updatedTournament);
  };

  // Complete a match and auto-assign court to next match
  const completeMatch = (matchId: string) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot complete match: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Completing match. Match ID:', matchId);
    const updatedTournament = completeMatchInTournament(matchId, currentTournament);
    updateTournament(updatedTournament);
  };

  // Move team to a different division based on results
  const moveTeamToDivision = (teamId: string, fromDivision: Division, toDivision: Division) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot move team to division: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Moving team to division. Team ID:', teamId, 'From:', fromDivision, 'To:', toDivision);
    const updatedTournament = moveTeam(teamId, fromDivision, toDivision, currentTournament);
    updateTournament(updatedTournament);
  };

  // Schedule a new match with date and time
  const scheduleMatch = (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string) => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot schedule match: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Scheduling match. Team 1 ID:', team1Id, 'Team 2 ID:', team2Id, 
               'Time:', scheduledTime.toISOString(), 'Court:', courtId || 'None');
    const updatedTournament = scheduleMatchInTournament(
      team1Id, 
      team2Id, 
      scheduledTime, 
      currentTournament, 
      courtId
    );
    
    updateTournament(updatedTournament);
  };

  // Generate the 38-team multi-stage tournament with scheduled times
  const generateMultiStageTournament = () => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot generate tournament: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Generating multi-stage tournament. Tournament ID:', currentTournament.id);
    const updatedTournament = generateMultiStage(currentTournament);
    updateTournament(updatedTournament);
    
    // Auto-assign courts after creating matches
    console.log('[DEBUG] Auto-assigning courts after generating tournament.');
    setTimeout(() => autoAssignCourtsHandler(), 100);
  };
  
  // Advance to the next stage based on current results
  const advanceToNextStage = () => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot advance to next stage: No current tournament selected.');
      return;
    }
    
    console.log('[DEBUG] Advancing tournament to next stage. Current stage:', currentTournament.currentStage);
    switch (currentTournament.currentStage) {
      case "INITIAL_ROUND":
        console.log('[DEBUG] Advancing from INITIAL_ROUND to DIVISION_PLACEMENT');
        const updatedTournament1 = advanceToDivisionPlacement(currentTournament);
        updateTournament(updatedTournament1);
        autoAssignCourtsHandler();
        break;
      case "DIVISION_PLACEMENT":
        console.log('[DEBUG] Advancing from DIVISION_PLACEMENT to PLAYOFF_KNOCKOUT');
        const updatedTournament2 = advanceToPlayoffKnockout(currentTournament);
        updateTournament(updatedTournament2);
        autoAssignCourtsHandler();
        break;
      default:
        console.warn('[WARN] Cannot advance: Tournament is already in final stage or unknown stage.');
        break;
    }
  };
  
  // Generate bracket based on match results
  const generateBracket = () => {
    if (!currentTournament) {
      console.error('[ERROR] Cannot generate bracket: No current tournament selected.');
      return;
    }
    
    // Placeholder for real bracket generation logic
    console.log('[DEBUG] Generating bracket for tournament. ID:', currentTournament.id);
    // This would typically create a tournament bracket based on seeding
    // and add it to the matches array
  };
  
  // Load sample data
  const loadSampleData = () => {
    console.log('[DEBUG] Loading sample tournament data');
    const sampleData = createSampleData();
    setCurrentTournament(sampleData);
    setTournaments(prev => [...prev, sampleData]);
  };
  
  // Return the context provider with all methods and state
  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        currentTournament,
        setCurrentTournament,
        createTournament,
        updateTournament,
        deleteTournament,
        addTeam,
        importTeams,
        updateMatch,
        updateCourt,
        assignCourt,
        updateMatchStatus,
        updateMatchScore,
        completeMatch,
        moveTeamToDivision,
        loadSampleData,
        scheduleMatch,
        generateBracket,
        autoAssignCourts: autoAssignCourtsHandler,
        generateMultiStageTournament,
        advanceToNextStage
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};
