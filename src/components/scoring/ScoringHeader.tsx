
import React from "react";
import { Link } from "react-router-dom";
import { Settings, Award, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";

interface ScoringHeaderProps {
  onSettingsOpen: () => void;
  tournamentId?: string;
  inProgressMatchesCount?: number;
}

const ScoringHeader: React.FC<ScoringHeaderProps> = ({ 
  onSettingsOpen, 
  tournamentId,
  inProgressMatchesCount = 0
}) => {
  return (
    <div className="flex justify-between items-center">
      <PageHeader
        title="Scoring Interface"
        description="Manage live scoring for tournament matches"
      />
      <div className="flex gap-2">
        {inProgressMatchesCount > 0 && (
          <Badge variant="success" className="h-6 flex items-center mr-2">
            {inProgressMatchesCount} match{inProgressMatchesCount !== 1 ? 'es' : ''} in progress
          </Badge>
        )}
        
        {tournamentId && (
          <>
            <Button variant="outline" asChild>
              <Link to={`/tournaments/${tournamentId}`}>
                <Award className="h-4 w-4 mr-2" />
                View Brackets
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to={`/public/${tournamentId}`}>
                <Radio className="h-4 w-4 mr-2" />
                Live View
              </Link>
            </Button>
          </>
        )}
        
        <Button variant="outline" onClick={onSettingsOpen}>
          <Settings className="h-4 w-4 mr-2" />
          Scoring Settings
        </Button>
      </div>
    </div>
  );
};

export default ScoringHeader;
