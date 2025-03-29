
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentFormat } from "@/types/tournament";

// Visual components for different tournament formats
interface FormatVisualizationProps {
  format: TournamentFormat;
}

// Single Elimination Format Visualization
const SingleEliminationVisualization: React.FC = () => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between">
        <div className="flex flex-col space-y-4">
          {/* Round 1 */}
          <div className="flex flex-col space-y-4">
            <div className="w-32 h-10 border rounded-md bg-white p-2">Team 1</div>
            <div className="w-32 h-10 border rounded-md bg-white p-2">Team 2</div>
          </div>
          <div className="flex flex-col space-y-4 mt-8">
            <div className="w-32 h-10 border rounded-md bg-white p-2">Team 3</div>
            <div className="w-32 h-10 border rounded-md bg-white p-2">Team 4</div>
          </div>
        </div>
        
        {/* Lines connecting teams */}
        <div className="flex items-center">
          <div className="relative w-8 h-32">
            <div className="absolute top-5 left-0 w-8 h-0.5 bg-gray-400"></div>
            <div className="absolute top-5 left-8 w-0.5 h-22 bg-gray-400"></div>
            <div className="absolute bottom-5 left-0 w-8 h-0.5 bg-gray-400"></div>
          </div>
        </div>
        
        {/* Final match */}
        <div className="flex items-center">
          <div className="w-32 h-10 border rounded-md bg-white p-2">Final</div>
        </div>
      </div>
      <div className="text-center mt-4 text-sm text-gray-500">
        Teams progress through single elimination rounds until a champion is determined
      </div>
    </div>
  );
};

// Round Robin Format Visualization
const RoundRobinVisualization: React.FC = () => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-4 gap-2">
        <div className="h-10 border rounded-md bg-white p-2 text-center">Team 1</div>
        <div className="h-10 border rounded-md bg-white p-2 text-center">Team 2</div>
        <div className="h-10 border rounded-md bg-white p-2 text-center">Team 3</div>
        <div className="h-10 border rounded-md bg-white p-2 text-center">Team 4</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="h-10 border rounded-md bg-blue-50 p-2 text-center">Match 1</div>
        <div className="h-10 border rounded-md bg-blue-50 p-2 text-center">Match 2</div>
        <div className="h-10 border rounded-md bg-blue-50 p-2 text-center">Match 3</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="h-10 border rounded-md bg-blue-50 p-2 text-center">Match 4</div>
        <div className="h-10 border rounded-md bg-blue-50 p-2 text-center">Match 5</div>
        <div className="h-10 border rounded-md bg-blue-50 p-2 text-center">Match 6</div>
      </div>
      <div className="text-center mt-4 text-sm text-gray-500">
        Each team plays against every other team once, accumulating points based on wins
      </div>
    </div>
  );
};

// Double Elimination Format Visualization
const DoubleEliminationVisualization: React.FC = () => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col space-y-4">
        <div className="text-center font-medium">Winners Bracket</div>
        <div className="flex justify-center space-x-8">
          <div className="h-10 w-24 border rounded-md bg-white p-2 text-center">Team 1</div>
          <div className="h-10 w-24 border rounded-md bg-white p-2 text-center">Team 2</div>
        </div>
        
        <div className="text-center font-medium mt-2">Losers Bracket</div>
        <div className="flex justify-center space-x-8">
          <div className="h-10 w-24 border rounded-md bg-white p-2 text-center">Team 3</div>
          <div className="h-10 w-24 border rounded-md bg-white p-2 text-center">Team 4</div>
        </div>
        
        <div className="text-center font-medium mt-2">Final</div>
        <div className="flex justify-center">
          <div className="h-10 w-24 border rounded-md bg-white p-2 text-center">Champion</div>
        </div>
      </div>
      <div className="text-center mt-4 text-sm text-gray-500">
        Teams get a second chance in the losers bracket before elimination
      </div>
    </div>
  );
};

