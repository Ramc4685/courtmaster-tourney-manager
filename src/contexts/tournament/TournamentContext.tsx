import React, { createContext, useState, useEffect, useContext, PropsWithChildren } from 'react';
import { Tournament, Match, Court, Team, TournamentFormat, Category, CourtStatus, ScoringSettings } from "@/types/tournament";
import { generateId } from '@/utils/tournamentUtils';
import { tournamentService } from '@/services/tournament/TournamentService';
import { matchService } from '@/services/tournament/MatchService';
import { teamService } from '@/services/tournament/TeamService';
import { categoryService } from '@/services/tournament/CategoryService';
import { autoAssignCourts } from '@/utils/courtUtils';
import { useToast } from '@/hooks/use-toast';
import { sortTeamsByRanking } from '@/utils/tournamentUtils';
import { bracketService } from '@/services/tournament/BracketService';
import { TournamentContextType } from './types';

export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const { toast } = useToast();

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

  const createTournament = async (name: string, categories: Category[]): Promise<Tournament | null> => {
    const newTournament: Tournament = {
      id: generateId(),
      name,
      categories,
      format: TournamentFormat.SingleElimination,
      startDate: new Date(),
      endDate: new Date(),
      matches: [],
      teams: [],
      courts: [],
      status: 'Planning',
      createdAt: new Date(),
      updatedAt: new Date(),
      scoringSettings: {
        setsToWin: 2,
        pointsPerSet: 21,
        winByTwo: true,
        maxPoints: 30,
        maxSets: 5
      }
    };

    try {
      const createdTournament = await tournamentService.createTournament(newTournament);
      setTournaments(prevTournaments => [...prevTournaments, createdTournament]);
      return createdTournament;
    } catch (error) {
      console.error("Error creating tournament:", error);
      return null;
    }
  };

  const updateTournament = async (tournament: Tournament) => {
    try {
      await tournamentService.updateTournament(tournament);
      setTournaments(prevTournaments =>
        prevTournaments.map(t => (t.id === tournament.id ? tournament : t))
      );
      setCurrentTournament(tournament);
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
      setCurrentTournament(null);
    } catch (error) {
      console.error("Error deleting tournament:", error);
    }
  };

  const setCurrentTournamentContext = async (tournament: Tournament) => {
    try {
      const fetchedTournament = await tournamentService.getTournamentById(tournament.id);
      if (fetchedTournament) {
        setCurrentTournament(fetchedTournament);
      } else {
        console.error("Tournament not found");
      }
    } catch (error) {
      console.error("Error fetching tournament:", error);
    }
  };

  const startMatch = async (matchId: string) => {
    if (!currentTournament) return;

    try {
      await matchService.updateMatchStatus(currentTournament.id, matchId, "IN_PROGRESS");
      // Refresh the tournament data after starting the match
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error starting match:", error);
    }
  };

  const updateMatchStatus = async (matchId: string, status: string) => {
    if (!currentTournament) return;

    try {
      await matchService.updateMatchStatus(currentTournament.id, matchId, status as MatchStatus);
      // Refresh the tournament data after updating the match status
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error updating match status:", error);
    }
  };

  const updateMatchScore = async (matchId: string, setIndex: number, team1Score: number, team2Score: number) => {
    if (!currentTournament) return;

    try {
      await matchService.updateMatchScore(currentTournament.id, matchId, setIndex, team1Score, team2Score);
      // Refresh the tournament data after updating the match score
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error updating match score:", error);
    }
  };

  const completeMatch = async (matchId: string) => {
    if (!currentTournament) return;

    try {
      await matchService.completeMatch(currentTournament.id, matchId);
      // Refresh the tournament data after completing the match
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error completing match:", error);
    }
  };

  const assignCourt = async (matchId: string, courtId: string) => {
    if (!currentTournament) return;

    try {
      await tournamentService.assignCourtToMatch(currentTournament, matchId, courtId);
      // Refresh the tournament data after assigning the court
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error assigning court:", error);
    }
  };

  const freeCourt = async (courtNumber: number) => {
    if (!currentTournament) return;

    try {
      // Optimistically update the UI
      const updatedCourts = currentTournament.courts.map(court =>
        court.number === courtNumber ? { ...court, status: "AVAILABLE" as CourtStatus, currentMatch: null } : court
      );
      const updatedTournament = { ...currentTournament, courts: updatedCourts };
      setCurrentTournament(updatedTournament);

      // Call the service to update the court status
      // await courtService.freeCourt(currentTournament.id, courtNumber);

      // Refresh the tournament data after freeing the court
      // const refreshedTournament = await tournamentService.getTournamentById(currentTournament.id);
      // if (refreshedTournament) {
      //   setCurrentTournament(refreshedTournament);
      // }
    } catch (error) {
      console.error("Error freeing court:", error);
    }
  };

  const autoAssignCourts = async (): Promise<number> => {
    if (!currentTournament) return 0;

    try {
      const { tournament: updatedTournament, assignedCount } = await autoAssignCourts(currentTournament);

      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
        return assignedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error auto-assigning courts:", error);
      return 0;
    }
  };

  // Function to start multiple matches that have courts assigned
  const startMatchesWithCourts = async () => {
    if (!currentTournament) return 0;
    
    const matchesToStart = currentTournament.matches.filter(
      match => match.status === "SCHEDULED" && match.courtNumber && match.team1 && match.team2
    );
    
    let startedCount = 0;
    
    for (const match of matchesToStart) {
      try {
        await matchService.updateMatchStatus(currentTournament.id, match.id, "IN_PROGRESS");
        startedCount++;
      } catch (error) {
        console.error(`Error starting match ${match.id}:`, error);
      }
    }
    
    if (startedCount > 0) {
      // Refresh the tournament data after starting matches
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    }
    
    return startedCount;
  };

  // Initialize scoring for a specific match
  const initializeScoring = async (matchId: string) => {
    if (!currentTournament) return null;
    
    try {
      const match = currentTournament.matches.find(m => m.id === matchId);
      
      if (!match) {
        console.error(`Match with ID ${matchId} not found`);
        return null;
      }
      
      // If match is not started yet, start it
      if (match.status === "SCHEDULED") {
        await matchService.updateMatchStatus(currentTournament.id, matchId, "IN_PROGRESS");
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
      await teamService.addTeam(currentTournament.id, team);
      // Refresh the tournament data after adding the team
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error adding team:", error);
    }
  };

  const updateTeam = async (team: Team) => {
    if (!currentTournament) return;

    try {
      await teamService.updateTeam(currentTournament.id, team);
      // Refresh the tournament data after updating the team
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!currentTournament) return;

    try {
      await teamService.deleteTeam(currentTournament.id, teamId);
      // Refresh the tournament data after deleting the team
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const addCategory = async (category: Category) => {
    if (!currentTournament) return;

    try {
      await categoryService.addCategory(currentTournament.id, category);
      // Refresh the tournament data after adding the category
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const updateCategory = async (category: Category) => {
    if (!currentTournament) return;

    try {
      await categoryService.updateCategory(currentTournament.id, category);
      // Refresh the tournament data after updating the category
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!currentTournament) return;

    try {
      await categoryService.deleteCategory(currentTournament.id, categoryId);
      // Refresh the tournament data after deleting the category
      const updatedTournament = await tournamentService.getTournamentById(currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const generateBrackets = async (): Promise<number> => {
    if (!currentTournament) return 0;

    try {
      const { assignedCount, tournament } = await bracketService.generateBrackets(currentTournament.id);

      if (tournament) {
        setCurrentTournament(tournament);
        return assignedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error generating brackets:", error);
      return 0;
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
    addCategory,
    updateCategory,
    deleteCategory,
    generateBrackets,
  };

  return (
    <TournamentContext.Provider value={tournamentContextValue}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = (): TournamentContextType => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};
