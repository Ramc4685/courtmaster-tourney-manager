
import React, { useState } from 'react';
import { Match } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Plus, TrophyIcon, ChevronUp, ChevronDown, Edit2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MatchViewProps {
  match: Match | null;
  currentSet: number;
  setCurrentSet: (set: number) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
  onScoreChange: (team1Score: number, team2Score: number) => void;
  isPending?: boolean;
  scorerName: string;
  onScorerNameChange: (name: string) => void;
  onCourtChange: (courtNumber: number) => void;
}

const MatchView: React.FC<MatchViewProps> = ({ 
  match, 
  currentSet,
  setCurrentSet,
  onNewSet,
  onCompleteMatch,
  onScoreChange,
  isPending = false,
  scorerName,
  onScorerNameChange,
  onCourtChange
}) => {
  const [team1Score, setTeam1Score] = useState<number>(match?.scores[currentSet]?.team1Score || 0);
  const [team2Score, setTeam2Score] = useState<number>(match?.scores[currentSet]?.team2Score || 0);
  const [courtNumberEditable, setCourtNumberEditable] = useState(false);
  const [editedCourtNumber, setEditedCourtNumber] = useState(match?.courtNumber || 0);
  
  if (!match) return null;

  // Calculate wins for each team
  const team1Wins = match.scores.filter(set => set.team1Score > set.team2Score).length;
  const team2Wins = match.scores.filter(set => set.team2Score > set.team1Score).length;
  
  const handleTeam1ScoreChange = (amount: number) => {
    const newScore = Math.max(0, team1Score + amount);
    setTeam1Score(newScore);
    onScoreChange(newScore, team2Score);
  };

  const handleTeam2ScoreChange = (amount: number) => {
    const newScore = Math.max(0, team2Score + amount);
    setTeam2Score(newScore);
    onScoreChange(team1Score, newScore);
  };

  const handleSetChange = (index: number) => {
    setCurrentSet(index);
    setTeam1Score(match.scores[index]?.team1Score || 0);
    setTeam2Score(match.scores[index]?.team2Score || 0);
  };

  const handleAddNewSet = () => {
    onNewSet();
    const newSetIndex = match.scores.length;
    setCurrentSet(newSetIndex);
    setTeam1Score(0);
    setTeam2Score(0);
  };

  const handleCourtNumberChange = () => {
    setCourtNumberEditable(false);
    if (editedCourtNumber !== match.courtNumber) {
      onCourtChange(editedCourtNumber);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {match.team1.name} vs {match.team2.name}
          </CardTitle>
          <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2">
            <div>Status: <span className="font-medium">{match.status}</span></div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center">
              Court: 
              {courtNumberEditable ? (
                <div className="flex items-center ml-1">
                  <Input
                    type="number"
                    value={editedCourtNumber}
                    onChange={(e) => setEditedCourtNumber(parseInt(e.target.value) || 0)}
                    className="w-16 h-8 mx-2"
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCourtNumberChange}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <span className="font-medium ml-1">
                  {match.courtNumber || 'Not assigned'}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={() => setCourtNumberEditable(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="scorerName">Scorer Name</Label>
                <Input
                  id="scorerName"
                  placeholder="Enter your name"
                  value={scorerName}
                  onChange={(e) => onScorerNameChange(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Tabs 
              value={`set-${currentSet}`} 
              className="w-full"
              onValueChange={(val) => {
                const setIndex = parseInt(val.replace('set-', ''));
                handleSetChange(setIndex);
              }}
            >
              <div className="flex items-center justify-between">
                <TabsList>
                  {match.scores.map((_, index) => (
                    <TabsTrigger key={`set-${index}`} value={`set-${index}`}>Set {index + 1}</TabsTrigger>
                  ))}
                </TabsList>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddNewSet}
                  disabled={match.status === 'COMPLETED'}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Set
                </Button>
              </div>
              
              {match.scores.map((_, index) => (
                <TabsContent key={`content-${index}`} value={`set-${index}`} className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Team 1 Scoring */}
                    <div className="border rounded-lg p-4">
                      <div className="text-lg font-medium mb-2">{match.team1.name}</div>
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleTeam1ScoreChange(-1)}
                          disabled={team1Score <= 0 || match.status === 'COMPLETED'}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <span className="text-3xl font-bold">{team1Score}</span>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleTeam1ScoreChange(1)}
                          disabled={match.status === 'COMPLETED'}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center mt-2">Wins: {team1Wins}</div>
                    </div>
                    
                    {/* Team 2 Scoring */}
                    <div className="border rounded-lg p-4">
                      <div className="text-lg font-medium mb-2">{match.team2.name}</div>
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleTeam2ScoreChange(-1)}
                          disabled={team2Score <= 0 || match.status === 'COMPLETED'}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <span className="text-3xl font-bold">{team2Score}</span>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleTeam2ScoreChange(1)}
                          disabled={match.status === 'COMPLETED'}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center mt-2">Wins: {team2Wins}</div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <Separator />
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={match.status === 'COMPLETED'}
                onClick={handleAddNewSet}
              >
                <Plus className="h-4 w-4 mr-2" /> New Set
              </Button>
              
              <Button
                onClick={onCompleteMatch}
                disabled={match.status === 'COMPLETED' || isPending}
              >
                <TrophyIcon className="h-4 w-4 mr-2" /> Complete Match
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Match Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p>{match.category?.name || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stage</p>
                <p>{match.stage || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Start Time</p>
                <p>{match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'Not scheduled'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Time</p>
                <p>{match.endTime ? new Date(match.endTime).toLocaleString() : 'Not completed'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchView;
