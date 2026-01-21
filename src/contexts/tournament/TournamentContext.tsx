import React, { createContext, useState, useEffect, PropsWithChildren, useCallback } from 'react'; // Import useCallback
import { Tournament, Match, Court, Team, TournamentCategory } from "@/types/tournament";
import { 
  TournamentFormat, 
  TournamentStatus, 
  TournamentStageEnum,
  CategoryType, 
  Division, 
  CourtStatus, 
  MatchStatus,
  TournamentFormatConfig
} from "@/types/tournament-enums";
import { generateId } from '@/utils/tournamentUtils';
import { tournamentService } from '@/services/tournament/TournamentService';
import { matchService } from '@/services/tournament/MatchService';
import { toast } from '@/components/ui/use-toast';
import { TournamentContextType, SchedulingOptions, SchedulingResult } from './types';
import { schedulingService } from '@/services/tournament/SchedulingService';
import { format as formatDate } from 'date-fns';
import { updateBracketProgression, determineMatchWinnerAndLoser, getDefaultScoringSettings } from '@/utils/matchUtils';

export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournamentState] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wrap loadTournaments in useCallback to stabilize its reference
  const loadTournaments = useCallback(async () => {
    console.log("[TournamentContext] Attempting to load tournaments..."); // Add log
    try {
      setIsLoading(true);
      setError(null);
      const loadedTournaments = await tournamentService.getTournaments();
      console.log("[TournamentContext] Tournaments loaded successfully:", loadedTournaments.length); // Add log
      setTournaments(loadedTournaments);
    } catch (error) {
      console.error("[TournamentContext] Error loading tournaments:", error); // Enhance log
      // Check if the error is the expected RLS error, provide a clearer message
      if (error instanceof Error && error.message.includes('403')) { 
        setError("Permission denied: Could not load tournaments due to security policy.");
      } else {
        setError("Failed to load tournaments. Please check console for details.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array ensures the function reference is stable

  const createTournament = async (data: {name: string, description?: string, format?: TournamentFormat, categories: TournamentCategory[], location?: string, registrationEnabled?: boolean, requirePlayerProfile?: boolean, startDate?: string | Date, endDate?: string | Date}): Promise<Tournament> => {
    const formatConfig: TournamentFormatConfig = {
      type: data.format || TournamentFormat.SINGLE_ELIMINATION,
      stages: [
        TournamentStageEnum.REGISTRATION,
        TournamentStageEnum.SEEDING,
        TournamentStageEnum.ELIMINATION_ROUND,
        TournamentStageEnum.FINALS
      ],
      scoring: {
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30,
        maxSets: 3,
        requireTwoPointLead: true,
        maxTwoPointLeadScore: 30,
        setsToWin: 2,
        matchFormat: 'STANDARD',
        finalSetTiebreak: true,
        tiebreakPoints: 30
      },
      divisions: [],
      thirdPlaceMatch: false,
      seedingEnabled: true
    };

    const newTournament: Tournament = {
      id: generateId(),
      name: data.name,
      categories: data.categories,
      format: data.format || TournamentFormat.SINGLE_ELIMINATION,
      formatConfig,
      startDate: data.startDate ? 
        (typeof data.startDate === 'string' ? data.startDate : data.startDate.toISOString()) 
        : new Date().toISOString(),
      endDate: data.endDate ? 
        (typeof data.endDate === 'string' ? data.endDate : data.endDate.toISOString()) 
        : new Date().toISOString(),
      matches: [],
      teams: [],
      courts: [],
      status: TournamentStatus.DRAFT,
      currentStage: TournamentStageEnum.INITIAL_ROUND,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: data.location || "Unspecified Location",
      registrationEnabled: data.registrationEnabled ?? true,
      requirePlayerProfile: data.requirePlayerProfile ?? false,
      maxTeams: 32,
      scoring: {
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30,
        maxSets: 3,
        requireTwoPointLead: true,
        maxTwoPointLeadScore: 30
      },
      divisions: [],
      stages: []
    };

    try {
      const createdTournament = await tournamentService.createTournament(newTournament);
      setTournaments(prevTournaments => [...prevTournaments, createdTournament]);
      setCurrentTournamentState(createdTournament);
      return createdTournament;
    } catch (error) {
      console.error("Error creating tournament:", error);
      throw error;
    }
  };

  const updateTournament = useCallback(async (tournament: Tournament) => {
    try {
      await tournamentService.updateTournament(tournament);
      setTournaments(prevTournaments =>
        prevTournaments.map(t => (t.id === tournament.id ? tournament : t))
      );
      if (currentTournament?.id === tournament.id) {
        setCurrentTournamentState(tournament);
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
    }
  }, [currentTournament?.id]);

  const deleteTournament = useCallback(async (tournamentId: string) => {
    try {
      await tournamentService.deleteTournament(tournamentId);
      setTournaments(prevTournaments =>
        prevTournaments.filter(t => t.id !== tournamentId)
      );
      if (currentTournament?.id === tournamentId) {
        setCurrentTournamentState(null);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
      throw error; // Re-throw error so component can handle it
    }
  }, [currentTournament?.id]);

  const setCurrentTournament = useCallback(async (tournament: Tournament) => {
    try {
      setCurrentTournamentState(tournament);
      await tournamentService.saveCurrentTournament(tournament);
    } catch (error) {
      console.error("Error setting current tournament:", error);
    }
  }, []);

  const startMatch = async (matchId: string) => {
    if (!currentTournament) return;

    try {
      const updatedMatches = currentTournament.matches.map(match => 
        match.id === matchId ? { ...match, status: MatchStatus.IN_PROGRESS } : match
      );
      
      const updatedTournament = { ...currentTournament, matches: updatedMatches };
      await updateTournament(updatedTournament);
      
      await matchService.updateMatchStatus(currentTournament.id, matchId, MatchStatus.IN_PROGRESS);
    } catch (error) {
      console.error("Error starting match:", error);
    }
  };

  const updateMatchStatus = async (matchId: string, status: MatchStatus): Promise<void> => {
    if (!currentTournament) return;

    try {
      // Update local state first
      const updatedMatches = currentTournament.matches.map(match => 
        match.id === matchId ? { ...match, status } : match
      );
      
      const updatedTournament = { ...currentTournament, matches: updatedMatches };
      await updateTournament(updatedTournament);
      
      // Then update the backend
      await matchService.updateMatchStatus(currentTournament.id, matchId, status);
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
      // Find the match
      const match = currentTournament.matches.find(m => m.id === matchId);
      if (!match) {
        console.error(`Match with ID ${matchId} not found`);
        return;
      }

      // Get scoring settings
      const scoringSettings = currentTournament.scoring || getDefaultScoringSettings();

      // Determine winner and loser
      const { winner, loser } = determineMatchWinnerAndLoser(match, { setsToWin: scoringSettings.setsToWin || 2 });

      // Create updated match with winner and status
      const completedMatch: Match = {
        ...match,
        status: MatchStatus.COMPLETED,
        winner: winner || undefined,
        loser: loser || undefined
      };

      // Update local matches
      let updatedMatches = currentTournament.matches.map(m =>
        m.id === matchId ? completedMatch : m
      );

      // Create intermediate tournament for bracket progression
      let updatedTournament = { ...currentTournament, matches: updatedMatches };

      // Update bracket progression if there's a winner
      if (winner) {
        console.log(`[completeMatch] Winner determined: ${winner.name || winner.id}`);
        updatedTournament = updateBracketProgression(updatedTournament, completedMatch);
      }

      // Check if tournament is complete
      const allMatchesComplete = updatedTournament.matches.every(
        m => m.status === MatchStatus.COMPLETED || m.status === MatchStatus.CANCELLED
      );

      if (allMatchesComplete && updatedTournament.matches.length > 0) {
        updatedTournament = {
          ...updatedTournament,
          status: TournamentStatus.COMPLETED,
          updatedAt: new Date()
        };
        console.log("[completeMatch] All matches complete - tournament finished!");
        toast({
          title: "Tournament Complete!",
          description: "All matches have been completed."
        });
      }

      // Persist to state and backend
      await updateTournament(updatedTournament);

      // Update backend match
      await matchService.completeMatch(currentTournament.id, matchId);

    } catch (error) {
      console.error("Error completing match:", error);
      toast({
        title: "Error",
        description: "Failed to complete match",
        variant: "destructive"
      });
    }
  };

  const assignCourt = async (matchId: string, courtId: string) => {
    if (!currentTournament) return;

    try {
      const match = currentTournament.matches.find(m => m.id === matchId);
      const court = currentTournament.courts.find(c => c.id === courtId);
      
      if (!match || !court) return;
      
      // Update match with court (use both courtId and courtNumber for compatibility)
      const updatedMatch = {
        ...match,
        courtId: courtId,
        courtNumber: court.number
      };
      
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

  const addCourt = async (name?: string, description?: string) => {
    if (!currentTournament) return;

    try {
      const nextNumber = currentTournament.courts.length > 0
        ? Math.max(...currentTournament.courts.map(court => court.number)) + 1
        : 1;
      const now = new Date();
      const newCourt: Court = {
        id: generateId(),
        name: name || `Court ${nextNumber}`,
        number: nextNumber,
        status: CourtStatus.AVAILABLE,
        description,
        createdAt: now,
        updatedAt: now
      };
      const updatedTournament = {
        ...currentTournament,
        courts: [...currentTournament.courts, newCourt]
      };
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error adding court:", error);
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
        match => match.status === MatchStatus.SCHEDULED && match.courtNumber && match.team1 && match.team2
      );
      
      let startedCount = 0;
      let updatedTournament = { ...currentTournament };
      
      for (const match of matchesToStart) {
        updatedTournament = {
          ...updatedTournament,
          matches: updatedTournament.matches.map(m => 
            m.id === match.id ? { ...m, status: MatchStatus.IN_PROGRESS } : m
          )
        };
        
        await matchService.updateMatchStatus(currentTournament.id, match.id, MatchStatus.IN_PROGRESS);
        startedCount++;
      }
      
      if (startedCount > 0) {
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
        await updateMatchStatus(matchId, MatchStatus.IN_PROGRESS);
        
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

  const scheduleMatches = async (options: SchedulingOptions): Promise<SchedulingResult> => {
    if (!currentTournament) {
      return { success: false, message: "No tournament selected" };
    }

    try {
      const result = await schedulingService.scheduleMatches(currentTournament, options);
      if (result.success && result.tournament) {
        await updateTournament(result.tournament);
      }
      return result;
    } catch (error) {
      console.error("Error scheduling matches:", error);
      return { success: false, message: "An unexpected error occurred during scheduling" };
    }
  };

  // Generate brackets for the tournament
  const generateBrackets = async (): Promise<number> => {
    if (!currentTournament) {
      toast({
        title: "Error",
        description: "No tournament selected",
        variant: "destructive"
      });
      return 0;
    }

    try {
      const result = await schedulingService.generateBrackets(currentTournament);
      if (result.matchesCreated > 0) {
        await updateTournament(result.tournament);
        toast({
          title: "Brackets Generated",
          description: `Created ${result.matchesCreated} matches`
        });
      } else {
        toast({
          title: "No Matches Created",
          description: "Ensure teams are assigned to categories (need at least 2 teams per category)",
          variant: "destructive"
        });
      }
      return result.matchesCreated;
    } catch (error) {
      console.error("Error generating brackets:", error);
      toast({
        title: "Error",
        description: "Failed to generate brackets",
        variant: "destructive"
      });
      return 0;
    }
  };

  // Generate multi-stage tournament (wrapper for generateBrackets with validation)
  const generateMultiStageTournament = async (): Promise<void> => {
    if (!currentTournament) {
      toast({
        title: "Error",
        description: "No tournament selected",
        variant: "destructive"
      });
      return;
    }

    // Validate tournament has teams
    if (!currentTournament.teams || currentTournament.teams.length < 2) {
      toast({
        title: "Cannot Generate Tournament",
        description: "Add at least 2 teams before generating brackets",
        variant: "destructive"
      });
      return;
    }

    // Check if matches already exist
    if (currentTournament.matches && currentTournament.matches.length > 0) {
      toast({
        title: "Brackets Already Exist",
        description: "This tournament already has matches. Delete existing matches first if you want to regenerate.",
        variant: "destructive"
      });
      return;
    }

    await generateBrackets();
  };

  // Advance tournament to next stage
  const advanceToNextStage = async (): Promise<void> => {
    if (!currentTournament) {
      toast({
        title: "Error",
        description: "No tournament selected",
        variant: "destructive"
      });
      return;
    }

    // Check if current stage is complete
    const incompleteMatches = (currentTournament.matches || []).filter(
      m => m.status !== MatchStatus.COMPLETED && m.status !== MatchStatus.CANCELLED
    );

    if (incompleteMatches.length > 0) {
      toast({
        title: "Cannot Advance",
        description: `${incompleteMatches.length} matches still in progress. Complete all matches first.`,
        variant: "destructive"
      });
      return;
    }

    // Determine next stage
    const currentStage = currentTournament.currentStage;
    let nextStage = currentStage;

    switch (currentStage) {
      case TournamentStageEnum.REGISTRATION:
        nextStage = TournamentStageEnum.SEEDING;
        break;
      case TournamentStageEnum.SEEDING:
        nextStage = TournamentStageEnum.INITIAL_ROUND;
        break;
      case TournamentStageEnum.INITIAL_ROUND:
        nextStage = TournamentStageEnum.ELIMINATION_ROUND;
        break;
      case TournamentStageEnum.ELIMINATION_ROUND:
        nextStage = TournamentStageEnum.FINALS;
        break;
      case TournamentStageEnum.FINALS:
        // Tournament is complete
        const completedTournament = {
          ...currentTournament,
          status: TournamentStatus.COMPLETED,
          updatedAt: new Date()
        };
        await updateTournament(completedTournament);
        toast({
          title: "Tournament Complete!",
          description: "All stages have been completed."
        });
        return;
    }

    // Update tournament stage
    const updatedTournament = {
      ...currentTournament,
      currentStage: nextStage,
      updatedAt: new Date()
    };

    await updateTournament(updatedTournament);
    toast({
      title: "Stage Advanced",
      description: `Tournament advanced to ${nextStage}`
    });
  };

  // Update a single match
  const updateMatch = async (match: Match): Promise<void> => {
    if (!currentTournament) return;

    try {
      // Update in local state
      const updatedMatches = currentTournament.matches.map(m =>
        m.id === match.id ? match : m
      );

      const updatedTournament = { ...currentTournament, matches: updatedMatches };
      await updateTournament(updatedTournament);

      // Also update in backend if match service supports it
      if (match.id) {
        await matchService.updateMatch(match.id, match, {});
      }
    } catch (error) {
      console.error("Error updating match:", error);
    }
  };

  // Check and update tournament status based on match states
  const checkAndUpdateTournamentStatus = async (): Promise<void> => {
    if (!currentTournament) return;

    const matches = currentTournament.matches || [];
    if (matches.length === 0) return;

    const completedMatches = matches.filter(m => m.status === MatchStatus.COMPLETED);
    const inProgressMatches = matches.filter(m => m.status === MatchStatus.IN_PROGRESS);

    // If all matches are completed, mark tournament as complete
    if (completedMatches.length === matches.length) {
      if (currentTournament.status !== TournamentStatus.COMPLETED) {
        const completedTournament = {
          ...currentTournament,
          status: TournamentStatus.COMPLETED,
          updatedAt: new Date()
        };
        await updateTournament(completedTournament);
        toast({
          title: "Tournament Complete!",
          description: "All matches have been completed."
        });
      }
    }
    // If any match has started and tournament is still DRAFT, move to IN_PROGRESS
    else if (inProgressMatches.length > 0 || completedMatches.length > 0) {
      if (currentTournament.status === TournamentStatus.DRAFT) {
        const updatedTournament = {
          ...currentTournament,
          status: TournamentStatus.IN_PROGRESS,
          updatedAt: new Date()
        };
        await updateTournament(updatedTournament);
      }
    }
  };

  // Load initial data on mount - TEMPORARILY DISABLED to fix blank screen
  // useEffect(() => {
  //   loadTournaments();
  // }, [loadTournaments]); // Dependency array now correctly includes the stable loadTournaments

  return (
    <TournamentContext.Provider value={{
      tournaments,
      currentTournament,
      isLoading,
      error,
      loadTournaments,
      createTournament,
      updateTournament,
      deleteTournament,
      setCurrentTournament,
      startMatch,
      updateMatchStatus,
      updateMatchScore,
      completeMatch,
      addCourt,
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
      scheduleMatches,
      generateBrackets,
      generateMultiStageTournament,
      advanceToNextStage,
      updateMatch
    }}>
      {children}
    </TournamentContext.Provider>
  );
};



// Custom hook to use the Tournament context
export const useTournament = () => {
  const context = React.useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};
