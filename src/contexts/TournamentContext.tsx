import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Tournament, Match, Team, Court } from "@/types/tournament";
import { createNewTournament, deleteTournament, importTeamsToTournament, scheduleMatchInTournament } from "./tournament/tournamentOperations";
import { updateMatchScoreInTournament, completeMatchInTournament, updateMatchStatusInTournament } from "./tournament/matchOperations";
import { prepareUpdatedEntity } from "@/utils/auditUtils";

interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament | null) => void;
  addTournament: (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => void;
  updateTournament: (tournament: Tournament) => void;
  removeTournament: (tournamentId: string) => void;
  importTeams: (teams: Team[]) => void;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => void;
  updateMatchStatus: (matchId: string, status: string) => void;
  completeMatch: (matchId: string, scorerName?: string) => void;
  assignCourt: (matchId: string, courtId: string) => void;
  autoAssignCourts: () => void;
  isPending: boolean;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};

interface TournamentProviderProps {
  children: ReactNode;
}

const getInitialTournaments = (): Tournament[] => {
  try {
    const storedTournaments = localStorage.getItem("tournaments");
    return storedTournaments ? JSON.parse(storedTournaments) : [];
  } catch (error) {
    console.error("Failed to load tournaments from local storage:", error);
    return [];
  }
};

