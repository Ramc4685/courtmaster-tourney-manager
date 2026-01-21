import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tournament } from '@/types/tournament';
import { TournamentFormat } from '@/types/tournament-enums';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Save, X } from 'lucide-react';

interface FormatEditorProps {
  tournament: Tournament;
  onUpdate: (tournament: Partial<Tournament>) => void;
}

const FormatEditor: React.FC<FormatEditorProps> = ({ tournament, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormat>(
    tournament.format || TournamentFormat.SINGLE_ELIMINATION
  );
  const { toast } = useToast();

  const formatOptions = [
    { value: TournamentFormat.SINGLE_ELIMINATION, label: 'Single Elimination' },
    { value: TournamentFormat.DOUBLE_ELIMINATION, label: 'Double Elimination' },
    { value: TournamentFormat.ROUND_ROBIN, label: 'Round Robin' },
    { value: TournamentFormat.SWISS, label: 'Swiss System' },
    { value: TournamentFormat.GROUP_KNOCKOUT, label: 'Group + Knockout' },
    { value: TournamentFormat.MULTI_STAGE, label: 'Multi-Stage' },
  ];

  const getFormatLabel = (format: TournamentFormat | undefined) => {
    if (!format) {
      return 'Not Specified';
    }
    const option = formatOptions.find(opt => opt.value === format);
    return option?.label || format.replace(/_/g, ' ');
  };

  const handleSave = () => {
    if (selectedFormat !== (tournament.format || TournamentFormat.SINGLE_ELIMINATION)) {
      onUpdate({ format: selectedFormat });
      toast({
        title: "Format Updated",
        description: `Tournament format changed to ${getFormatLabel(selectedFormat)}`,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedFormat(tournament.format || TournamentFormat.SINGLE_ELIMINATION);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Tournament Format
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tournament Format</label>
            <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as TournamentFormat)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="flex items-center gap-1">
              <Save className="h-3 w-3" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="flex items-center gap-1">
              <X className="h-3 w-3" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center">
            <Edit2 className="h-4 w-4 mr-2" />
            Tournament Format
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{getFormatLabel(tournament.format)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {tournament.currentStage && `Current Stage: ${tournament.currentStage.replace(/_/g, ' ')}`}
        </p>
      </CardContent>
    </Card>
  );
};

export default FormatEditor;
