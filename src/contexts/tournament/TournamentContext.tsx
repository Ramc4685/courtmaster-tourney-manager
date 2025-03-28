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
    return storedTournaments ? JSON.parse(storedTournaments) : [];
  });
  
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(() => {
    const storedCurrentTournament = localStorage.getItem('currentTournament');
    return storedCurrentTournament ? JSON.parse(storedCurrentTournament) : null;
  });

  // Save to localStorage and publish updates to real-time service whenever tournaments or currentTournament change
  useEffect(() => {
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    if (currentTournament) {
      localStorage.setItem('currentTournament', JSON.stringify(currentTournament));
      // Publish to real-time service
      realtimeTournamentService.publishTournamentUpdate(currentTournament);
    }
  }, [currentTournament]);

  // Create a new tournament
  const createTournament = (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => {
    const { tournament, tournaments: newTournaments } = createNewTournament(tournamentData, tournaments);
    setTournaments(newTournaments);
    setCurrentTournament(tournament);
  };

  // Delete tournament
  const deleteTournament = (tournamentId: string) => {
    const { tournaments: updatedTournaments, currentTournament: updatedCurrentTournament } = 
      deleteT(tournamentId, tournaments, currentTournament);
    
    setTournaments(updatedTournaments);
    if (currentTournament?.id === tournamentId) {
      setCurrentTournament(updatedCurrentTournament);
    }
  };

  // Update tournament
  const updateTournament = (tournament: Tournament) => {
    const updatedTournament = { 
      ...tournament, 
      updatedAt: new Date() 
    };
    
    const updatedTournaments = tournaments.map(t => 
      t.id === tournament.id ? updatedTournament : t
    );
    
    setTournaments(updatedTournaments);
    
    if (currentTournament?.id === tournament.id) {
      setCurrentTournament(updatedTournament);
    }
    
    // Publish to real-time service
    realtimeTournamentService.publishTournamentUpdate(updatedTournament);
  };

  // Add team to current tournament
  const addTeam = (team: Team) => {
    if (!currentTournament) return;
    
    const updatedTournament = addTeamToTournament(team, currentTournament);
    updateTournament(updatedTournament);
  };

  // Import multiple teams at once
  const importTeams = (teams: Team[]) => {
    if (!currentTournament) return;
    
    const updatedTournament = importTeamsToTournament(teams, currentTournament);
    updateTournament(updatedTournament);
  };

  // Update match
  const updateMatch = (match: Match) => {
    if (!currentTournament) return;
    
    const updatedTournament = updateMatchInTournament(currentTournament, match);
    updateTournament(updatedTournament);
  };

  // Update court
  const updateCourt = (court: Court) => {
    if (!currentTournament) return;
    
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
    if (!currentTournament) return;
    
    const result = assignCourtToMatch(currentTournament, matchId, courtId);
    if (result) {
      updateTournament(result);
    }
  };

  // Auto-assign available courts to scheduled matches
  // Updated to return Promise<number> to match the interface
  const autoAssignCourtsHandler = async (): Promise<number> => {
    if (!currentTournament) return Promise.resolve(0);
    
    const { tournament: updatedTournament, assignedCount } = autoAssignCourts(currentTournament);
    
    if (assignedCount > 0) {
      updateTournament(updatedTournament);
    }
    
    return Promise.resolve(assignedCount);
  };

  // Update match status
  const updateMatchStatus = (matchId: string, status: MatchStatus) => {
    if (!currentTournament) return;
    
    const updatedTournament = updateMatchStatusInTournament(matchId, status, currentTournament);
    updateTournament(updatedTournament);
  };

  // Update match score
  const updateMatchScore = (matchId: string, setIndex: number, team1Score: number, team2Score: number) => {
    if (!currentTournament) return;
    
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
    if (!currentTournament) return;
    
    const updatedTournament = completeMatchInTournament(matchId, currentTournament);
    updateTournament(updatedTournament);
  };

  // Move team to a different division based on results
  const moveTeamToDivision = (teamId: string, fromDivision: Division, toDivision: Division) => {
    if (!currentTournament) return;
    
    const updatedTournament = moveTeam(teamId, fromDivision, toDivision, currentTournament);
    updateTournament(updatedTournament);
  };

  // Schedule a new match with date and time
  const scheduleMatch = (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string) => {
    if (!currentTournament) return;
    
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
    if (!currentTournament) return;
    
    const updatedTournament = generateMultiStage(currentTournament);
    updateTournament(updatedTournament);
    
    // Auto-assign courts after creating matches
    setTimeout(() => autoAssignCourtsHandler(), 100);
  };
  
  // Advance to the next stage based on current results
  const advanceToNextStage = () => {
    if (!currentTournament) return;
    
    switch (currentTournament.currentStage) {
      case "INITIAL_ROUND":
        const updatedTournament1 = advanceToDivisionPlacement(currentTournament);
        updateTournament(updatedTournament1);
        autoAssignCourtsHandler();
        break;
      case "DIVISION_PLACEMENT":
        const updatedTournament2 = advanceToPlayoffKnockout(currentTournament);
        updateTournament(updatedTournament2);
        autoAssignCourtsHandler();
        break;
      default:
        break;
    }
  };
  
  // Generate bracket based on match results
  const generateBracket = () => {
    if (!currentTournament) return;
    
    // Placeholder for real bracket generation logic
    console.log("Generating bracket...");
    // This would typically create a tournament bracket based on seeding
    // and add it to the matches array
  };
  
  // Load sample data
  const loadSampleData = () => {
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
