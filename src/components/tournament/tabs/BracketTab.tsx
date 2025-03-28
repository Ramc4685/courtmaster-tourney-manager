
import React from "react";
import TournamentBracket from "@/components/tournament/TournamentBracket";
import { Tournament } from "@/types/tournament";

interface BracketTabProps {
  tournament: Tournament;
}

const BracketTab: React.FC<BracketTabProps> = ({ tournament }) => {
  return (
    <div className="overflow-x-auto">
      <TournamentBracket tournament={tournament} />
    </div>
  );
};

export default BracketTab;
