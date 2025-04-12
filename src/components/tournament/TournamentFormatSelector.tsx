import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TournamentFormat } from '@/types/tournament-enums';
import { getFormatDisplayName, getFormatDescription } from '@/utils/categoryUtils';

interface TournamentFormatSelectorProps {
  value: TournamentFormat;
  onValueChange: (value: TournamentFormat) => void;
  categorySpecific?: boolean;
  disabled?: boolean;
}

const TournamentFormatSelector: React.FC<TournamentFormatSelectorProps> = ({
  value,
  onValueChange,
  categorySpecific = false,
  disabled = false
}) => {
  const formats: {id: TournamentFormat, name: string, description: string}[] = [
    { id: TournamentFormat.SINGLE_ELIMINATION, name: getFormatDisplayName(TournamentFormat.SINGLE_ELIMINATION), description: getFormatDescription(TournamentFormat.SINGLE_ELIMINATION) },
    { id: TournamentFormat.DOUBLE_ELIMINATION, name: getFormatDisplayName(TournamentFormat.DOUBLE_ELIMINATION), description: getFormatDescription(TournamentFormat.DOUBLE_ELIMINATION) },
    { id: TournamentFormat.ROUND_ROBIN, name: getFormatDisplayName(TournamentFormat.ROUND_ROBIN), description: getFormatDescription(TournamentFormat.ROUND_ROBIN) },
    { id: TournamentFormat.SWISS, name: getFormatDisplayName(TournamentFormat.SWISS), description: getFormatDescription(TournamentFormat.SWISS) },
    { id: TournamentFormat.GROUP_KNOCKOUT, name: getFormatDisplayName(TournamentFormat.GROUP_KNOCKOUT), description: getFormatDescription(TournamentFormat.GROUP_KNOCKOUT) },
    { id: TournamentFormat.MULTI_STAGE, name: getFormatDisplayName(TournamentFormat.MULTI_STAGE), description: getFormatDescription(TournamentFormat.MULTI_STAGE) }
  ];
  
  const selectedFormat = formats.find(f => f.id === value) || formats[0];
  
  return (
    <div className="space-y-2">
      <Select 
        value={value} 
        onValueChange={(val) => onValueChange(val as TournamentFormat)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a tournament format" />
        </SelectTrigger>
        <SelectContent>
          {formats.map(format => (
            <SelectItem key={format.id} value={format.id}>
              {format.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedFormat && (
        <Card className="mt-2">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-base">{selectedFormat.name}</CardTitle>
            <CardDescription className="text-xs">
              {categorySpecific 
                ? "This format will be applied to this category only" 
                : "This format will be the default for all categories"}
            </CardDescription>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <p className="text-xs text-muted-foreground">{selectedFormat.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TournamentFormatSelector;
