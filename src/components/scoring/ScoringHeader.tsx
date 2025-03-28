
import React from "react";
import { Link } from "react-router-dom";
import { Settings, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";

interface ScoringHeaderProps {
  onSettingsOpen: () => void;
  tournamentId?: string;
}

const ScoringHeader: React.FC<ScoringHeaderProps> = ({ onSettingsOpen, tournamentId }) => {
  return (
    <div className="flex justify-between items-center">
      <PageHeader
        title="Scoring Interface"
        description="Manage live scoring for tournament matches"
      />
      <div className="flex gap-2">
        {tournamentId && (
          <Button variant="outline" asChild>
            <Link to={`/tournaments/${tournamentId}`}>
              <Award className="h-4 w-4 mr-2" />
              View Brackets
            </Link>
          </Button>
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
