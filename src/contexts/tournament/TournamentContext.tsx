
import React, { createContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
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
import { assignTournamentSeeding } from "./tournamentOperations";
import { assignPlayerSeeding } from "@/utils/tournamentProgressionUtils";
import { getCategoryDemoData } from "@/utils/tournamentSampleData";
import { schedulingService, SchedulingOptions, SchedulingResult } from "@/services/tournament/SchedulingService";

// Import useAuth but handle the case where it might not be available
import { useAuth } from "@/contexts/auth/AuthContext";

export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  // Try to use auth context but handle case where it might not be available
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext?.user || null;
  } catch (error) {
    console.warn('Auth context not available, proceeding without user data');
  }
  
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
  
  // Use refs to track previous values and prevent unnecessary updates
  const tournamentsRef = useRef<Tournament[]>(tournaments);
  const currentTournamentRef = useRef<Tournament | null>(currentTournament);
  
  // Throttle updates to localStorage to prevent too many writes
  const saveToLocalStorageThrottled = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  }, []);

  // Save to localStorage whenever tournaments change
  useEffect(() => {
    // Only update if the tournaments have actually changed
    if (tournaments !== tournamentsRef.current) {
      console.log('[DEBUG] Saving tournaments to localStorage. Count:', tournaments.length);
      
      // Use setTimeout to ensure this happens outside the current render cycle
      const timeoutId = setTimeout(() => {
        saveToLocalStorageThrottled('tournaments', tournaments);
        tournamentsRef.current = tournaments;
      }, 0);
      
      // Cleanup timeout on component unmount
      return () => clearTimeout(timeoutId);
    }
  }, [tournaments, saveToLocalStorageThrottled]);

  // Save current tournament and publish updates
  useEffect(() => {
    // Only update if the current tournament has actually changed
    if (currentTournament !== currentTournamentRef.current) {
      if (currentTournament) {
        console.log('[DEBUG] Saving current tournament to localStorage. ID:', currentTournament.id);
        
        // Use setTimeout to ensure this happens outside the current render cycle
        const timeoutId = setTimeout(() => {
          saveToLocalStorageThrottled('currentTournament', currentTournament);
          
          // Publish to real-time service
          console.log('[DEBUG] Publishing tournament update to realtime service. ID:', currentTournament.id);
          realtimeTournamentService.publishTournamentUpdate(currentTournament);
          
          // Update ref after successful publish
          currentTournamentRef.current = currentTournament;
        }, 0);
        
        // Cleanup timeout on component unmount
        return () => clearTimeout(timeoutId);
      } else {
        // Current tournament is null, remove from localStorage
        localStorage.removeItem('currentTournament');
        currentTournamentRef.current = null;
      }
    }
  }, [currentTournament, saveToLocalStorageThrottled]);

  // When tournaments list changes, check if currentTournament still exists
  // This effect doesn't depend on currentTournament to avoid circular dependencies
  const checkCurrentTournamentExists = useCallback(() => {
    // If we have a current tournament, check if it still exists in the tournaments list
    if (currentTournament) {
      const stillExists = tournaments.some(t => t.id === currentTournament.id);
      
      if (!stillExists) {
        console.log('[DEBUG] Current tournament no longer exists, clearing it');
        setCurrentTournament(null);
      }
    }
  }, [tournaments, currentTournament]);
  
  useEffect(() => {
    // If there are no tournaments left, clear the current tournament
    if (tournaments.length === 0 && currentTournament) {
      console.log('[DEBUG] No tournaments left, clearing current tournament');
      setCurrentTournament(null);
    } else {
      checkCurrentTournamentExists();
    }
  }, [tournaments, checkCurrentTournamentExists, currentTournament]);

  // Create a new tournament with memoized implementation
  const createTournament = useCallback((tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">): Tournament => {
    console.log('[DEBUG] Creating new tournament:', tournamentData.name);
    const { tournament, tournaments: updatedTournaments } = createNewTournament(tournamentData, tournamentsRef.current);
    
    setTournaments(updatedTournaments);
    setCurrentTournament(tournament);
    
    return tournament;
  }, []);

  // Delete a tournament
  const deleteTournament = useCallback((tournamentId: string) => {
    console.log('[DEBUG] Deleting tournament:', tournamentId);
    setTournaments(prevTournaments => {
      const { tournaments: updatedTournaments } = deleteT(
        tournamentId,
        prevTournaments,
        currentTournamentRef.current
      );
      return updatedTournaments;
    });
    
    // Use a separate effect for checking if currentTournament should be cleared
    checkCurrentTournamentExists();
  }, [checkCurrentTournamentExists]);

  // Update a tournament with safe state update pattern
  const updateTournament = useCallback((tournament: Tournament) => {
    console.log('[DEBUG] Updating tournament:', tournament.id);
    
    // Create a deep copy to prevent shared references
    const tournamentCopy = JSON.parse(JSON.stringify(tournament));
    
    setTournaments(prevTournaments => 
      prevTournaments.map(t => t.id === tournamentCopy.id ? tournamentCopy : t)
    );
    
    // Only update currentTournament if it's the same tournament being updated
    if (currentTournamentRef.current && currentTournamentRef.current.id === tournamentCopy.id) {
      setCurrentTournament(tournamentCopy);
    }
  }, []);

  // Add a team to the current tournament
  const addTeam = useCallback((team: Team) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Adding team to tournament:', team.name);
    const updatedTournament = addTeamToTournament(team, currentTournamentRef.current);
    
    updateTournament(updatedTournament);
  }, [updateTournament]);
  
  // Import multiple teams to the current tournament
  const importTeams = useCallback((teams: Team[]) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Importing teams to tournament. Count:', teams.length);
    const updatedTournament = importTeamsToTournament(teams, currentTournamentRef.current);
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Update a match in the current tournament
  const updateMatch = useCallback((match: Match) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Updating match:', match.id);
    const updatedMatches = currentTournamentRef.current.matches.map(m => 
      m.id === match.id ? { ...match } : m
    );
    
    updateTournament({
      ...currentTournamentRef.current,
      matches: updatedMatches,
      updatedAt: new Date()
    });
  }, [updateTournament]);

  // Update a court in the current tournament
  const updateCourt = useCallback((court: Court) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Updating court:', court.id);
    const updatedCourts = currentTournamentRef.current.courts.map(c => 
      c.id === court.id ? { ...court } : c
    );
    
    updateTournament({
      ...currentTournamentRef.current,
      courts: updatedCourts,
      updatedAt: new Date()
    });
  }, [updateTournament]);

  // Assign a court to a match
  const assignCourt = useCallback((matchId: string, courtId: string) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Assigning court to match. Match:', matchId, 'Court:', courtId);
    const match = findMatchById(currentTournamentRef.current, matchId);
    const court = currentTournamentRef.current.courts.find(c => c.id === courtId);
    
    if (!match || !court) return;
    
    const updatedTournament = assignCourtToMatch(currentTournamentRef.current, matchId, courtId);
    
    if (updatedTournament) {
      updateTournament(updatedTournament);
    }
  }, [updateTournament]);

  // Update match status with memoized implementation
  const updateMatchStatus = useCallback((matchId: string, status: MatchStatus) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Updating match status. Match:', matchId, 'Status:', status);
    const updatedTournament = updateMatchStatusInTournament(matchId, status, currentTournamentRef.current);
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Update match score with memoized implementation
  const updateMatchScore = useCallback((matchId: string, setIndex: number, team1Score: number, team2Score: number) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Updating match score. Match:', matchId, 'Set:', setIndex, 'Score:', team1Score, '-', team2Score);
    const updatedTournament = updateMatchScoreInTournament(matchId, setIndex, team1Score, team2Score, currentTournamentRef.current);
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Complete a match with memoized implementation
  const completeMatch = useCallback((matchId: string) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Completing match:', matchId);
    const updatedTournament = completeMatchInTournament(matchId, currentTournamentRef.current);
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Move a team to a different division with memoized implementation
  const moveTeamToDivision = useCallback((teamId: string, fromDivision: Division, toDivision: Division) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Moving team between divisions. Team:', teamId, 'From:', fromDivision, 'To:', toDivision);
    const updatedTournament = moveTeam(teamId, fromDivision, toDivision, currentTournamentRef.current);
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Load sample data
  const loadSampleData = useCallback((format?: TournamentFormat) => {
    console.log('[DEBUG] Loading sample data. Format:', format || 'default');
    const sampleData = format ? getSampleDataByFormat(format) : createSampleData();
    
    setTournaments(prevTournaments => {
      const filteredTournaments = prevTournaments.filter(t => t.id !== sampleData.id);
      return [...filteredTournaments, sampleData];
    });
    
    setCurrentTournament(sampleData);
  }, []);

  // Schedule a match with memoized implementation
  const scheduleMatch = useCallback((team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Scheduling match. Team1:', team1Id, 'Team2:', team2Id, 'Time:', scheduledTime);
    const updatedTournament = scheduleMatchInTournament(team1Id, team2Id, scheduledTime, currentTournamentRef.current, courtId, categoryId);
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Generate bracket (placeholder for now)
  const generateBracket = useCallback(() => {
    if (!currentTournamentRef.current) return;
    console.log('[DEBUG] Generating bracket');
    // Implementation would go here
  }, []);

  // Auto-assign courts with memoized implementation
  const autoAssignCourtsHandler = useCallback(async (): Promise<number> => {
    if (!currentTournamentRef.current) return 0;
    
    console.log('[DEBUG] Auto-assigning courts');
    const result = await autoAssignCourts(currentTournamentRef.current);
    
    updateTournament(result.tournament);
    return result.assignedCount;
  }, [updateTournament]);

  // Generate multi-stage tournament with memoized implementation
  const generateMultiStageTournament = useCallback(() => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Generating multi-stage tournament');
    const updatedTournament = generateMultiStage(currentTournamentRef.current);
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Advance to next stage with memoized implementation
  const advanceToNextStage = useCallback(() => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Advancing to next stage. Current stage:', currentTournamentRef.current.currentStage);
    let updatedTournament = currentTournamentRef.current;
    
    switch (currentTournamentRef.current.currentStage) {
      case "INITIAL_ROUND":
        updatedTournament = advanceToDivisionPlacement(currentTournamentRef.current);
        break;
      case "DIVISION_PLACEMENT":
        updatedTournament = advanceToPlayoffKnockout(currentTournamentRef.current);
        break;
      // Add more cases for other stages as needed
    }
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Assign seeding with memoized implementation
  const assignSeeding = useCallback((tournamentId: string) => {
    console.log('[DEBUG] Assigning seeding for tournament:', tournamentId);
    const tournament = tournamentsRef.current.find(t => t.id === tournamentId);
    if (!tournament) return;
    
    const updatedTournament = assignTournamentSeeding(tournamentId, tournamentsRef.current);
    if (updatedTournament) {
      updateTournament(updatedTournament);
    }
  }, [updateTournament]);

  // Add category to tournament with memoized implementation
  const addCategory = useCallback((category: Omit<TournamentCategory, "id">) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Adding category to tournament:', category.name);
    const newCategory = {
      ...category,
      id: crypto.randomUUID()
    };
    
    const updatedTournament = {
      ...currentTournamentRef.current,
      categories: [...currentTournamentRef.current.categories, newCategory],
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Remove category from tournament with memoized implementation
  const removeCategory = useCallback((categoryId: string) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Removing category from tournament. Category ID:', categoryId);
    const updatedTournament = {
      ...currentTournamentRef.current,
      categories: currentTournamentRef.current.categories.filter(c => c.id !== categoryId),
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Update category in tournament with memoized implementation
  const updateCategory = useCallback((category: TournamentCategory) => {
    if (!currentTournamentRef.current) return;
    
    console.log('[DEBUG] Updating category in tournament. Category ID:', category.id);
    const updatedTournament = {
      ...currentTournamentRef.current,
      categories: currentTournamentRef.current.categories.map(c => c.id === category.id ? category : c),
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Load category demo data with memoized implementation
  const loadCategoryDemoData = useCallback((tournamentId: string, categoryId: string, format: TournamentFormat) => {
    // Find the tournament
    const tournament = tournamentsRef.current.find(t => t.id === tournamentId);
    if (!tournament) {
      console.error('[ERROR] Tournament not found:', tournamentId);
      return;
    }
    
    console.log(`[DEBUG] Loading demo data for category ID ${categoryId} with format ${format} in tournament ${tournamentId}`);
    
    // Find the category in the tournament
    const category = tournament.categories.find(c => c.id === categoryId);
    if (!category) {
      console.error('[ERROR] Category not found:', categoryId);
      return;
    }
    
    // Get demo data specific to this category and format
    const { teams, matches } = getCategoryDemoData(format, category);
    
    if (teams.length === 0 || matches.length === 0) {
      console.warn(`No demo data generated for category ${category.name}`);
      return;
    }
    
    console.log(`Generated ${teams.length} teams and ${matches.length} matches for ${category.name}`);
    
    // Update tournament with new teams and matches for this category
    const updatedTournament = {
      ...tournament,
      teams: [...tournament.teams, ...teams],
      matches: [...tournament.matches, ...matches],
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  }, [updateTournament]);

  // Schedule matches with memoized implementation
  const scheduleMatches = useCallback(async (
    teamPairs: { team1: Team; team2: Team }[],
    options: SchedulingOptions
  ): Promise<SchedulingResult> => {
    if (!currentTournamentRef.current) {
      throw new Error("No active tournament");
    }
    
    console.log('[DEBUG] Scheduling matches with unified service', teamPairs.length, options);
    
    // Use our scheduling service to handle both scheduling and court assignment
    const result = await schedulingService.scheduleMatches(currentTournamentRef.current, teamPairs, options);
    
    // Update the tournament with the scheduled matches and assigned courts
    updateTournament(result.tournament);
    
    return result;
  }, [updateTournament]);

  // Memoize the context value to prevent unnecessary re-renders of consuming components
  const contextValue = React.useMemo(() => ({
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
    addCategory,
    removeCategory,
    updateCategory,
    loadCategoryDemoData,
    scheduleMatches
  }), [
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
    autoAssignCourtsHandler,
    generateMultiStageTournament,
    advanceToNextStage,
    assignSeeding,
    addCategory,
    removeCategory,
    updateCategory,
    loadCategoryDemoData,
    scheduleMatches
  ]);

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
};
