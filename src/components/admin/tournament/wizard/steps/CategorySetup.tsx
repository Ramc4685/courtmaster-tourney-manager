import React from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { TournamentFormValues, Category, CategoryTypes } from '../../types';
import { PlayType, TournamentFormat, Division } from '@/types/tournament-enums';

interface CategorySetupProps {
  data: TournamentFormValues;
  onChange: (values: Partial<TournamentFormValues>) => void;
}

export default function CategorySetup({ data, onChange }: CategorySetupProps) {
  const handleAddCategory = (categoryType: string) => {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: `${categoryType} Category`,
      playType: categoryType === CategoryTypes.MIXED ? PlayType.MIXED : PlayType.SINGLES,
      format: TournamentFormat.SINGLE_ELIMINATION,
      division: Division.OPEN
    };

    onChange({
      divisionDetails: [
        ...(data.divisionDetails || []),
        {
          id: crypto.randomUUID(),
          name: categoryType,
          type: Division.OPEN,
          categories: [newCategory]
        }
      ]
    });
  };

  const handleCategoryChange = (divisionIndex: number, categoryIndex: number, field: keyof Category, value: any) => {
    const updatedDivisions = [...(data.divisionDetails || [])];
    const division = updatedDivisions[divisionIndex];
    if (division && division.categories) {
      division.categories[categoryIndex] = {
        ...division.categories[categoryIndex],
        [field]: value
      };
      onChange({ divisionDetails: updatedDivisions });
    }
  };

  const handleRemoveCategory = (divisionIndex: number, categoryIndex: number) => {
    const updatedDivisions = [...(data.divisionDetails || [])];
    const division = updatedDivisions[divisionIndex];
    if (division && division.categories) {
      division.categories.splice(categoryIndex, 1);
      if (division.categories.length === 0) {
        updatedDivisions.splice(divisionIndex, 1);
      }
      onChange({ divisionDetails: updatedDivisions });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Tournament Categories</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {Object.values(CategoryTypes).map((type) => (
            <Button 
              key={type}
              variant="contained" 
              onClick={() => handleAddCategory(type)}
              sx={{ textTransform: 'capitalize' }}
            >
              Add {type.toLowerCase()}
            </Button>
          ))}
        </Box>
      </Box>

      {data.divisionDetails?.map((division, divisionIndex) => (
        <React.Fragment key={division.id}>
          {division.categories?.map((category, categoryIndex) => (
            <Card key={category.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Category Name"
                    value={category.name}
                    onChange={(e) => handleCategoryChange(divisionIndex, categoryIndex, 'name', e.target.value)}
                    fullWidth
                  />

                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, 
                    gap: 2 
                  }}>
                    <FormControl fullWidth>
                      <InputLabel>Play Type</InputLabel>
                      <Select
                        value={category.playType}
                        onChange={(e) => handleCategoryChange(divisionIndex, categoryIndex, 'playType', e.target.value)}
                        label="Play Type"
                      >
                        <MenuItem value={PlayType.SINGLES}>Singles</MenuItem>
                        <MenuItem value={PlayType.DOUBLES}>Doubles</MenuItem>
                        <MenuItem value={PlayType.MIXED}>Mixed Doubles</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Format</InputLabel>
                      <Select
                        value={category.format}
                        onChange={(e) => handleCategoryChange(divisionIndex, categoryIndex, 'format', e.target.value)}
                        label="Format"
                      >
                        <MenuItem value={TournamentFormat.SINGLE_ELIMINATION}>Single Elimination</MenuItem>
                        <MenuItem value={TournamentFormat.ROUND_ROBIN}>Round Robin</MenuItem>
                        <MenuItem value={TournamentFormat.GROUP_KNOCKOUT}>Group + Knockout</MenuItem>
                        <MenuItem value={TournamentFormat.SWISS}>Swiss System</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Division</InputLabel>
                      <Select
                        value={category.division}
                        onChange={(e) => handleCategoryChange(divisionIndex, categoryIndex, 'division', e.target.value)}
                        label="Division"
                      >
                        <MenuItem value={Division.OPEN}>Open</MenuItem>
                        <MenuItem value={Division.ADVANCED}>Advanced</MenuItem>
                        <MenuItem value={Division.INTERMEDIATE}>Intermediate</MenuItem>
                        <MenuItem value={Division.BEGINNER}>Beginner</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={() => handleRemoveCategory(divisionIndex, categoryIndex)}
                    fullWidth
                  >
                    Remove Category
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </React.Fragment>
      ))}

      {(!data.divisionDetails || data.divisionDetails.length === 0) && (
        <Typography color="text.secondary" align="center" sx={{ mt: 2 }}>
          No categories added yet. Click one of the category buttons above to create one.
        </Typography>
      )}
    </Box>
  );
} 