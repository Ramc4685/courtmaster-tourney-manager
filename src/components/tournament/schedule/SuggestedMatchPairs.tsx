
import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { Team } from "@/types/tournament";

interface SuggestedMatchPairsProps {
  suggestedPairs: { team1: Team; team2: Team }[];
  onRefreshSuggestions: () => void;
}

const SuggestedMatchPairs: React.FC<SuggestedMatchPairsProps> = ({
  suggestedPairs,
  onRefreshSuggestions,
}) => {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Suggested Matches ({suggestedPairs.length}):</h4>
      {suggestedPairs.length > 0 ? (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {suggestedPairs.slice(0, 5).map((pair, index) => (
            <div key={index} className="flex items-center justify-between border rounded-md p-3">
              <div className="flex-1">
                <p className="font-medium">{pair.team1.name}</p>
                <p className="text-xs text-gray-500">Rank: {pair.team1.initialRanking || 'N/A'}</p>
              </div>
              <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium">{pair.team2.name}</p>
                <p className="text-xs text-gray-500">Rank: {pair.team2.initialRanking || 'N/A'}</p>
              </div>
            </div>
          ))}
          {suggestedPairs.length > 5 && (
            <p className="text-center text-sm text-gray-500 py-2">
              And {suggestedPairs.length - 5} more matches...
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md">
          <p className="text-gray-500">No suggested matches available for this division</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={onRefreshSuggestions}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Refresh Suggestions
          </Button>
        </div>
      )}
    </div>
  );
};

export default SuggestedMatchPairs;
