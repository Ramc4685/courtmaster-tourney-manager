
import React, { createContext, useState, ReactNode, useEffect } from "react";
import { Tournament, Match, Court, Team, MatchStatus, Division, TournamentStage, TournamentFormat, TournamentCategory } from "@/types/tournament";
import { createSampleData, getSampleDataByFormat } from "@/utils/tournamentSampleData";
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
import { useAuth } from "@/contexts/auth/AuthContext";
import { assignTournamentSeeding } from "./tournamentOperations";
import { assignPlayerSeeding } from "@/utils/tournamentProgressionUtils";

export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
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
  const createTournament = (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">): Tournament => {
    console.log('[DEBUG] Creating new tournament:', tournamentData.name);
    const { tournament, tournaments: updatedTournaments } = createNewTournament(tournamentData, tournaments);
    
    setTournaments(updatedTournaments);
    setCurrentTournament(tournament);
    
    return tournament;
  };

  // Delete a tournament
  const deleteTournament = (tournamentId: string) => {
    console.log('[DEBUG] Deleting tournament:', tournamentId);
    const { tournaments: updatedTournaments, currentTournament: updatedCurrentTournament } = deleteT(
      tournamentId,
      tournaments,
      currentTournament
    );
    
    setTournaments(updatedTournaments);
    setCurrentTournament(updatedCurrentTournament);
  };

  // Update a tournament
  const updateTournament = (tournament: Tournament) => {
    console.log('[DEBUG] Updating tournament:', tournament.id);
    const updatedTournaments = tournaments.map(t => t.id === tournament.id ? tournament : t);
    
    setTournaments(updatedTournaments);
    if (currentTournament && currentTournament.id === tournament.id) {
      setCurrentTournament(tournament);
    }
  };

  // Add a team to the current tournament
  const addTeam = (team: Team) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Adding team to tournament:', team.name);
    const updatedTournament = addTeamToTournament(team, currentTournament);
    
    updateTournament(updatedTournament);
  };
  
  // Import multiple teams to the current tournament
  const importTeams = (teams: Team[]) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Importing teams to tournament. Count:', teams.length);
    const updatedTournament = importTeamsToTournament(teams, currentTournament);
    
    updateTournament(updatedTournament);
  };

  // Update a match in the current tournament
  const updateMatch = (match: Match) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Updating match:', match.id);
    const updatedMatches = currentTournament.matches.map(m => m.id === match.id ? match : m);
    
    updateTournament({
      ...currentTournament,
      matches: updatedMatches,
      updatedAt: new Date()
    });
  };

  // Update a court in the current tournament
  const updateCourt = (court: Court) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Updating court:', court.id);
    const updatedCourts = currentTournament.courts.map(c => c.id === court.id ? court : c);
    
    updateTournament({
      ...currentTournament,
      courts: updatedCourts,
      updatedAt: new Date()
    });
  };

  // Assign a court to a match
  const assignCourt = (matchId: string, courtId: string) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Assigning court to match. Match:', matchId, 'Court:', courtId);
    const match = findMatchById(currentTournament, matchId);
    const court = currentTournament.courts.find(c => c.id === courtId);
    
    if (!match || !court) return;
    
    const updatedTournament = assignCourtToMatch(currentTournament, matchId, courtId);
    
    if (updatedTournament) {
      updateTournament(updatedTournament);
    }
  };

  // Update match status
  const updateMatchStatus = (matchId: string, status: MatchStatus) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Updating match status. Match:', matchId, 'Status:', status);
    const updatedTournament = updateMatchStatusInTournament(matchId, status, currentTournament);
    
    updateTournament(updatedTournament);
  };

  // Update match score
  const updateMatchScore = (matchId: string, setIndex: number, team1Score: number, team2Score: number) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Updating match score. Match:', matchId, 'Set:', setIndex, 'Score:', team1Score, '-', team2Score);
    const updatedTournament = updateMatchScoreInTournament(matchId, setIndex, team1Score, team2Score, currentTournament);
    
    updateTournament(updatedTournament);
  };

  // Complete a match
  const completeMatch = (matchId: string) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Completing match:', matchId);
    const updatedTournament = completeMatchInTournament(matchId, currentTournament);
    
    updateTournament(updatedTournament);
  };

  // Move a team to a different division
  const moveTeamToDivision = (teamId: string, fromDivision: Division, toDivision: Division) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Moving team between divisions. Team:', teamId, 'From:', fromDivision, 'To:', toDivision);
    const updatedTournament = moveTeam(teamId, fromDivision, toDivision, currentTournament);
    
    updateTournament(updatedTournament);
  };

  // Load sample data
  const loadSampleData = (format?: TournamentFormat) => {
    console.log('[DEBUG] Loading sample data. Format:', format || 'default');
    const sampleData = format ? getSampleDataByFormat(format) : createSampleData();
    
    setCurrentTournament(sampleData);
    setTournaments(prevTournaments => {
      const filteredTournaments = prevTournaments.filter(t => t.id !== sampleData.id);
      return [...filteredTournaments, sampleData];
    });
  };

  // Schedule a match
  const scheduleMatch = (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Scheduling match. Team1:', team1Id, 'Team2:', team2Id, 'Time:', scheduledTime);
    const updatedTournament = scheduleMatchInTournament(team1Id, team2Id, scheduledTime, currentTournament, courtId);
    
    updateTournament(updatedTournament);
  };

  // Generate bracket
  const generateBracket = () => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Generating bracket');
    // Implementation would go here
  };

  // Auto-assign courts
  const autoAssignCourtsHandler = async (): Promise<number> => {
    if (!currentTournament) return 0;
    
    console.log('[DEBUG] Auto-assigning courts');
    const result = await autoAssignCourts(currentTournament);
    
    updateTournament(result.tournament);
    return result.assignedCount;
  };

  // Generate multi-stage tournament
  const generateMultiStageTournament = () => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Generating multi-stage tournament');
    const updatedTournament = generateMultiStage(currentTournament);
    
    updateTournament(updatedTournament);
  };

  // Advance to next stage
  const advanceToNextStage = () => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Advancing to next stage. Current stage:', currentTournament.currentStage);
    let updatedTournament = currentTournament;
    
    switch (currentTournament.currentStage) {
      case "INITIAL_ROUND":
        updatedTournament = advanceToDivisionPlacement(currentTournament);
        break;
      case "DIVISION_PLACEMENT":
        updatedTournament = advanceToPlayoffKnockout(currentTournament);
        break;
      // Add more cases for other stages as needed
    }
    
    updateTournament(updatedTournament);
  };

  // Assign seeding
  const assignSeeding = (tournamentId: string) => {
    console.log('[DEBUG] Assigning seeding for tournament:', tournamentId);
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;
    
    const updatedTournament = assignTournamentSeeding(tournamentId, tournaments);
    if (updatedTournament) {
      updateTournament(updatedTournament);
    }
  };

  // Add category to tournament
  const addCategory = (category: Omit<TournamentCategory, "id">) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Adding category to tournament:', category.name);
    const newCategory = {
      ...category,
      id: crypto.randomUUID()
    };
    
    const updatedTournament = {
      ...currentTournament,
      categories: [...currentTournament.categories, newCategory],
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Remove category from tournament
  const removeCategory = (categoryId: string) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Removing category from tournament. Category ID:', categoryId);
    const updatedTournament = {
      ...currentTournament,
      categories: currentTournament.categories.filter(c => c.id !== categoryId),
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Update category in tournament
  const updateCategory = (category: TournamentCategory) => {
    if (!currentTournament) return;
    
    console.log('[DEBUG] Updating category in tournament. Category ID:', category.id);
    const updatedTournament = {
      ...currentTournament,
      categories: currentTournament.categories.map(c => c.id === category.id ? category : c),
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

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
        advanceToNextStage,
        assignSeeding,
        // Add the new category operations
        addCategory,
        removeCategory,
        updateCategory
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};
