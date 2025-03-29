
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TournamentCategory } from "@/types/tournament";

interface TeamCategorySelectorProps {
  categories: TournamentCategory[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  required?: boolean;
}

const TeamCategorySelector: React.FC<TeamCategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
  required = false
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="category">
        Team Category {required && <span className="text-destructive">*</span>}
      </Label>
      <Select
        value={selectedCategoryId}
        onValueChange={onCategoryChange}
        required={required}
      >
        <SelectTrigger id="category">
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Select the category this team will compete in
      </p>
    </div>
  );
};

export default TeamCategorySelector;
