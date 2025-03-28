
import React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";

interface ScoringHeaderProps {
  onSettingsOpen: () => void;
}

const ScoringHeader: React.FC<ScoringHeaderProps> = ({ onSettingsOpen }) => {
  return (
    <div className="flex justify-between items-center">
      <PageHeader
        title="Scoring Interface"
        description="Manage live scoring for tournament matches"
      />
      <Button variant="outline" onClick={onSettingsOpen} className="mr-2">
        <Settings className="h-4 w-4 mr-2" />
        Scoring Settings
      </Button>
    </div>
  );
};

export default ScoringHeader;
