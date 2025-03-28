import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  PlusCircle, 
  MinusCircle, 
  Check, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTournament } from "@/contexts/TournamentContext";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/shared/PageHeader";
import MatchCard from "@/components/shared/MatchCard";
import CourtCard from "@/components/shared/CourtCard";
import ScoringSettings from "@/components/scoring/ScoringSettings";
import CourtSelectionPanel from "@/components/scoring/CourtSelectionPanel";
import { Match, Court, ScoringSettings as ScoringSettingsType } from "@/types/tournament";
import { useToast } from "@/hooks/use-toast";
import { isSetComplete, isMatchComplete, getDefaultScoringSettings } from "@/utils/matchUtils";

const Scoring = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { currentTournament, updateMatchScore, updateMatchStatus, completeMatch, updateTournament } = useTournament();
  const { toast } = useToast();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"courts" | "scoring">("courts");
  
  // Get scoring settings from tournament or use defaults
  const [scoringSettings, setScoringSettings] = useState<ScoringSettingsType>(
    currentTournament?.scoringSettings || getDefaultScoringSettings()
  );
  
  // Update scoring settings when tournament changes
  useEffect(() => {
    if (currentTournament?.scoringSettings) {
      setScoringSettings(currentTournament.scoringSettings);
    }
  }, [currentTournament]);
  
  // Confirmation dialogs
  const [newSetDialogOpen, setNewSetDialogOpen] = useState(false);
  const [completeMatchDialogOpen, setCompleteMatchDialogOpen] = useState(false);

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
    setActiveView("scoring");
  };

  const handleSelectCourt = (court: Court) => {
    setSelectedCourt(court);
    if (court.currentMatch) {
      handleSelectMatch(court.currentMatch);
    }
  };

  const handleScoreChange = (team: "team1" | "team2", increment: boolean) => {
    if (!selectedMatch) return;

    // Make sure we have the latest match from context
    const latestMatch = currentTournament.matches.find(m => m.id === selectedMatch.id);
    if (!latestMatch) return;

    let scores = [...latestMatch.scores];
    if (scores.length === 0) {
      scores = [{ team1Score: 0, team2Score: 0 }];
    }
    
    let currentScore = scores[currentSet] || { team1Score: 0, team2Score: 0 };
    let updatedScore;
    
    if (team === "team1") {
      updatedScore = increment 
        ? Math.min(scoringSettings.maxPoints + 10, currentScore.team1Score + 1) // Allow going beyond maxPoints for win by 2
        : Math.max(0, currentScore.team1Score - 1);
      
      updateMatchScore(selectedMatch.id, updatedScore, currentScore.team2Score);
    } else {
      updatedScore = increment 
        ? Math.min(scoringSettings.maxPoints + 10, currentScore.team2Score + 1) // Allow going beyond maxPoints for win by 2
        : Math.max(0, currentScore.team2Score - 1);
      
      updateMatchScore(selectedMatch.id, currentScore.team1Score, updatedScore);
    }

    // Update our local selected match to reflect the new score
    const updatedMatch = {
      ...selectedMatch,
      scores: selectedMatch.scores.map((s, idx) => 
        idx === currentSet 
          ? team === "team1" 
            ? { ...s, team1Score: updatedScore } 
            : { ...s, team2Score: updatedScore }
          : s
      )
    };
    setSelectedMatch(updatedMatch);

    // Check if this set is complete based on badminton rules
    const updatedCurrentScore = {
      team1Score: team === "team1" ? updatedScore : currentScore.team1Score,
      team2Score: team === "team2" ? updatedScore : currentScore.team2Score
    };
    
    // Check if set is complete according to badminton rules
    if (isSetComplete(updatedCurrentScore.team1Score, updatedCurrentScore.team2Score, scoringSettings)) {
      // Check if match is complete (e.g., best of 3 sets with 2 sets won)
      if (isMatchComplete(updatedMatch, scoringSettings)) {
        setCompleteMatchDialogOpen(true);
      } else {
        // Ask for confirmation to start a new set
        setNewSetDialogOpen(true);
      }
    }
  };

  const handleStartMatch = (match: Match) => {
    updateMatchStatus(match.id, "IN_PROGRESS");
    handleSelectMatch(match);
    toast({
      title: "Match started",
      description: "The match has been started and is now in progress."
    });
  };

  const handleCompleteMatch = () => {
    if (!selectedMatch) return;
    completeMatch(selectedMatch.id);
    toast({
      title: "Match completed",
      description: "The match has been marked as complete."
    });
    setSelectedMatch(null);
    setActiveView("courts");
  };

  const handleNewSet = () => {
    if (!selectedMatch) return;
    const newSetIndex = selectedMatch.scores.length;
    
    if (newSetIndex >= scoringSettings.maxSets) {
      toast({
        title: "Maximum sets reached",
        description: `This match is limited to ${scoringSettings.maxSets} sets.`
      });
      return;
    }
    
    updateMatchScore(selectedMatch.id, 0, 0);
    
    // Update our local selected match to reflect the new set
    const updatedMatch = {
      ...selectedMatch,
      scores: [...selectedMatch.scores, { team1Score: 0, team2Score: 0 }]
    };
    setSelectedMatch(updatedMatch);
    
    setCurrentSet(newSetIndex);
    toast({
      title: "New set started",
      description: `Set ${newSetIndex + 1} has been started.`
    });
  };
  
  const handleUpdateScoringSettings = (newSettings: ScoringSettingsType) => {
    // Update local state
    setScoringSettings(newSettings);
    
    // Update tournament settings
    if (currentTournament) {
      const updatedTournament = {
        ...currentTournament,
        scoringSettings: newSettings,
        updatedAt: new Date()
      };
      updateTournament(updatedTournament);
    }
  };

  const handleBackToCourts = () => {
    setActiveView("courts");
  };

  // Determine the winner information for the confirmation dialog
  const getSetWinnerInfo = () => {
    if (!selectedMatch) return { team: "", score: "" };
    
    const currentScores = selectedMatch.scores[currentSet];
    if (!currentScores) return { team: "", score: "" };
    
    const winningTeam = currentScores.team1Score > currentScores.team2Score ? 
      selectedMatch.team1.name : selectedMatch.team2.name;
    
    const score = `${currentScores.team1Score}-${currentScores.team2Score}`;
    
    return { team: winningTeam, score };
  };

  // Determine the match winner information for the confirmation dialog
  const getMatchWinnerInfo = () => {
    if (!selectedMatch) return { team: "", sets: "" };
    
    const team1Sets = selectedMatch.scores.filter(s => s.team1Score > s.team2Score).length;
    const team2Sets = selectedMatch.scores.filter(s => s.team2Score > s.team1Score).length;
    
    const winningTeam = team1Sets > team2Sets ? selectedMatch.team1.name : selectedMatch.team2.name;
    const sets = `${team1Sets}-${team2Sets}`;
    
    return { team: winningTeam, sets };
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Scoring Interface"
            description="Manage live scoring for tournament matches"
          />
          <Button variant="outline" onClick={() => setSettingsOpen(true)} className="mr-2">
            <Settings className="h-4 w-4 mr-2" />
            Scoring Settings
          </Button>
        </div>

        {activeView === "courts" ? (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Select a Court</h2>
            <CourtSelectionPanel 
              courts={currentTournament.courts}
              onCourtSelect={handleSelectCourt}
              onMatchStart={handleSelectMatch}
            />
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Scheduled Matches</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledMatches.length === 0 ? (
                  <p className="text-gray-500">No scheduled matches available</p>
                ) : (
                  scheduledMatches.map((match) => (
                    <Card key={match.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <MatchCard match={match} mode="compact" />
                      </CardContent>
                      <CardFooter className="bg-gray-50 px-4 py-3 flex justify-end">
                        <Button 
                          size="sm"
                          className="bg-court-green hover:bg-court-green/90"
                          onClick={() => handleStartMatch(match)}
                        >
                          Start Match
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <Button 
              variant="outline" 
              className="mb-4" 
              onClick={handleBackToCourts}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Courts
            </Button>
            
            {selectedMatch && (
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
                        onClick={() => setNewSetDialogOpen(true)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        New Set
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompleteMatchDialogOpen(true)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </div>

                  {/* Match Teams */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="font-medium">{selectedMatch.team1.name}</div>
                    <div className="text-sm text-gray-500">vs</div>
                    <div className="font-medium text-right">{selectedMatch.team2.name}</div>
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
            )}
          </div>
        )}
      </div>

      {/* Scoring Settings Dialog */}
      <ScoringSettings 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        settings={scoringSettings}
        onSettingsChange={handleUpdateScoringSettings}
        title="Badminton Scoring Settings"
        description="Configure badminton match scoring rules"
      />

      {/* New Set Confirmation Dialog */}
      <AlertDialog open={newSetDialogOpen} onOpenChange={setNewSetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Current Set?</AlertDialogTitle>
            <AlertDialogDescription>
              {getSetWinnerInfo().team} has won the set with a score of {getSetWinnerInfo().score}. 
              Do you want to end this set and start a new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNewSet}>Yes, End Set</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Match Confirmation Dialog */}
      <AlertDialog open={completeMatchDialogOpen} onOpenChange={setCompleteMatchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Complete Match?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getMatchWinnerInfo().team} has won the match {getMatchWinnerInfo().sets} sets. 
              Are you sure you want to mark this match as complete? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteMatch}>Yes, Complete Match</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Scoring;
