
import React from 'react';
import { Tournament, Match, TournamentCategory, TournamentFormat } from '@/types/tournament';

export interface CategoryTabsProps {
  tournament: Tournament;
  updateMatch?: (match: Match) => void;
  assignCourt?: (matchId: string, courtId: string) => void;
  loadCategoryDemoData?: (tournamentId: string, categoryId: string, format: TournamentFormat) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  tournament,
  updateMatch,
  assignCourt,
  loadCategoryDemoData
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Categories</h2>
      {tournament.categories.length === 0 ? (
        <div className="p-4 border rounded-md bg-muted/20">
          <p className="text-center text-muted-foreground">
            No categories have been added to this tournament yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {tournament.categories.map(category => (
            <div key={category.id} className="p-4 border rounded-md">
              <h3 className="text-xl font-semibold">{category.name}</h3>
              <p className="text-muted-foreground">{category.type}</p>
              
              {/* Show matches for this category */}
              <div className="mt-4">
                <h4 className="font-medium">Matches</h4>
                {tournament.matches.filter(m => m.category?.id === category.id).length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {tournament.matches
                      .filter(m => m.category?.id === category.id)
                      .map(match => (
                        <li key={match.id} className="p-2 border rounded">
                          {match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'} - {match.status}
                        </li>
                      ))
                    }
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    No matches in this category yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTabs;
