import React, { createContext, useState, ReactNode, useEffect } from "react";
import { Tournament, Match, Court, Team, MatchStatus, Division, TournamentFormat, TournamentCategory } from "@/types/tournament";
import { TournamentContextType } from "./types";
import { tournamentService } from "@/services/tournament/TournamentService";
import { matchService } from "@/services/tournament/MatchService";
import { courtService } from "@/services/tournament/CourtService";
import { createSampleData, getSampleDataByFormat } from "@/utils/tournamentSampleData";
import { assignPlayerSeeding } from "@/utils/tournamentProgressionUtils";

export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const loadedTournaments = await tournamentService.getTournaments();
        const loadedCurrentTournament = await tournamentService.getCurrentTournament();
        
        setTournaments(loadedTournaments);
        setCurrentTournament(loadedCurrentTournament);
      } catch (error) {
        console.error("Error loading initial tournament data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Create a new tournament - updated to return Tournament directly instead of Promise<Tournament>
  const createTournament = (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">): Tournament => {
    try {
      // Since we need to return a Tournament directly (not a Promise), we'll create it synchronously
      // This matches the type definition in TournamentContextType
      const newTournament = tournamentService.createTournamentSync(tournamentData);
      
      // Update state asynchronously (this doesn't affect our return value)
      setTournaments(prev => [...prev, newTournament]);
      setCurrentTournament(newTournament);
      
      // Asynchronously save to service (not affecting our return)
      tournamentService.saveTournaments([...tournaments, newTournament])
        .catch(error => console.error("Error saving tournaments:", error));
      
      tournamentService.saveCurrentTournament(newTournament)
        .catch(error => console.error("Error saving current tournament:", error));
      
      return newTournament;
    } catch (error) {
      console.error("Error creating tournament:", error);
      throw error;
    }
  };

  // Delete tournament
  const deleteTournament = async (tournamentId: string) => {
    try {
      await tournamentService.deleteTournament(tournamentId);
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      if (currentTournament?.id === tournamentId) {
        setCurrentTournament(null);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
    }
  };

  // Update tournament
  const updateTournament = async (tournament: Tournament) => {
    try {
      const updatedTournament = await tournamentService.updateTournament(tournament);
      setTournaments(prev => prev.map(t => t.id === tournament.id ? updatedTournament : t));
      if (currentTournament?.id === tournament.id) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
    }
  };

  // Add team to current tournament
  const addTeam = async (team: Team) => {
    if (!currentTournament) return;
    
    try {
      const updatedTournament = {
        ...currentTournament,
        teams: [...currentTournament.teams, team],
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error adding team:", error);
    }
  };

  // Import multiple teams at once
  const importTeams = async (teams: Team[]) => {
    if (!currentTournament) return;
    
    try {
      const updatedTournament = {
        ...currentTournament,
        teams: [...currentTournament.teams, ...teams],
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error importing teams:", error);
    }
  };

  // Update match
  const updateMatch = async (match: Match) => {
    if (!currentTournament) return;
    
    try {
      const updatedMatches = currentTournament.matches.map(m => m.id === match.id ? match : m);
      const updatedTournament = {
        ...currentTournament,
        matches: updatedMatches,
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error updating match:", error);
    }
  };

  // Update court
  const updateCourt = async (court: Court) => {
    if (!currentTournament) return;
    
    try {
      const updatedCourts = currentTournament.courts.map(c => c.id === court.id ? court : c);
      const updatedTournament = {
        ...currentTournament,
        courts: updatedCourts,
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error updating court:", error);
    }
  };

  // Assign court to match
  const assignCourt = async (matchId: string, courtId: string) => {
    if (!currentTournament) return;
    
    try {
      const updatedTournament = await courtService.assignCourt(currentTournament.id, matchId, courtId);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
        setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
      }
    } catch (error) {
      console.error("Error assigning court:", error);
    }
  };

  // Auto-assign available courts to scheduled matches
  const autoAssignCourtsHandler = async (): Promise<number> => {
    if (!currentTournament) return 0;
    
    try {
      const { assignedCount, tournament } = await courtService.autoAssignCourts(currentTournament.id);
      if (tournament) {
        setCurrentTournament(tournament);
        setTournaments(prev => prev.map(t => t.id === tournament.id ? tournament : t));
      }
      return assignedCount;
    } catch (error) {
      console.error("Error auto-assigning courts:", error);
      return 0;
    }
  };

  // Update match status
  const updateMatchStatus = async (matchId: string, status: MatchStatus) => {
    if (!currentTournament) return;
    
    try {
      const updatedTournament = await matchService.updateMatchStatus(currentTournament.id, matchId, status);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
        setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
      }
    } catch (error) {
      console.error("Error updating match status:", error);
    }
  };

  // Update match score
  const updateMatchScore = async (matchId: string, setIndex: number, team1Score: number, team2Score: number) => {
    if (!currentTournament) return;
    
    try {
      const updatedTournament = await matchService.updateMatchScore(
        currentTournament.id,
        matchId,
        setIndex,
        team1Score,
        team2Score
      );
      
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
        setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
      }
    } catch (error) {
      console.error("Error updating match score:", error);
    }
  };

  // Complete a match and auto-assign court to next match
  const completeMatch = async (matchId: string) => {
    if (!currentTournament) return;
    
    try {
      const updatedTournament = await matchService.completeMatch(currentTournament.id, matchId);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
        setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
      }
    } catch (error) {
      console.error("Error completing match:", error);
    }
  };

  // Move team to a different division
  const moveTeamToDivision = async (teamId: string, fromDivision: Division, toDivision: Division) => {
    if (!currentTournament) return;
    
    // This would be implemented in a real app - for now we're keeping the existing implementation
    console.log(`Moving team ${teamId} from ${fromDivision} to ${toDivision}`);
  };

  // Schedule a new match
  const scheduleMatch = async (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string) => {
    if (!currentTournament) return;
    
    // This would be implemented in a real app - for now we're keeping the existing implementation
    console.log(`Scheduling match between ${team1Id} and ${team2Id} at ${scheduledTime}`);
  };

  // Generate the multi-stage tournament
  const generateMultiStageTournament = async () => {
    if (!currentTournament) return;
    
    // This would be implemented in a real app - for now we're keeping the existing implementation
    console.log("Generating multi-stage tournament");
  };
  
  // Advance to the next stage
  const advanceToNextStage = async () => {
    if (!currentTournament) return;
    
    // This would be implemented in a real app - for now we're keeping the existing implementation
    console.log("Advancing to next stage");
  };
  
  // Generate bracket based on match results
  const generateBracket = async () => {
    if (!currentTournament) return;
    
    // This would be implemented in a real app - for now we're keeping the existing implementation
    console.log("Generating bracket");
  };
  
  // Load sample data
  const loadSampleData = async (format?: TournamentFormat) => {
    try {
      console.log('[DEBUG] Loading sample tournament data for format:', format || 'MULTI_STAGE');
      const sampleData = format ? getSampleDataByFormat(format) : createSampleData();
      await tournamentService.saveCurrentTournament(sampleData);
      
      const tournaments = await tournamentService.getTournaments();
      const updatedTournaments = [...tournaments, sampleData];
      await tournamentService.saveTournaments(updatedTournaments);
      
      setCurrentTournament(sampleData);
      setTournaments(updatedTournaments);
    } catch (error) {
      console.error("Error loading sample data:", error);
    }
  };

  // Fix the assignSeeding function
  const assignSeeding = async (tournamentId: string) => {
    if (!currentTournament || currentTournament.id !== tournamentId) return;
    
    try {
      // Call the utility function to assign seeding
      const seededTournament = assignPlayerSeeding(currentTournament);
      
      // Update the tournament with the seeded teams
      await updateTournament(seededTournament);
      console.log("Tournament teams have been seeded successfully");
    } catch (error) {
      console.error("Error assigning seeds to teams:", error);
    }
  };
  
  // Add category to tournament
  const addCategory = async (category: Omit<TournamentCategory, "id">) => {
    if (!currentTournament) return;
    
    try {
      const newCategory = {
        ...category,
        id: crypto.randomUUID()
      };
      
      const updatedTournament = {
        ...currentTournament,
        categories: [...currentTournament.categories, newCategory],
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  // Remove category from tournament
  const removeCategory = async (categoryId: string) => {
    if (!currentTournament) return;
    
    try {
      const updatedTournament = {
        ...currentTournament,
        categories: currentTournament.categories.filter(c => c.id !== categoryId),
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error removing category:", error);
    }
  };

  // Update category in tournament
  const updateCategory = async (category: TournamentCategory) => {
    if (!currentTournament) return;
    
    try {
      const updatedTournament = {
        ...currentTournament,
        categories: currentTournament.categories.map(c => c.id === category.id ? category : c),
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };
  
  if (isLoading) {
    return <div>Loading tournament data...</div>;
  }
  
  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        currentTournament,
        setCurrentTournament: async (tournament) => {
          if (tournament) {
            await tournamentService.setCurrentTournament(tournament);
          }
          setCurrentTournament(tournament);
        },
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
