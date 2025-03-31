
import React, { memo } from "react";
import { Match, ScoringSettings } from "@/types/tournament";
import { PlusCircle, MinusCircle, RefreshCw, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface ScoringMatchDetailProps {
  match: Match;
  onScoreChange: (team: "team1" | "team2", increment: boolean) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  currentSet: number;
  onSetChange: (setIndex: number) => void;
}

// Memoize the component to prevent unnecessary re-renders
const ScoringMatchDetail = memo(({
  match,
  onScoreChange,
  onNewSet,
  onCompleteMatch,
  currentSet,
  onSetChange
}: ScoringMatchDetailProps) => {
  if (!match) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <p>No match data available</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure match.scores is always an array, even if it's undefined
  const scores = Array.isArray(match.scores) ? match.scores : [];
  
  // Make sure we have a valid current set index
  const validCurrentSet = scores.length > 0 ? Math.min(currentSet, scores.length - 1) : 0;
  
  // Get current score or default to 0-0
  const currentScore = scores[validCurrentSet] || { team1Score: 0, team2Score: 0 };
  
  // Ensure team names are defined
  const team1Name = match.team1?.name || "Team 1";
  const team2Name = match.team2?.name || "Team 2";

  return (
    <Card className="shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">
            Scoring: {match.courtNumber ? `Court ${match.courtNumber}` : "Standalone Match"}
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onNewSet}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              New Set
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCompleteMatch}
            >
              <Check className="h-4 w-4 mr-1" />
              Complete
            </Button>
          </div>
        </div>

        {/* Match Teams */}
        <div className="flex justify-between items-center mb-6">
          <div className="font-medium text-lg">{team1Name}</div>
          <div className="text-sm text-gray-500">vs</div>
          <div className="font-medium text-lg text-right">{team2Name}</div>
        </div>

        {/* Set Navigation */}
        {scores.length > 1 && (
          <div className="flex justify-center items-center space-x-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetChange(Math.max(0, validCurrentSet - 1))}
              disabled={validCurrentSet === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Set {validCurrentSet + 1} of {scores.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetChange(Math.min(scores.length - 1, validCurrentSet + 1))}
              disabled={validCurrentSet === scores.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Team 1 Scoring */}
        <div className="border rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-xl">{team1Name}</h4>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="rounded-full h-12 w-12 p-0 flex items-center justify-center border-2 border-gray-300 hover:border-red-500 hover:bg-red-50"
                onClick={() => onScoreChange("team1", false)}
                aria-label="Decrease Team 1 Score"
              >
                <MinusCircle className="h-6 w-6 text-red-500" />
              </Button>
              
              <span className="text-4xl font-bold min-w-16 text-center">
                {currentScore.team1Score || 0}
              </span>
              
              <Button
                className="bg-green-500 hover:bg-green-600 rounded-full h-14 w-14 p-0 flex items-center justify-center"
                onClick={() => onScoreChange("team1", true)}
                aria-label="Increase Team 1 Score"
              >
                <PlusCircle className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </div>

        {/* Team 2 Scoring */}
        <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-xl">{team2Name}</h4>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="rounded-full h-12 w-12 p-0 flex items-center justify-center border-2 border-gray-300 hover:border-red-500 hover:bg-red-50"
                onClick={() => onScoreChange("team2", false)}
                aria-label="Decrease Team 2 Score"
              >
                <MinusCircle className="h-6 w-6 text-red-500" />
              </Button>
              
              <span className="text-4xl font-bold min-w-16 text-center">
                {currentScore.team2Score || 0}
              </span>
              
              <Button
                className="bg-green-500 hover:bg-green-600 rounded-full h-14 w-14 p-0 flex items-center justify-center"
                onClick={() => onScoreChange("team2", true)}
                aria-label="Increase Team 2 Score"
              >
                <PlusCircle className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-6 py-4">
        <div className="w-full overflow-x-auto">
          <div className="flex justify-center flex-wrap gap-2 min-w-max">
            {scores.map((score, index) => (
              <div 
                key={index}
                className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
                  validCurrentSet === index 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => onSetChange(index)}
              >
                Set {index + 1}: {score.team1Score || 0}-{score.team2Score || 0}
              </div>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
});

// Add display name for better debugging
ScoringMatchDetail.displayName = 'ScoringMatchDetail';

export default ScoringMatchDetail;
