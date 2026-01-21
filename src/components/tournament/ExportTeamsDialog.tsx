import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Team } from '@/types/tournament';
import { FileDown, Check, Download, FileText, FileSpreadsheet, Table, X } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ImportFormat } from '@/types/import-export';
import { exportTeamsToCSV, exportTeamsToExcel, downloadFile } from '@/utils/import-export/csvUtils';
import { Division } from '@/types/tournament-enums';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExportTeamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: Team[];
  tournamentId: string;
  divisions?: Record<string, string>; // Division ID to name mapping
}

const ExportTeamsDialog: React.FC<ExportTeamsDialogProps> = ({
  open,
  onOpenChange,
  teams,
  tournamentId,
  divisions = {}
}) => {
  const [format, setFormat] = useState<ImportFormat>(ImportFormat.CSV);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);
    
    try {
      // Filter teams by division if selected
      let filteredTeams = [...teams];
      if (selectedDivision !== 'all') {
        filteredTeams = teams.filter(team => 
          team.division === selectedDivision
          // Note: divisionId removed as it doesn't exist in Team type
        );
      }

      // Get tournament name for filename (fallback to current date)
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `teams_export_${timestamp}`;

      // Export based on selected format
      if (format === ImportFormat.CSV) {
        // Convert Team objects to compatible format for exportTeamsToCSV
        const convertedTeams = filteredTeams.map(team => ({
          id: team.id,
          name: team.name,
          division: team.division,
          players: team.players.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            teamId: team.id,
            team_id: team.id,
            createdAt: p.createdAt,
            created_at: p.createdAt,
            updatedAt: p.updatedAt,
            updated_at: p.updatedAt
          })),
          tournamentId: tournamentId,
          tournament_id: tournamentId,
          createdAt: team.createdAt,
          created_at: team.createdAt,
          updatedAt: team.updatedAt,
          updated_at: team.updatedAt
        }));
        const csvData = exportTeamsToCSV(convertedTeams);
        downloadFile(csvData, `${filename}.csv`);
      } else if (format === ImportFormat.EXCEL) {
        // Convert Team objects to compatible format for exportTeamsToExcel
        const convertedTeams = filteredTeams.map(team => ({
          id: team.id,
          name: team.name,
          division: team.division,
          players: team.players.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            teamId: team.id,
            team_id: team.id,
            createdAt: p.createdAt,
            created_at: p.createdAt,
            updatedAt: p.updatedAt,
            updated_at: p.updatedAt
          })),
          tournamentId: tournamentId,
          tournament_id: tournamentId,
          createdAt: team.createdAt,
          created_at: team.createdAt,
          updatedAt: team.updatedAt,
          updated_at: team.updatedAt
        }));
        const excelBlob = await exportTeamsToExcel(convertedTeams);
        downloadFile(excelBlob, `${filename}.xlsx`);
      } else if (format === ImportFormat.JSON) {
        // Create simplified JSON structure for export
        const jsonData = filteredTeams.map(team => ({
          name: team.name,
          division: team.division,
          players: team.players.map(player => ({
            name: player.name,
            email: player.email,
            phone: player.phone
          }))
        }));
        const jsonString = JSON.stringify(jsonData, null, 2);
        downloadFile(jsonString, `${filename}.json`);
      }
      
      setExportComplete(true);
      toast({
        title: "Export Successful",
        description: `${filteredTeams.length} teams exported successfully`
      });
      
      // Auto-close after a short delay
      setTimeout(() => {
        if (exportComplete) {
          onOpenChange(false);
          setExportComplete(false);
        }
      }, 1500);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message || "Failed to export teams"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Get unique divisions from teams
  const uniqueDivisions = React.useMemo(() => {
    const divisionSet = new Set<string>();
    teams.forEach(team => {
      if (team.division) {
        divisionSet.add(team.division);
      }
      // Note: divisionId reference removed as it doesn't exist in Team type
    });
    return Array.from(divisionSet);
  }, [teams, divisions]);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isExporting) {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Teams</DialogTitle>
          <DialogDescription>
            Export {teams.length} teams to CSV, Excel, or JSON format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup 
              value={format} 
              onValueChange={(val) => setFormat(val as ImportFormat)} 
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value={ImportFormat.CSV} id="csv" className="peer sr-only" />
                <Label 
                  htmlFor="csv" 
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <FileText className="mb-2 h-6 w-6" />
                  <span>CSV</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem value={ImportFormat.EXCEL} id="excel" className="peer sr-only" />
                <Label 
                  htmlFor="excel" 
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <FileSpreadsheet className="mb-2 h-6 w-6" />
                  <span>Excel</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem value={ImportFormat.JSON} id="json" className="peer sr-only" />
                <Label 
                  htmlFor="json" 
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Table className="mb-2 h-6 w-6" />
                  <span>JSON</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Division Filter */}
          {uniqueDivisions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="division">Filter by Division</Label>
              <Select 
                value={selectedDivision} 
                onValueChange={setSelectedDivision}
              >
                <SelectTrigger id="division">
                  <SelectValue placeholder="Select a division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {uniqueDivisions.map(div => (
                    <SelectItem 
                      key={div} 
                      value={div}
                    >
                      {/* Show division name if available, otherwise show ID */}
                      {divisions[div] || Division[div as keyof typeof Division] || div}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Teams to export:
                </span>
                <span className="font-medium">
                  {selectedDivision === 'all' 
                    ? teams.length 
                    : teams.filter(team => 
                        team.division === selectedDivision || 
                        team.divisionId === selectedDivision
                      ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">
                  File format:
                </span>
                <span className="font-medium">
                  {format === ImportFormat.CSV ? 'CSV (.csv)' : 
                   format === ImportFormat.EXCEL ? 'Excel (.xlsx)' : 'JSON (.json)'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || exportComplete}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : exportComplete ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Exported
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" /> Export Teams
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportTeamsDialog;
