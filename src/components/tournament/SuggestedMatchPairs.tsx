
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { Team } from '@/types/tournament';

export interface SuggestedMatchPairsProps {
  suggestedPairs: { team1: Team; team2: Team }[];
  onRefreshSuggestions: () => void;
}

const SuggestedMatchPairs: React.FC<SuggestedMatchPairsProps> = ({ 
  suggestedPairs, 
  onRefreshSuggestions 
}) => {
  if (!suggestedPairs || suggestedPairs.length === 0) {
    return (
      <div className="bg-gray-50 rounded-md p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Suggested Match Pairs</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefreshSuggestions}
            className="h-8"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Generate
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          No suggested match pairs available. Click Generate to create suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Suggested Match Pairs</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefreshSuggestions}
          className="h-8"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
      <div className="space-y-2">
        {suggestedPairs.map((pair, index) => (
          <div 
            key={`${pair.team1.id}-${pair.team2.id}`} 
            className="bg-white p-2 rounded border flex justify-between items-center"
          >
            <div className="text-sm">
              <span className="font-medium">{pair.team1.name}</span> vs <span className="font-medium">{pair.team2.name}</span>
            </div>
            <span className="text-xs text-gray-500">Match {index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedMatchPairs;
