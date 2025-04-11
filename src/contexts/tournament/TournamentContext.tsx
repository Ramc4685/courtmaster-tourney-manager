import React, { createContext, useState, useEffect, PropsWithChildren } from 'react';
import { Tournament, Match, Court, Team, TournamentCategory, ScoringSettings } from "@/types/tournament";
import { TournamentFormat, TournamentStatus, TournamentStage, CategoryType, Division, CourtStatus, MatchStatus } from "@/types/tournament-enums";
import { generateId } from '@/utils/tournamentUtils';
import { tournamentService } from '@/services/tournament/TournamentService';
import { matchService } from '@/services/tournament/MatchService';
import { toast } from '@/components/ui/use-toast';
import { TournamentContextType, SchedulingOptions, SchedulingResult } from './types';
import { schedulingService } from '@/services/tournament/SchedulingService';
import { format as formatDate } from 'date-fns';

export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const loadedTournaments = await tournamentService.getTournaments();
      setTournaments(loadedTournaments);
    } catch (error) {
      console.error("Error loading tournaments:", error);
    }
  };

  const createTournament = async (data: {name: string, description?: string, format?: TournamentFormat, categories: TournamentCategory[], location?: string, registrationEnabled?: boolean, requirePlayerProfile?: boolean, startDate?: string | Date, endDate?: string | Date}): Promise<Tournament> => {
    const newTournament: Tournament = {
      id: generateId(),
      name: data.name,
      categories: data.categories,
      format: data.format || "SINGLE_ELIMINATION" as TournamentFormat,
      startDate: data.startDate ? (typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate) : new Date(),
      endDate: data.endDate ? (typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate) : new Date(),
      matches: [],
      teams: [],
      courts: [],
      status: 'DRAFT' as TournamentStatus,
      currentStage: "INITIAL_ROUND" as TournamentStage,
      createdAt: new Date(),
      updatedAt: new Date(),
      location: data.location || "Unspecified Location",
      registrationEnabled: data.registrationEnabled || true,
      requirePlayerProfile: data.requirePlayerProfile || false,
      scoringSettings: {
        maxPoints: 21,
        maxSets: 3,
        requireTwoPointLead: true,
        maxTwoPointLeadScore: 30
      } as ScoringSettings
    };

    try {
      const createdTournament = await tournamentService.createTournament(newTournament);
      setTournaments(prevTournaments => [...prevTournaments, createdTournament]);
      setCurrentTournament(createdTournament);
      return createdTournament;
    } catch (error) {
      console.error("Error creating tournament:", error);
      throw error;
    }
  };

  const updateTournament = async (tournament: Tournament) => {
    try {
      await tournamentService.updateTournament(tournament);
      setTournaments(prevTournaments =>
        prevTournaments.map(t => (t.id === tournament.id ? tournament : t))
      );
      if (currentTournament?.id === tournament.id) {
        setCurrentTournament(tournament);
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      await tournamentService.deleteTournament(tournamentId);
      setTournaments(prevTournaments =>
        prevTournaments.filter(t => t.id !== tournamentId)
      );
      if (currentTournament?.id === tournamentId) {
        setCurrentTournament(null);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
    }
  };

  const setCurrentTournamentContext = async (tournament: Tournament) => {
    try {
      setCurrentTournament(tournament);
      await tournamentService.saveCurrentTournament(tournament);
    } catch (error) {
      console.error("Error setting current tournament:", error);
    }
  };

  const startMatch = async (matchId: string) => {
    if (!currentTournament) return;

    try {
      // Update local state first
      const updatedMatches = currentTournament.matches.map(match => 
        match.id === matchId ? { ...match, status: "IN_PROGRESS" as MatchStatus } : match
      );
      
      const updatedTournament = { ...currentTournament, matches: updatedMatches };
      await updateTournament(updatedTournament);
      
      // Then update the backend
      await matchService.updateMatchStatus(currentTournament.id, matchId, "IN_PROGRESS");
    } catch (error) {
      console.error("Error starting match:", error);
    }
  };

  const updateMatchStatus = async (matchId: string, status: string) => {
    if (!currentTournament) return;

    try {
      // Update local state first
      const updatedMatches = currentTournament.matches.map(match => 
        match.id === matchId ? { ...match, status: status as MatchStatus } : match
      );
      
      const updatedTournament = { ...currentTournament, matches: updatedMatches };
      await updateTournament(updatedTournament);
      
      // Then update the backend
      await matchService.updateMatchStatus(currentTournament.id, matchId, status as MatchStatus);
    } catch (error) {
      console.error("Error updating match status:", error);
    }
  };

  const updateMatchScore = async (matchId: string, setIndex: number, team1Score: number, team2Score: number) => {
    if (!currentTournament) return;

    try {
      const match = currentTournament.matches.find(m => m.id === matchId);
      if (!match) return;
      
      const scores = [...(match.scores || [])];
      while (scores.length <= setIndex) {
        scores.push({ team1Score: 0, team2Score: 0 });
      }
      
      scores[setIndex] = { team1Score, team2Score };
      
      // Update local state
      const updatedMatches = currentTournament.matches.map(m => 
        m.id === matchId ? { ...m, scores } : m
      );
      
      const updatedTournament = { ...currentTournament, matches: updatedMatches };
      await updateTournament(updatedTournament);
      
      // Update backend
      await matchService.updateMatchScore(currentTournament.id, matchId, setIndex, team1Score, team2Score);
    } catch (error) {
      console.error("Error updating match score:", error);
    }
  };

  const completeMatch = async (matchId: string) => {
    if (!currentTournament) return;

    try {
      // Update local state
      const updatedMatches = currentTournament.matches.map(match => 
        match.id === matchId ? { ...match, status: "COMPLETED" as MatchStatus } : match
      );
      
      const updatedTournament = { ...currentTournament, matches: updatedMatches };
      await updateTournament(updatedTournament);
      
      // Update backend
      await matchService.completeMatch(currentTournament.id, matchId);
    } catch (error) {
      console.error("Error completing match:", error);
    }
  };

  const assignCourt = async (matchId: string, courtId: string) => {
    if (!currentTournament) return;

    try {
      const match = currentTournament.matches.find(m => m.id === matchId);
      const court = currentTournament.courts.find(c => c.id === courtId);
      
      if (!match || !court) return;
      
      // Update match with court
      const updatedMatch = { ...match, courtNumber: court.number };
      
      // Update court status
      const updatedCourt = { ...court, status: "IN_USE" as CourtStatus, currentMatch: updatedMatch };
      
      // Update arrays
      const updatedMatches = currentTournament.matches.map(m => 
        m.id === matchId ? updatedMatch : m
      );
      
      const updatedCourts = currentTournament.courts.map(c => 
        c.id === courtId ? updatedCourt : c
      );
      
      // Update tournament
      const updatedTournament = { 
        ...currentTournament, 
        matches: updatedMatches,
        courts: updatedCourts
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error assigning court:", error);
    }
  };

  const freeCourt = async (courtNumber: number) => {
    if (!currentTournament) return;

    try {
      // Optimize the logic
      const court = currentTournament.courts.find(c => c.number === courtNumber);
      if (!court) return;
      
      // Update court status
      const updatedCourt = { ...court, status: "AVAILABLE" as CourtStatus, currentMatch: undefined };
      
      // Update courts array
      const updatedCourts = currentTournament.courts.map(c => 
        c.number === courtNumber ? updatedCourt : c
      );
      
      // Find any matches using this court and remove the court reference
      const updatedMatches = currentTournament.matches.map(match => 
        match.courtNumber === courtNumber ? { ...match, courtNumber: undefined } : match
      );
      
      // Update tournament
      const updatedTournament = { 
        ...currentTournament, 
        courts: updatedCourts,
        matches: updatedMatches
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error freeing court:", error);
    }
  };

  const autoAssignCourts = async (): Promise<number> => {
    if (!currentTournament) return 0;

    try {
      const result = await schedulingService.assignCourtsToScheduledMatches(currentTournament);
      if (result.tournament) {
        await updateTournament(result.tournament);
        return result.assignedCourts;
      }
      return 0;
    } catch (error) {
      console.error("Error auto-assigning courts:", error);
      return 0;
    }
  };

  // Function to start multiple matches that have courts assigned
  const startMatchesWithCourts = async (): Promise<number> => {
    if (!currentTournament) return 0;
    
    try {
      const matchesToStart = currentTournament.matches.filter(
        match => match.status === "SCHEDULED" && match.courtNumber && match.team1 && match.team2
      );
      
      let startedCount = 0;
      
      // Create a copy of the tournament to make multiple updates
      let updatedTournament = { ...currentTournament };
      
      for (const match of matchesToStart) {
        // Update match status in our copy
        updatedTournament = {
          ...updatedTournament,
          matches: updatedTournament.matches.map(m => 
            m.id === match.id ? { ...m, status: "IN_PROGRESS" as MatchStatus } : m
          )
        };
        
        // Update backend in parallel
        await matchService.updateMatchStatus(currentTournament.id, match.id, "IN_PROGRESS");
        startedCount++;
      }
      
      if (startedCount > 0) {
        // Update local state once with all changes
        await updateTournament(updatedTournament);
      }
      
      return startedCount;
    } catch (error) {
      console.error("Error starting matches with courts:", error);
      return 0;
    }
  };

  // Initialize scoring for a specific match
  const initializeScoring = async (matchId: string): Promise<Match | null> => {
    if (!currentTournament) return null;
    
    try {
      const match = currentTournament.matches.find(m => m.id === matchId);
      
      if (!match) {
        console.error(`Match with ID ${matchId} not found`);
        return null;
      }
      
      // If match is not started yet, start it
      if (match.status === "SCHEDULED") {
        await updateMatchStatus(matchId, "IN_PROGRESS");
        
        // Get the updated match from state
        const updatedMatch = currentTournament.matches.find(m => m.id === matchId);
        return updatedMatch || null;
      }
      
      // Return the match for navigation
      return match;
    } catch (error) {
      console.error(`Error initializing scoring for match ${matchId}:`, error);
      return null;
    }
  };

  const addTeam = async (team: Team) => {
    if (!currentTournament) return;

    try {
      // Add to local state
      const updatedTeams = [...currentTournament.teams, team];
      const updatedTournament = { ...currentTournament, teams: updatedTeams };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error adding team:", error);
    }
  };

  const updateTeam = async (team: Team) => {
    if (!currentTournament) return;

    try {
      // Update in local state
      const updatedTeams = currentTournament.teams.map(t => 
        t.id === team.id ? team : t
      );
      
      const updatedTournament = { ...currentTournament, teams: updatedTeams };
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!currentTournament) return;

    try {
      // Remove from local state
      const updatedTeams = currentTournament.teams.filter(t => t.id !== teamId);
      const updatedTournament = { ...currentTournament, teams: updatedTeams };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  // Import multiple teams at once
  const importTeams = async (teams: Team[]) => {
    if (!currentTournament) return;
    
    try {
      // Add to local state
      const updatedTeams = [...currentTournament.teams, ...teams];
      const updatedTournament = { ...currentTournament, teams: updatedTeams };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error importing teams:", error);
    }
  };

  const addCategory = async (category: TournamentCategory) => {
    if (!currentTournament) return;

    try {
      // Add to local state
      const updatedCategories = [...currentTournament.categories, category];
      const updatedTournament = { ...currentTournament, categories: updatedCategories };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const updateCategory = async (category: TournamentCategory) => {
    if (!currentTournament) return;

    try {
      // Update in local state
      const updatedCategories = currentTournament.categories.map(c => 
        c.id === category.id ? category : c
      );
      
      const updatedTournament = { ...currentTournament, categories: updatedCategories };
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!currentTournament) return;

    try {
      // Remove from local state
      const updatedCategories = currentTournament.categories.filter(c => c.id !== categoryId);
      const updatedTournament = { ...currentTournament, categories: updatedCategories };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  // Alias for deleteCategory for compatibility
  const removeCategory = async (categoryId: string) => {
    await deleteCategory(categoryId);
  };

  const generateBrackets = async (): Promise<number> => {
    if (!currentTournament) return 0;

    try {
      const { tournament, matchesCreated } = await schedulingService.generateBrackets(currentTournament);

      if (tournament) {
        await updateTournament(tournament);
        return matchesCreated;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error generating brackets:", error);
      return 0;
    }
  };

  // Schedule a single match
  const scheduleMatch = async (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => {
    if (!currentTournament) return;
    
    try {
      const result = await schedulingService.scheduleMatch(
        currentTournament, 
        team1Id, 
        team2Id, 
        scheduledTime,
        courtId,
        categoryId
      );
      
      if (result.tournament) {
        await updateTournament(result.tournament);
      }
    } catch (error) {
      console.error("Error scheduling match:", error);
    }
  };

  // Update the scheduleMatches function to use the correct types
  const scheduleMatches = async (teamPairs: { team1: Team; team2: Team }[], options: SchedulingOptions): Promise<SchedulingResult> => {
    if (!currentTournament) {
      throw new Error("No tournament selected");
    }
    
    try {
      const result = await schedulingService.scheduleMatches(currentTournament, teamPairs, options);
      
      if (result.tournament) {
        await updateTournament(result.tournament);
      }
      
      return {
        tournament: result.tournament,
        matchesScheduled: result.matchesScheduled,
        courtsAssigned: result.courtsAssigned,
        matchesStarted: result.matchesStarted,
        errors: result.errors
      };
    } catch (error) {
      console.error("Error scheduling matches:", error);
      throw error;
    }
  };

  // Generic update match function
  const updateMatch = async (match: Match) => {
    if (!currentTournament) return;
    
    try {
      const updatedMatches = currentTournament.matches.map(m => 
        m.id === match.id ? match : m
      );
      
      const updatedTournament = { ...currentTournament, matches: updatedMatches };
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error updating match:", error);
    }
  };

  // Generate a multi-stage tournament
  const generateMultiStageTournament = async () => {
    if (!currentTournament) return;
    
    try {
      const { tournament } = await schedulingService.generateMultiStageTournament(currentTournament);
      
      if (tournament) {
        await updateTournament(tournament);
      }
    } catch (error) {
      console.error("Error generating multi-stage tournament:", error);
    }
  };

  // Advance tournament to next stage
  const advanceToNextStage = async () => {
    if (!currentTournament) return;
    
    try {
      const { tournament } = await schedulingService.advanceToNextStage(currentTournament);
      
      if (tournament) {
        await updateTournament(tournament);
      }
    } catch (error) {
      console.error("Error advancing tournament to next stage:", error);
    }
  };

  // Load sample data
  const loadSampleData = async (format?: TournamentFormat): Promise<void> => {
    if (!format) return;

    const category: TournamentCategory = {
      id: generateId(),
      name: "Men's Singles",
      type: CategoryType.MENS_SINGLES,
      division: Division.MENS,
      format: format,
    };

    const sampleTournament = {
      name: `Sample ${format.replace(/_/g, ' ')} Tournament`,
      description: `A sample tournament using the ${format.replace(/_/g, ' ')} format`,
      format: format,
      location: "Sample Location",
      startDate: formatDate(new Date(), "yyyy-MM-dd"),
      endDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      status: TournamentStatus.DRAFT,
      currentStage: TournamentStage.INITIAL_ROUND,
      registrationEnabled: true,
      requirePlayerProfile: false,
      teams: [],
      matches: [],
      courts: [],
      categories: [category],
      scoringSettings: {
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30,
        maxSets: 3,
        requireTwoPointLead: true,
        maxTwoPointLeadScore: 30
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const createdTournament = await createTournament(sampleTournament);
      if (!createdTournament) {
        throw new Error("Failed to create tournament - no tournament returned");
      }
      await setCurrentTournamentContext(createdTournament);
      toast({
        title: "Sample Tournament Created",
        description: `Created a new ${format.replace(/_/g, ' ')} tournament template.`
      });
    } catch (error) {
      console.error("Error creating sample tournament:", error);
      toast({
        title: "Error Creating Sample Tournament",
        description: "Failed to create sample tournament. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Load category demo data
  const loadCategoryDemoData = async (tournamentId: string, categoryId: string, format: TournamentFormat) => {
    if (!currentTournament || currentTournament.id !== tournamentId) return;
    
    try {
      const { tournament } = await schedulingService.loadCategoryDemoData(
        currentTournament, 
        categoryId, 
        format
      );
      
      if (tournament) {
        await updateTournament(tournament);
      }
    } catch (error) {
      console.error("Error loading category demo data:", error);
    }
  };

  const tournamentContextValue: TournamentContextType = {
    tournaments,
    currentTournament,
    setCurrentTournament: setCurrentTournamentContext,
    createTournament,
    updateTournament,
    deleteTournament,
    loadTournaments,
    startMatch,
    updateMatchStatus,
    updateMatchScore,
    completeMatch,
    assignCourt,
    freeCourt,
    autoAssignCourts,
    startMatchesWithCourts,
    initializeScoring,
    addTeam,
    updateTeam,
    deleteTeam,
    importTeams,
    addCategory,
    updateCategory,
    deleteCategory,
    removeCategory,
    generateBrackets,
    scheduleMatch,
    scheduleMatches,
    updateMatch,
    generateMultiStageTournament,
    advanceToNextStage,
    loadSampleData,
    loadCategoryDemoData
  };

  return (
    <TournamentContext.Provider value={tournamentContextValue}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = React.useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
