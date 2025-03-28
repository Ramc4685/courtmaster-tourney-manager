
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { 
  PlusCircle, 
  MinusCircle, 
  Check, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournament } from "@/contexts/TournamentContext";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/shared/PageHeader";
import MatchCard from "@/components/shared/MatchCard";
import CourtCard from "@/components/shared/CourtCard";
import { Match } from "@/types/tournament";

const Scoring = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { currentTournament, updateMatchScore, updateMatchStatus, completeMatch } = useTournament();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentSet, setCurrentSet] = useState(0);

  if (!currentTournament) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <p>No tournament selected. Please select a tournament first.</p>
        </div>
      </Layout>
    );
  }

  const inProgressMatches = currentTournament.matches.filter(
    (match) => match.status === "IN_PROGRESS"
  );

  const scheduledMatches = currentTournament.matches.filter(
    (match) => match.status === "SCHEDULED"
  );

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setCurrentSet(match.scores.length > 0 ? match.scores.length - 1 : 0);
  };

  const handleScoreChange = (team: "team1" | "team2", increment: boolean) => {
    if (!selectedMatch) return;

    let currentScore = selectedMatch.scores[currentSet] || { team1Score: 0, team2Score: 0 };
    let updatedScore;
    
    if (team === "team1") {
      updatedScore = increment 
        ? Math.min(30, currentScore.team1Score + 1)
        : Math.max(0, currentScore.team1Score - 1);
      updateMatchScore(selectedMatch.id, updatedScore, currentScore.team2Score);
    } else {
      updatedScore = increment 
        ? Math.min(30, currentScore.team2Score + 1)
        : Math.max(0, currentScore.team2Score - 1);
      updateMatchScore(selectedMatch.id, currentScore.team1Score, updatedScore);
    }
  };

  const handleStartMatch = (match: Match) => {
    updateMatchStatus(match.id, "IN_PROGRESS");
    handleSelectMatch(match);
  };

  const handleCompleteMatch = () => {
    if (!selectedMatch) return;
    completeMatch(selectedMatch.id);
    setSelectedMatch(null);
  };

  const handleNewSet = () => {
    if (!selectedMatch) return;
    const newSetIndex = selectedMatch.scores.length;
    updateMatchScore(selectedMatch.id, 0, 0);
    setCurrentSet(newSetIndex);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Scoring Interface"
          description="Manage live scoring for tournament matches"
        />

        <Tabs defaultValue="live" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="live">Live Scoring</TabsTrigger>
            <TabsTrigger value="courts">Court View</TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Match List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">In Progress</h3>
                {inProgressMatches.length === 0 ? (
                  <p className="text-gray-500">No matches in progress</p>
                ) : (
                  <div className="space-y-3">
                    {inProgressMatches.map((match) => (
                      <div 
                        key={match.id}
                        onClick={() => handleSelectMatch(match)}
                        className={`cursor-pointer ${selectedMatch?.id === match.id ? 'ring-2 ring-court-green' : ''}`}
                      >
                        <MatchCard match={match} mode="compact" />
                      </div>
                    ))}
                  </div>
                )}

                <h3 className="font-semibold text-lg mt-6">Scheduled</h3>
                {scheduledMatches.length === 0 ? (
                  <p className="text-gray-500">No scheduled matches</p>
                ) : (
                  <div className="space-y-3">
                    {scheduledMatches.map((match) => (
                      <div key={match.id} className="flex flex-col">
                        <MatchCard match={match} mode="compact" />
                        <Button 
                          size="sm"
                          className="mt-2 w-full bg-court-green hover:bg-court-green/90"
                          onClick={() => handleStartMatch(match)}
                        >
                          Start Match
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scoring Interface */}
              <div className="md:col-span-2">
                {selectedMatch ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">
                          Scoring: Court {selectedMatch.courtNumber || "Not Assigned"}
                        </h3>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNewSet}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            New Set
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCompleteMatch}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        </div>
                      </div>

                      {/* Set Navigation */}
                      {selectedMatch.scores.length > 1 && (
                        <div className="flex justify-center items-center space-x-2 mb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentSet(Math.max(0, currentSet - 1))}
                            disabled={currentSet === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">
                            Set {currentSet + 1} of {selectedMatch.scores.length}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentSet(Math.min(selectedMatch.scores.length - 1, currentSet + 1))}
                            disabled={currentSet === selectedMatch.scores.length - 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Team 1 Scoring */}
                      <div className="border rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-lg">{selectedMatch.team1.name}</h4>
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-full h-8 w-8"
                              onClick={() => handleScoreChange("team1", false)}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span className="text-3xl font-bold">
                              {selectedMatch.scores[currentSet]?.team1Score || 0}
                            </span>
                            <Button
                              className="bg-court-green hover:bg-court-green/90 rounded-full h-10 w-10"
                              size="icon"
                              onClick={() => handleScoreChange("team1", true)}
                            >
                              <PlusCircle className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Team 2 Scoring */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-lg">{selectedMatch.team2.name}</h4>
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-full h-8 w-8"
                              onClick={() => handleScoreChange("team2", false)}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span className="text-3xl font-bold">
                              {selectedMatch.scores[currentSet]?.team2Score || 0}
                            </span>
                            <Button
                              className="bg-court-green hover:bg-court-green/90 rounded-full h-10 w-10"
                              size="icon"
                              onClick={() => handleScoreChange("team2", true)}
                            >
                              <PlusCircle className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 px-6 py-3">
                      <div className="w-full flex flex-wrap justify-center gap-2">
                        {selectedMatch.scores.map((score, index) => (
                          <div 
                            key={index}
                            className={`px-3 py-1 rounded-full text-sm ${
                              currentSet === index 
                                ? 'bg-court-green text-white' 
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            Set {index + 1}: {score.team1Score}-{score.team2Score}
                          </div>
                        ))}
                      </div>
                    </CardFooter>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] border rounded-lg bg-gray-50">
                    <p className="text-gray-500 mb-3">No match selected</p>
                    <p className="text-gray-500 text-sm max-w-xs text-center">
                      Select a match from the list or start a scheduled match to begin scoring
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courts">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentTournament.courts.map((court) => (
                <CourtCard key={court.id} court={court} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Scoring;
