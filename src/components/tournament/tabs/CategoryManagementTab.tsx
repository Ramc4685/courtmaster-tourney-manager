import { useState } from 'react';
import { Tournament, Team, TournamentCategory } from '@/types/tournament';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, UserPlus } from 'lucide-react';

interface CategoryManagementTabProps {
  tournament: Tournament;
  onAddTeamToCategory: (categoryId: string, team: Team) => void;
  onRemoveTeamFromCategory: (categoryId: string, teamId: string) => void;
}

export default function CategoryManagementTab({
  tournament,
  onAddTeamToCategory,
  onRemoveTeamFromCategory
}: CategoryManagementTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const currentCategory = tournament.categories.find(c => c.id === selectedCategory);
  const teamsInCategory = currentCategory ? tournament.teams.filter(team => 
    team.categories?.includes(currentCategory.id)
  ) : [];

  const availableTeams = tournament.teams.filter(team => 
    !team.categories?.includes(selectedCategory)
  );

  const handleAddTeam = (teamId: string) => {
    const team = tournament.teams.find(t => t.id === teamId);
    if (team && selectedCategory) {
      onAddTeamToCategory(selectedCategory, team);
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    if (selectedCategory) {
      onRemoveTeamFromCategory(selectedCategory, teamId);
    }
  };

  if (!tournament.categories.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No categories found in this tournament.</p>
        <p className="mt-2">Add categories in the tournament settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {tournament.categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} ({category.division})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teams in Category */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Teams in {currentCategory?.name}</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamsInCategory.map(team => (
                    <TableRow key={team.id}>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.players?.map(p => p.name).join(', ')}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveTeam(team.id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!teamsInCategory.length && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No teams in this category
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Available Teams */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Available Teams</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableTeams.map(team => (
                    <TableRow key={team.id}>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.players?.map(p => p.name).join(', ')}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTeam(team.id)}
                        >
                          Add to Category
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!availableTeams.length && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No available teams to add
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 