
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourtTable from "@/components/court/CourtTable";
import { Court } from "@/types/tournament";

interface CourtsTabProps {
  courts: Court[];
  onCourtUpdate: (court: Court) => void;
  onAddCourtClick: () => void;
}

const CourtsTab: React.FC<CourtsTabProps> = ({
  courts,
  onCourtUpdate,
  onAddCourtClick
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Courts</h2>
        <Button onClick={onAddCourtClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Court
        </Button>
      </div>
      <CourtTable
        courts={courts}
        onCourtUpdate={onCourtUpdate}
      />
    </div>
  );
};

export default CourtsTab;
