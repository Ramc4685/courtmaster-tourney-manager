
import React, { useState } from "react";
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

const ScoringMatchDetail: React.FC<ScoringMatchDetailProps> = ({
  match,
  onScoreChange,
  onNewSet,
  onCompleteMatch,
  currentSet,
  onSetChange
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">
            Scoring: Court {match.courtNumber || "Not Assigned"}
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
          <div className="font-medium">{match.team1.name}</div>
          <div className="text-sm text-gray-500">vs</div>
          <div className="font-medium text-right">{match.team2.name}</div>
        </div>

        {/* Set Navigation */}
        {match.scores.length > 1 && (
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetChange(Math.max(0, currentSet - 1))}
              disabled={currentSet === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Set {currentSet + 1} of {match.scores.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetChange(Math.min(match.scores.length - 1, currentSet + 1))}
              disabled={currentSet === match.scores.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Team 1 Scoring */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-lg">{match.team1.name}</h4>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => onScoreChange("team1", false)}
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <span className="text-3xl font-bold">
                {match.scores[currentSet]?.team1Score || 0}
              </span>
              <Button
                className="bg-court-green hover:bg-court-green/90 rounded-full h-10 w-10"
                size="icon"
                onClick={() => onScoreChange("team1", true)}
              >
                <PlusCircle className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Team 2 Scoring */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-lg">{match.team2.name}</h4>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={() => onScoreChange("team2", false)}
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <span className="text-3xl font-bold">
                {match.scores[currentSet]?.team2Score || 0}
              </span>
              <Button
                className="bg-court-green hover:bg-court-green/90 rounded-full h-10 w-10"
                size="icon"
                onClick={() => onScoreChange("team2", true)}
              >
                <PlusCircle className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-6 py-3">
        <div className="w-full flex flex-wrap justify-center gap-2">
          {match.scores.map((score, index) => (
            <div 
              key={index}
              className={`px-3 py-1 rounded-full text-sm ${
                currentSet === index 
                  ? 'bg-court-green text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Set {index + 1}: {score.team1Score}-{score.team2Score}
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ScoringMatchDetail;
