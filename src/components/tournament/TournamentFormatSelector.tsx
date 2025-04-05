
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TournamentFormat } from '@/types/tournament';
import { getFormatDisplayName, getFormatDescription } from '@/utils/categoryUtils';

interface TournamentFormatSelectorProps {
  value: TournamentFormat;
  onValueChange: (value: TournamentFormat) => void;
  categorySpecific?: boolean;
}

const TournamentFormatSelector: React.FC<TournamentFormatSelectorProps> = ({
  value,
  onValueChange,
  categorySpecific = false
}) => {
  const formats: {id: TournamentFormat, name: string, description: string}[] = [
    { id: "SINGLE_ELIMINATION", name: getFormatDisplayName("SINGLE_ELIMINATION"), description: getFormatDescription("SINGLE_ELIMINATION") },
    { id: "DOUBLE_ELIMINATION", name: getFormatDisplayName("DOUBLE_ELIMINATION"), description: getFormatDescription("DOUBLE_ELIMINATION") },
    { id: "ROUND_ROBIN", name: getFormatDisplayName("ROUND_ROBIN"), description: getFormatDescription("ROUND_ROBIN") },
    { id: "SWISS", name: getFormatDisplayName("SWISS"), description: getFormatDescription("SWISS") },
    { id: "GROUP_KNOCKOUT", name: getFormatDisplayName("GROUP_KNOCKOUT"), description: getFormatDescription("GROUP_KNOCKOUT") },
    { id: "MULTI_STAGE", name: getFormatDisplayName("MULTI_STAGE"), description: getFormatDescription("MULTI_STAGE") }
  ];
  
  const selectedFormat = formats.find(f => f.id === value) || formats[0];
  
  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={(val) => onValueChange(val as TournamentFormat)}>
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
