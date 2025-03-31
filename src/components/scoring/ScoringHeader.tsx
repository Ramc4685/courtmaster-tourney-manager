
import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tournament } from "@/types/tournament";
import { Skeleton } from '@/components/ui/skeleton';

interface ScoringHeaderProps {
  tournament: Tournament;
  onOpenSettings: () => void;
  isPending?: boolean; // Add isPending prop
}

const ScoringHeader: React.FC<ScoringHeaderProps> = ({ 
  tournament, 
  onOpenSettings,
  isPending = false // Default to false
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-4">
      <div className="mr-4">
        <h1 className="text-2xl font-bold mb-1 flex items-center">
          {tournament.name}
          {isPending && (
            <div className="ml-2 inline-flex items-center text-amber-600 text-sm font-normal">
              <span className="animate-pulse rounded-full w-2 h-2 bg-amber-500 mr-1"></span>
              Processing...
            </div>
          )}
        </h1>
        
        {isPending ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <p className="text-gray-500 text-sm">
            {tournament.location} • {new Date(tournament.startDate).toLocaleDateString()}
            {tournament.status && ` • ${tournament.status}`}
          </p>
        )}
      </div>
      <div className="mt-2 md:mt-0">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onOpenSettings}
          className="flex items-center gap-1"
          disabled={isPending}
        >
          <Settings className="h-4 w-4 mr-1" />
          Scoring Settings
        </Button>
      </div>
    </div>
  );
};

export default ScoringHeader;
