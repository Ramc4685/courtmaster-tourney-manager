
import React from "react";
import { Match, Team, Tournament } from "@/types/tournament";
import { cn } from "@/lib/utils";

interface TournamentBracketProps {
  tournament: Tournament;
  onMatchClick?: (match: Match) => void;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  onMatchClick,
}) => {
  // Generate rounds for single elimination tournament
  const generateRounds = () => {
    if (!tournament || !tournament.teams.length) return [];

    const rounds = [];
    const teamCount = tournament.teams.length;
    const roundCount = Math.ceil(Math.log2(teamCount));

    for (let r = 0; r < roundCount; r++) {
      const matchesInRound = Math.pow(2, roundCount - r - 1);
      const matches = tournament.matches.filter(
        (match) => match.bracketRound === r + 1
      );

      rounds.push({
        name: r === roundCount - 1 ? "Final" : r === roundCount - 2 ? "Semi-Finals" : `Round ${r + 1}`,
        matches: matches.length ? matches : Array(matchesInRound).fill(null),
      });
    }

    return rounds;
  };

  const rounds = generateRounds();

  // If no rounds exist yet, show placeholder
  if (!rounds.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bracket available</h3>
        <p className="text-gray-500 mb-4">
          The tournament bracket will be generated after teams are added and the tournament is started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex space-x-8 min-w-max p-4">
        {rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="flex flex-col space-y-4">
            <div className="text-center font-medium text-sm mb-2">
              {round.name}
            </div>
            <div
              className="flex flex-col justify-around"
              style={{
                height:
                  round.matches.length > 0
                    ? `${round.matches.length * 80}px`
                    : "auto",
              }}
            >
              {round.matches.map((match, matchIndex) => (
                <div
                  key={`${roundIndex}-${matchIndex}`}
                  className={cn(
                    "w-48 border rounded-md overflow-hidden shadow-sm",
                    match ? "cursor-pointer hover:border-blue-500" : "border-dashed border-gray-300 bg-gray-50"
                  )}
                  onClick={() => match && onMatchClick && onMatchClick(match)}
                >
                  {match ? (
                    <>
                      <div className="flex justify-between items-center p-2 border-b bg-gray-50">
                        <div className="font-medium text-xs">Match {match.bracketPosition}</div>
                        <div className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          match.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                          match.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {match.status}
                        </div>
                      </div>
                      <div className="p-2">
                        <TeamSlot
                          team={match.team1}
                          isWinner={match.winner?.id === match.team1.id}
                          score={match.scores?.[0]?.team1Score}
                        />
                        <div className="my-1 border-t border-gray-100"></div>
                        <TeamSlot
                          team={match.team2}
                          isWinner={match.winner?.id === match.team2.id}
                          score={match.scores?.[0]?.team2Score}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-xs">
                      TBD
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper component for team display
const TeamSlot: React.FC<{
  team?: Team;
  isWinner?: boolean;
  score?: number;
}> = ({ team, isWinner, score }) => {
  return (
    <div
      className={cn(
        "flex justify-between items-center",
        isWinner ? "font-medium" : ""
      )}
    >
      <div className="truncate text-sm" title={team?.name || "TBD"}>
        {team?.name || "TBD"}
      </div>
      {score !== undefined && (
        <div
          className={cn(
            "text-sm px-1.5 rounded",
            isWinner ? "bg-court-green/20 text-court-green" : ""
          )}
        >
          {score}
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