// Group Knockout Format Visualization
const GroupKnockoutVisualization: React.FC = () => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-center font-medium">Group A</div>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Team 1</div>
              <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Team 2</div>
              <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Team 3</div>
            </div>
          </div>
          <div>
            <div className="text-center font-medium">Group B</div>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Team 4</div>
              <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Team 5</div>
              <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Team 6</div>
            </div>
          </div>
        </div>
        
        <div className="text-center font-medium mt-2">Knockout Stage</div>
        <div className="flex justify-center space-x-8">
          <div className="h-10 w-24 border rounded-md bg-white p-2 text-center">A1 vs B2</div>
          <div className="h-10 w-24 border rounded-md bg-white p-2 text-center">B1 vs A2</div>
        </div>
        
        <div className="flex justify-center mt-2">
          <div className="h-10 w-24 border rounded-md bg-white p-2 text-center">Final</div>
        </div>
      </div>
      <div className="text-center mt-4 text-sm text-gray-500">
        Group stage followed by knockout rounds between top teams from each group
      </div>
    </div>
  );
};

// Swiss Format Visualization
const SwissVisualization: React.FC = () => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col space-y-4">
        <div className="text-center font-medium">Round 1</div>
        <div className="flex justify-center space-x-4">
          <div className="h-8 w-32 border rounded-md bg-white p-1 text-center text-sm">Team 1 vs Team 2</div>
          <div className="h-8 w-32 border rounded-md bg-white p-1 text-center text-sm">Team 3 vs Team 4</div>
        </div>
        
        <div className="text-center font-medium">Round 2</div>
        <div className="flex justify-center space-x-4">
          <div className="h-8 w-32 border rounded-md bg-white p-1 text-center text-sm">Winner vs Winner</div>
          <div className="h-8 w-32 border rounded-md bg-white p-1 text-center text-sm">Loser vs Loser</div>
        </div>
        
        <div className="text-center font-medium">Round 3</div>
        <div className="flex justify-center space-x-4">
          <div className="h-8 w-32 border rounded-md bg-white p-1 text-center text-sm">Final Matches</div>
        </div>
      </div>
      <div className="text-center mt-4 text-sm text-gray-500">
        Teams with similar records face each other in successive rounds
      </div>
    </div>
  );
};

// Multi-Stage Format Visualization
const MultiStageVisualization: React.FC = () => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col space-y-4">
        <div className="text-center font-medium">Qualification Stage</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Group A</div>
          <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Group B</div>
          <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Group C</div>
        </div>
        
        <div className="text-center font-medium mt-2">Division Placement</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Division 1</div>
          <div className="h-8 border rounded-md bg-white p-1 text-center text-sm">Division 2</div>
        </div>
        
        <div className="text-center font-medium mt-2">Final Playoffs</div>
        <div className="flex justify-center">
          <div className="h-8 w-32 border rounded-md bg-white p-1 text-center text-sm">Champions</div>
        </div>
      </div>
      <div className="text-center mt-4 text-sm text-gray-500">
        Progressive stages with teams advancing through qualification and playoffs
      </div>
    </div>
  );
};

// Main component that selects the appropriate visualization
const FormatVisualization: React.FC<FormatVisualizationProps> = ({ format }) => {
  switch (format) {
    case 'SINGLE_ELIMINATION':
      return <SingleEliminationVisualization />;
    case 'DOUBLE_ELIMINATION':
      return <DoubleEliminationVisualization />;
    case 'ROUND_ROBIN':
      return <RoundRobinVisualization />;
    case 'GROUP_KNOCKOUT':
      return <GroupKnockoutVisualization />;
    case 'SWISS':
      return <SwissVisualization />;
    case 'MULTI_STAGE':
      return <MultiStageVisualization />;
    default:
      return <SingleEliminationVisualization />;
  }
};

export default FormatVisualization;
