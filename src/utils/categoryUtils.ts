import { TournamentCategory } from "@/types/tournament";
import { CategoryType } from "@/types/tournament-enums";
import { generateId } from "./tournamentUtils";

// Create standard categories for a tournament
export function createDefaultCategories(): TournamentCategory[] {
  return [
    {
      id: generateId(),
      name: "Men's Singles",
      type: CategoryType.MENS_SINGLES,
      addDemoData: true // Added property used in the code
    },
    {
      id: generateId(),
      name: "Women's Singles",
      type: CategoryType.WOMENS_SINGLES,
      addDemoData: true
    },
    {
      id: generateId(),
      name: "Men's Doubles",
      type: CategoryType.MENS_DOUBLES,
      addDemoData: true
    },
    {
      id: generateId(),
      name: "Women's Doubles",
      type: CategoryType.WOMENS_DOUBLES,
      addDemoData: true
    },
    {
      id: generateId(),
      name: "Mixed Doubles",
      type: CategoryType.MIXED_DOUBLES,
      addDemoData: true
    }
  ];
}
