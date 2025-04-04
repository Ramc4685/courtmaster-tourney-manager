import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTournament } from "@/contexts/tournament/TournamentContext";
import { Team, Player } from "@/types/tournament";
import { FileUp, AlertCircle, Upload, FileText } from "lucide-react";

interface ImportTeamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportTeams: (teams: Team[]) => void;
  tournamentId: string;
}

const ImportTeamsDialog: React.FC<ImportTeamsDialogProps> = ({
  open,
  onOpenChange,
  onImportTeams,
  tournamentId
}) => {
  const [teamsText, setTeamsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importTab, setImportTab] = useState<'text' | 'json' | 'file'>('text');
  const [delimiter, setDelimiter] = useState<string>(',');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseTeams = (text: string, delimiter: string = ','): Team[] => {
    if (!text.trim()) {
      setError("Please enter team data");
      return [];
    }

    try {
      const lines = text.split('\n').filter(line => line.trim());
      return lines.map((line, index) => {
        const parts = line.split(delimiter).map(part => part.trim());
        if (parts.length < 2) {
          throw new Error(`Line ${index + 1}: Invalid format. Expected at least team name and one player.`);
        }

        const [name, ...playerParts] = parts;
        const players = playerParts.map((playerStr, playerIndex) => {
          const emailMatch = playerStr.match(/<(.+?)>/);
          if (emailMatch) {
            return {
              id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
              name: playerStr.replace(/<.+?>/, '').trim(),
              email: emailMatch[1]
            };
          } else {
            return {
              id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
              name: playerStr
            };
          }
        });

        return {
          id: `imported-team-${index}-${Date.now()}`,
          name,
          players
        };
      });
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  };

  const handleJsonImport = (text: string): Team[] => {
    if (!text.trim()) {
      setError("Please enter JSON data");
      return [];
    }

    try {
      const teams = JSON.parse(text);
      if (!Array.isArray(teams)) {
        throw new Error("JSON must be an array of teams");
      }

      return teams.map((team: any, index: number) => {
        if (!team.name || !Array.isArray(team.players)) {
          throw new Error(`Team at index ${index}: must have a name and players array`);
        }

        const players = team.players.map((player: any, playerIndex: number) => {
          if (typeof player === 'string') {
            return {
              id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
              name: player
            };
          } else if (typeof player === 'object' && player.name) {
            return {
              id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
              name: player.name,
              email: player.email
            };
          } else {
            throw new Error(`Team "${team.name}": invalid player at index ${playerIndex}`);
          }
        });

        return {
          id: `imported-team-${index}-${Date.now()}`,
          name: team.name,
          players
        };
      });
    } catch (e: any) {
      if (e instanceof SyntaxError) {
        setError("Invalid JSON format");
      } else {
        setError(e.message);
      }
      return [];
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTeamsText(content);
      
      if (file.name.endsWith('.csv')) {
        setDelimiter(',');
      } else if (file.name.endsWith('.tsv')) {
        setDelimiter('\t');
      }
      
      if (content.trim().startsWith('[') && content.trim().endsWith(']')) {
        setImportTab('json');
      } else {
        setImportTab('text');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setError(null);
    
    let teams: Team[] = [];
    if (importTab === 'json') {
      teams = handleJsonImport(teamsText);
    } else {
      teams = parseTeams(teamsText, delimiter);
    }
    
    if (teams.length === 0) {
      return;
    }
    
    try {
      onImportTeams(teams);
      
      toast({
        title: "Teams imported",
        description: `Successfully imported ${teams.length} teams with ${teams.reduce((acc, team) => acc + team.players.length, 0)} players`,
      });
      
      setTeamsText("");
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || "Failed to import teams");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Teams</DialogTitle>
          <DialogDescription>
            Bulk import multiple teams and players at once
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue="text" 
          value={importTab} 
          onValueChange={(value: 'text' | 'json' | 'file') => setImportTab(value)}
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="text">CSV/Text</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delimiter">Delimiter</Label>
              <div className="flex space-x-2">
                <Button 
                  variant={delimiter === ',' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setDelimiter(',')}
                >
                  Comma (,)
                </Button>
                <Button 
                  variant={delimiter === '\t' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setDelimiter('\t')}
                >
                  Tab
                </Button>
                <Button 
                  variant={delimiter === ';' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setDelimiter(';')}
                >
                  Semicolon (;)
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="teams-import">
                Enter teams (format: Team Name{delimiter} Player 1{delimiter} Player 2...)
              </Label>
              <Textarea
                id="teams-import"
                placeholder={`Eagle Smashers${delimiter} John Doe${delimiter} Jane Smith\nPhoenix Risers${delimiter} Mike Brown${delimiter} Sarah Lee`}
                value={teamsText}
                onChange={(e) => setTeamsText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Format: Team Name{delimiter} Player 1{delimiter} Player 2{delimiter} etc.</p>
              <p>For emails, use: Team Name{delimiter} Player Name &lt;email@example.com&gt;{delimiter} etc.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-import">
                Enter JSON array of teams
              </Label>
              <Textarea
                id="json-import"
                placeholder={`[\n  {\n    "name": "Eagle Smashers",\n    "players": [\n      {"name": "John Doe", "email": "john@example.com"},\n      {"name": "Jane Smith"}\n    ]\n  }\n]`}
                value={teamsText}
                onChange={(e) => setTeamsText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Provide a JSON array with team objects containing name and players array.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.tsv,.txt,.json"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <FileText className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium mb-1">Upload a file</h3>
              <p className="text-xs text-gray-500 mb-4">
                CSV, TSV, TXT, or JSON formats supported
              </p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Select File
              </Button>
            </div>
            
            {teamsText && (
              <div className="space-y-2">
                <Label>File Content</Label>
                <Textarea
                  value={teamsText}
                  onChange={(e) => setTeamsText(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleImport}>
            <FileUp className="mr-2 h-4 w-4" /> Import Teams
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTeamsDialog;