import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTournament } from "@/contexts/tournament/useTournament";
import { Team, Player } from "@/types/tournament";
import { FileUp, AlertCircle, Upload, FileText, Check, X, Download, Table } from "lucide-react";
import { parseCSVFile, parseExcelFile, validateTeamData, generateCSVTemplate } from "@/utils/import-export/csvUtils";
import { ImportFormat, ImportValidationResult, TeamImportData, ImportTemplateType } from "@/types/import-export";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { teamService } from "@/services/tournament/TeamService";

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
  const [importTab, setImportTab] = useState<'text' | 'json' | 'file' | 'preview'>('text');
  const [delimiter, setDelimiter] = useState<string>(',');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<ImportFormat>(ImportFormat.CSV);
  const [validationResult, setValidationResult] = useState<ImportValidationResult<TeamImportData> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importComplete, setImportComplete] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { importTeams } = useTournament();

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
              email: emailMatch[1],
              createdAt: new Date(),
              updatedAt: new Date()
            } as Player;
          } else {
            return {
              id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
              name: playerStr,
              createdAt: new Date(),
              updatedAt: new Date()
            } as Player;
          }
        });

        return {
          id: `imported-team-${index}-${Date.now()}`,
          name,
          players,
          division: 'OPEN' as any, // Default division, can be changed later
          createdAt: new Date(),
          updatedAt: new Date()
        } as Team;
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
              name: player,
              createdAt: new Date(),
              updatedAt: new Date()
            } as Player;
          } else if (typeof player === 'object' && player.name) {
            return {
              id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
              name: player.name,
              email: player.email,
              createdAt: new Date(),
              updatedAt: new Date()
            } as Player;
          } else {
            throw new Error(`Team "${team.name}": invalid player at index ${playerIndex}`);
          }
        });

        return {
          id: `imported-team-${index}-${Date.now()}`,
          name: team.name,
          players,
          division: team.division || 'OPEN',
          createdAt: new Date(),
          updatedAt: new Date()
        } as Team;
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

  // Function to handle modern file upload using csvUtils
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setIsLoading(true);
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      setUploadedFile(file);
      
      let parseResult;
      if (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
        setImportFormat(ImportFormat.CSV);
        parseResult = await parseCSVFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFormat(ImportFormat.EXCEL);
        parseResult = await parseExcelFile(file);
      } else if (file.name.endsWith('.json')) {
        setImportFormat(ImportFormat.JSON);
        const reader = new FileReader();
        const content = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
        setTeamsText(content);
        setImportTab('json');
        setIsLoading(false);
        return;
      } else {
        throw new Error('Unsupported file format. Please upload CSV, Excel, or JSON files.');
      }
      
      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse file');
      }
      
      // Show preview of parsed data
      const validation = validateTeamData(parseResult.data);
      setValidationResult(validation);
      setImportTab('preview');
    } catch (e: any) {
      setError(e.message || 'File upload failed');
      setImportTab('file'); // Stay on file tab to show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setError(null);
    setIsLoading(true);
    setImportProgress(0);
    
    try {
      let teams: Team[] = [];
      
      // Handle import based on tab and validation state
      if (importTab === 'preview' && validationResult) {
        if (!validationResult.isValid) {
          setError(`Please fix validation errors: ${validationResult.invalidItems.length} invalid items found`);
          return;
        }
        
        // Convert valid items to Team objects
        teams = validationResult.validItems.map((item, index) => ({
          id: `imported-team-${index}-${Date.now()}`,
          name: item.name,
          division: item.division,
          players: item.players.map((player, playerIndex) => ({
            id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
            name: player.name,
            email: player.email,
            phone: player.phone,
            createdAt: new Date(),
            updatedAt: new Date()
          } as Player)),
          createdAt: new Date(),
          updatedAt: new Date()
        } as Team));
      } else if (importTab === 'json') {
        teams = handleJsonImport(teamsText);
      } else {
        teams = parseTeams(teamsText, delimiter);
      }
      
      if (teams.length === 0) {
        setError("No valid teams found to import");
        setIsLoading(false);
        return;
      }
      
      // Use TeamService for bulk import
      await teamService.createTeamsInBulk(tournamentId, teams as any); 
      
      // Update the UI with progress
      setImportProgress(100);
      setImportComplete(true);
      
      // Call the provided callback
      onImportTeams(teams);
      
      toast({
        title: "Teams imported",
        description: `Successfully imported ${teams.length} teams with ${teams.reduce((acc, team) => acc + team.players.length, 0)} players`,
      });
      
      setTimeout(() => {
        setTeamsText("");
        setValidationResult(null);
        setImportComplete(false);
        onOpenChange(false);
      }, 1500);
      
    } catch (e: any) {
      setError(e.message || "Failed to import teams");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to download a template
  const handleDownloadTemplate = () => {
    try {
      const template = generateCSVTemplate(ImportTemplateType.TEAMS);
      const url = URL.createObjectURL(template);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'team_import_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Template Downloaded",
        description: "CSV template for team import has been downloaded."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not generate template. Please try again."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Teams</DialogTitle>
          <DialogDescription>
            Bulk import multiple teams and players at once
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue="text" 
          value={importTab} 
          onValueChange={(value: string) => {
            // Only allow switching away from preview if not loading
            if (isLoading && value !== 'preview') return;
            setImportTab(value as any);
          }}
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="text" disabled={isLoading}>CSV/Text</TabsTrigger>
            <TabsTrigger value="json" disabled={isLoading}>JSON</TabsTrigger>
            <TabsTrigger value="file" disabled={isLoading}>File Upload</TabsTrigger>
            <TabsTrigger value="preview" disabled={!validationResult}>Preview</TabsTrigger>
          </TabsList>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* CSV/Text Tab */}
          <TabsContent value="text" className="space-y-4">
            <div className="flex justify-between items-center">
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" /> Download Template
              </Button>
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
          
          {/* JSON Tab */}
          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-import">
                Enter JSON array of teams
              </Label>
              <Textarea
                id="json-import"
                placeholder={`[\n  {\n    "name": "Eagle Smashers",\n    "division": "ADVANCED",\n    "players": [\n      {"name": "John Doe", "email": "john@example.com"},\n      {"name": "Jane Smith"}\n    ]\n  }\n]`}
                value={teamsText}
                onChange={(e) => setTeamsText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Provide a JSON array with team objects containing name, optional division, and players array.</p>
            </div>
          </TabsContent>
          
          {/* File Upload Tab */}
          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.tsv,.txt,.json,.xlsx,.xls"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
                disabled={isLoading}
              />
              {isLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-2"></div>
                  <h3 className="text-sm font-medium">Processing file...</h3>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center justify-center">
                  <FileText className="h-10 w-10 text-green-500 mb-2" />
                  <h3 className="text-sm font-medium">{uploadedFile.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{Math.round(uploadedFile.size / 1024)} KB</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <>
                  <FileText className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <h3 className="text-sm font-medium mb-1">Upload a file</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    CSV, Excel, or JSON formats supported
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Select File
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDownloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" /> Get Template
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            {validationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span>Import Preview</span>
                    <div className="flex gap-2">
                      <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                        {validationResult.isValid ? "Valid" : "Validation Errors"}
                      </Badge>
                      <Badge variant="outline">
                        {validationResult.summary.valid} of {validationResult.summary.total} valid
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {validationResult.validItems.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Valid Teams ({validationResult.validItems.length})</h3>
                      <div className="border rounded-md max-h-60 overflow-auto">
                        <UITable>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Team Name</TableHead>
                              <TableHead>Division</TableHead>
                              <TableHead>Players</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {validationResult.validItems.slice(0, 10).map((team, index) => (
                              <TableRow key={index}>
                                <TableCell>{team.name}</TableCell>
                                <TableCell>{team.division || "Not specified"}</TableCell>
                                <TableCell>
                                  {team.players.map(player => player.name).join(', ')}
                                </TableCell>
                              </TableRow>
                            ))}
                            {validationResult.validItems.length > 10 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                                  +{validationResult.validItems.length - 10} more teams
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </UITable>
                      </div>
                    </div>
                  )}

                  {validationResult.invalidItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-500 mb-2">
                        Invalid Items ({validationResult.invalidItems.length})
                      </h3>
                      <div className="border border-red-200 rounded-md max-h-60 overflow-auto">
                        <UITable>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Errors</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {validationResult.invalidItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.row}</TableCell>
                                <TableCell>
                                  <code className="text-xs">
                                    {JSON.stringify(item.data).substring(0, 50)}
                                    {JSON.stringify(item.data).length > 50 ? '...' : ''}
                                  </code>
                                </TableCell>
                                <TableCell className="text-red-500">
                                  {item.errors.join(', ')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </UITable>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-full max-w-xs">
                  <Progress value={importProgress} className="h-2" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {importComplete ? 'Import completed!' : 'Processing import...'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {importComplete ? 'Close' : 'Cancel'}
          </Button>
          
          {importTab === 'preview' ? (
            <Button 
              type="button" 
              onClick={handleImport} 
              disabled={isLoading || (validationResult && !validationResult.isValid)}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : importComplete ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Imported
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" /> Import {validationResult?.validItems.length || 0} Teams
                </>
              )}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={() => {
                const hasData = importTab === 'json' || importTab === 'text' ? teamsText.trim().length > 0 : !!uploadedFile;
                if (importTab === 'text' || importTab === 'json') {
                  handleImport();
                } else if (hasData) {
                  setError(null);
                  fileInputRef.current?.click();
                } else {
                  setError('Please select a file or enter team data');
                }
              }}
              disabled={isLoading}
            >
              {importTab === 'file' ? (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload & Preview
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" /> Import Teams
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTeamsDialog;
