
import React from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Minus, Plus, CheckCircle, Award } from "lucide-react";
import { Match } from "@/types/tournament";
import { Skeleton } from "@/components/ui/skeleton";

interface ScoringMatchDetailProps {
  match: Match;
  onScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  currentSet: number;
  onSetChange: (set: number) => void;
  isPending?: boolean; // Add isPending prop
}

const ScoringMatchDetail: React.FC<ScoringMatchDetailProps> = ({
  match,
  onScoreChange,
  onNewSet,
  onCompleteMatch,
  currentSet,
  onSetChange,
  isPending = false // Default to false
}) => {
  // Only show sets with scores
  const totalSets = match.scores ? match.scores.length : 0;
  const team1Name = match.team1?.name || "Team 1";
  const team2Name = match.team2?.name || "Team 2";

  return (
    <div className={`space-y-6 ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl font-bold mb-1">
            Match Scoring
            {isPending && (
              <span className="ml-2 inline-flex items-center text-amber-600 text-sm font-normal">
                <span className="animate-pulse rounded-full w-2 h-2 bg-amber-500 mr-1"></span>
                Processing...
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Court {match.courtNumber || "N/A"} • {match.division} • {match.status}
          </p>
        </div>

        <div className="space-x-2 mb-4 md:mb-0">
          {isPending ? (
            <Skeleton className="h-9 w-32 inline-block" />
          ) : (
            <Button
              variant="outline"
              onClick={onNewSet}
              className="flex items-center"
              disabled={match.status === "COMPLETED"}
            >
              <PlusCircle className="mr-1 h-4 w-4" />
              New Set
            </Button>
          )}

          {isPending ? (
            <Skeleton className="h-9 w-32 inline-block" />
          ) : (
            <Button
              variant="outline"
              onClick={onCompleteMatch}
              className="flex items-center"
              disabled={match.status === "COMPLETED"}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Complete Match
            </Button>
          )}
        </div>
      </div>

      {/* Teams Information */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 inline-flex items-center justify-center mr-2">1</span>
                {team1Name}
                {match.team1?.seed && (
                  <span className="ml-2 inline-flex items-center text-amber-600 text-sm">
                    <Award className="h-3 w-3 mr-1" /> {match.team1.seed}
                  </span>
                )}
              </h3>
            </div>

            <div className="col-span-1 text-center">
              <h3 className="font-semibold mb-2">VS</h3>
            </div>

            <div className="col-span-1 text-right">
              <h3 className="font-semibold mb-2 flex items-center justify-end">
                {match.team2?.seed && (
                  <span className="mr-2 inline-flex items-center text-amber-600 text-sm">
                    <Award className="h-3 w-3 mr-1" /> {match.team2.seed}
                  </span>
                )}
                {team2Name}
                <span className="bg-red-100 text-red-800 rounded-full h-5 w-5 inline-flex items-center justify-center ml-2">2</span>
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Entry */}
      <Card>
        <CardContent className="py-4">
          {/* Set Selector */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Sets</h3>
            <div className="flex space-x-2">
              {[...Array(totalSets)].map((_, idx) => (
                <Button
                  key={idx}
                  variant={currentSet === idx ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSetChange(idx)}
                  disabled={isPending}
                >
                  Set {idx + 1}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Current Set Score */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="space-y-2">
              <p className="text-sm font-medium">{team1Name}</p>
              {isPending ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onScoreChange("team1", false)}
                    disabled={!match.scores[currentSet]?.team1Score || match.status === "COMPLETED"}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="text-2xl font-bold mx-4">
                    {match.scores[currentSet]?.team1Score || 0}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onScoreChange("team1", true)}
                    disabled={match.status === "COMPLETED"}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <div className="text-xl font-bold">-</div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-right">{team2Name}</p>
              {isPending ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onScoreChange("team2", false)}
                    disabled={!match.scores[currentSet]?.team2Score || match.status === "COMPLETED"}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="text-2xl font-bold mx-4">
                    {match.scores[currentSet]?.team2Score || 0}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onScoreChange("team2", true)}
                    disabled={match.status === "COMPLETED"}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-gray-50 p-4 rounded-b-lg">
          <div className="grid grid-cols-3 gap-4 w-full">
            <div>
              <p className="text-xs text-gray-500">Total Sets:</p>
              <p className="font-semibold">
                {match.scores.filter(s => s.team1Score > s.team2Score).length || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Match Status:</p>
              <p className="font-semibold">{match.status}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Sets:</p>
              <p className="font-semibold">
                {match.scores.filter(s => s.team2Score > s.team1Score).length || 0}
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ScoringMatchDetail;