export const TournamentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(getInitialTournaments());
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Save tournaments to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("tournaments", JSON.stringify(tournaments));
  }, [tournaments]);

  // Add a new tournament
  const addTournament = (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => {
    const { tournament, tournaments: updatedTournaments } = createNewTournament(tournamentData, tournaments);
    setTournaments(updatedTournaments);
    setCurrentTournament(tournament);
  };

  // Update an existing tournament
  const updateTournament = (tournament: Tournament) => {
    const updatedTournament = prepareUpdatedEntity(tournament);
    setTournaments(
      tournaments.map((t) => (t.id === tournament.id ? updatedTournament : t))
    );
    setCurrentTournament(updatedTournament);
  };

  // Remove a tournament
  const removeTournament = (tournamentId: string) => {
    const { tournaments: updatedTournaments, currentTournament: updatedCurrentTournament } = deleteTournament(
      tournamentId,
      tournaments,
      currentTournament
    );
    setTournaments(updatedTournaments);
    setCurrentTournament(updatedCurrentTournament);
  };

  // Import teams to the current tournament
  const importTeams = (teams: Team[]) => {
    if (!currentTournament) return;

    const updatedTournament = importTeamsToTournament(teams, currentTournament);
    setTournaments(
      tournaments.map((t) => (t.id === updatedTournament.id ? updatedTournament : t))
    );
    setCurrentTournament(updatedTournament);
  };

  // Schedule a match
  const scheduleMatch = useCallback(
    (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => {
      if (!currentTournament) return;

      setIsPending(true);
      try {
        const updatedTournament = scheduleMatchInTournament(
          team1Id,
          team2Id,
          scheduledTime,
          currentTournament,
          courtId,
          categoryId
        );
        setTournaments(
          tournaments.map((t) => (t.id === updatedTournament.id ? updatedTournament : t))
        );
        setCurrentTournament(updatedTournament);
      } catch (error) {
        console.error("Error scheduling match:", error);
      } finally {
        setIsPending(false);
      }
    },
    [currentTournament, tournaments]
  );

  // Update match score
  const updateMatchScore = useCallback(
    (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => {
      if (!currentTournament) return;
      
      setIsPending(true);
      try {
        const updatedTournament = updateMatchScoreInTournament(
          matchId, 
          setIndex, 
          team1Score, 
          team2Score, 
          currentTournament,
          scorerName
        );
        setCurrentTournament(updatedTournament);
        if (!tournaments.some(t => t.id === updatedTournament.id)) {
          setTournaments([...tournaments, updatedTournament]);
        } else {
          setTournaments(
            tournaments.map(t => (t.id === updatedTournament.id ? updatedTournament : t))
          );
        }
      } catch (error) {
        console.error("Error updating match score:", error);
      } finally {
        setIsPending(false);
      }
    },
    [currentTournament, tournaments]
  );

  // Update match status
  const updateMatchStatus = useCallback(
    (matchId: string, status: string) => {
      if (!currentTournament) return;

      setIsPending(true);
      try {
        const updatedTournament = updateMatchStatusInTournament(matchId, status as any, currentTournament);
        setTournaments(
          tournaments.map((t) => (t.id === updatedTournament.id ? updatedTournament : t))
        );
        setCurrentTournament(updatedTournament);
      } catch (error) {
        console.error("Error updating match status:", error);
      } finally {
        setIsPending(false);
      }
    },
    [currentTournament, tournaments]
  );

  // Complete a match
  const completeMatch = useCallback(
    (matchId: string, scorerName?: string) => {
      if (!currentTournament) return;
      
      setIsPending(true);
      try {
        const updatedTournament = completeMatchInTournament(
          matchId, 
          currentTournament,
          scorerName
        );
        setCurrentTournament(updatedTournament);
        setTournaments(
          tournaments.map(t => (t.id === updatedTournament.id ? updatedTournament : t))
        );
      } catch (error) {
        console.error("Error completing match:", error);
      } finally {
        setIsPending(false);
      }
    },
    [currentTournament, tournaments]
  );

  // Assign a court to a match
  const assignCourt = useCallback(
    (matchId: string, courtId: string) => {
      if (!currentTournament) return;

      // Find the match and court
      const match = currentTournament.matches.find((m) => m.id === matchId);
      const court = currentTournament.courts.find((c) => c.id === courtId);

      if (!match || !court) {
        console.error("Match or court not found");
        return;
      }

      // Update the match with the court number
      const updatedMatch = { ...match, courtNumber: court.number };

      // Update the court with the current match
      const updatedCourt = { ...court, currentMatch: updatedMatch };

      // Update the tournament with the updated match and court
      const updatedTournaments = {
        ...currentTournament,
        matches: currentTournament.matches.map((m) =>
          m.id === matchId ? updatedMatch : m
        ),
        courts: currentTournament.courts.map((c) =>
          c.id === courtId ? updatedCourt : c
        ),
      };

      setTournaments(
        tournaments.map((t) =>
          t.id === updatedTournaments.id ? updatedTournaments : t
        )
      );
      setCurrentTournament(updatedTournaments);
    },
    [currentTournament, tournaments]
  );

  // Auto-assign available courts to scheduled matches
  const autoAssignCourts = useCallback(() => {
    if (!currentTournament) return;

    let updatedTournament: Tournament = { ...currentTournament };

    // Get available courts
    const availableCourts = updatedTournament.courts.filter(
      (court) => court.status === "AVAILABLE"
    );

    // Get scheduled matches without a court assigned
    const scheduledMatches = updatedTournament.matches.filter(
      (match) => match.status === "SCHEDULED" && !match.courtNumber
    );

    // Assign courts to matches
    for (let i = 0; i < Math.min(availableCourts.length, scheduledMatches.length); i++) {
      const court = availableCourts[i];
      const match = scheduledMatches[i];

      // Update the match with the court number
      const updatedMatch = { ...match, courtNumber: court.number };

      // Update the court with the current match
      const updatedCourt = { ...court, currentMatch: updatedMatch };

      // Update the tournament with the updated match and court
      updatedTournament = {
        ...updatedTournament,
        matches: updatedTournament.matches.map((m) =>
          m.id === match.id ? updatedMatch : m
        ),
        courts: updatedTournament.courts.map((c) =>
          c.id === court.id ? updatedCourt : c
        ),
      };
    }

    setTournaments(
      tournaments.map((t) =>
        t.id === updatedTournament.id ? updatedTournament : t
      )
    );
    setCurrentTournament(updatedTournament);
  }, [tournaments, currentTournament]);

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        currentTournament,
        setCurrentTournament,
        addTournament,
        updateTournament,
        removeTournament,
        importTeams,
        scheduleMatch,
        updateMatchScore,
        updateMatchStatus,
        completeMatch,
        assignCourt,
        autoAssignCourts,
        isPending,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournamentContext = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournamentContext must be used within a TournamentProvider");
  }
  return context;
};
