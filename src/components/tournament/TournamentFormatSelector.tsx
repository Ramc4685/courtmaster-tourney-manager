
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TournamentFormat } from '@/types/tournament';
import { TournamentFormatService } from '@/services/tournament/formats/TournamentFormatService';

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
  const formats = TournamentFormatService.getAllFormats();
  const selectedFormat = formats.find(f => f.id === value);
  
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
