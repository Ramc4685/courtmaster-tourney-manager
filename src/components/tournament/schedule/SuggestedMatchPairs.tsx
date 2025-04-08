
import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Team } from "@/types/tournament";

interface SuggestedMatchPairsProps {
  suggestedPairs: { team1: Team; team2: Team }[];
  onRefreshSuggestions: () => void;
}

const SuggestedMatchPairs: React.FC<SuggestedMatchPairsProps> = ({
  suggestedPairs,
  onRefreshSuggestions,
}) => {
  if (suggestedPairs.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-center">
        <p className="text-sm text-gray-500 mb-2">
          No suggested match pairs available.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshSuggestions}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate Suggestions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Suggested Match Pairs</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshSuggestions}
          className="h-8 px-2"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
        <div className="max-h-[200px] overflow-y-auto p-2">
          {suggestedPairs.map((pair, index) => (
            <div
              key={index}
              className="py-2 px-3 bg-white rounded border border-gray-100 mb-2 text-sm"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-xs text-gray-500">
                  Match {index + 1}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <div className="truncate max-w-[45%]" title={pair.team1.name}>
                  {pair.team1.name}
                </div>
                <div className="text-gray-400">vs</div>
                <div className="truncate max-w-[45%] text-right" title={pair.team2.name}>
                  {pair.team2.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedMatchPairs;
