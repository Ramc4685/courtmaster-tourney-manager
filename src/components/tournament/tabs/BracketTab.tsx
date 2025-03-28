
import React from "react";
import TournamentBracket from "@/components/tournament/TournamentBracket";
import { Tournament } from "@/types/tournament";

interface BracketTabProps {
  tournament: Tournament;
}

const BracketTab: React.FC<BracketTabProps> = ({ tournament }) => {
  return (
    <div className="overflow-x-auto w-full">
      <div className="min-w-[1000px]">
        <TournamentBracket tournament={tournament} />
      </div>
    </div>
  );
};

export default BracketTab;
