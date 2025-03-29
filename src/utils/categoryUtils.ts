
import { TournamentCategory } from "@/types/tournament";

// Create the default set of categories for a new tournament
export const createDefaultCategories = (): TournamentCategory[] => {
  return [
    { 
      id: crypto.randomUUID(), 
      name: "Men's Singles", 
      type: "MENS_SINGLES", 
      isCustom: false,
      format: "SINGLE_ELIMINATION"
    },
    { 
      id: crypto.randomUUID(), 
      name: "Women's Singles", 
      type: "WOMENS_SINGLES", 
      isCustom: false,
      format: "SINGLE_ELIMINATION"
    },
    { 
      id: crypto.randomUUID(), 
      name: "Men's Doubles", 
      type: "MENS_DOUBLES", 
      isCustom: false,
      format: "SINGLE_ELIMINATION"
    },
    { 
      id: crypto.randomUUID(), 
      name: "Women's Doubles", 
      type: "WOMENS_DOUBLES", 
      isCustom: false,
      format: "SINGLE_ELIMINATION"
    },
    { 
      id: crypto.randomUUID(), 
      name: "Mixed Doubles", 
      type: "MIXED_DOUBLES", 
      isCustom: false,
      format: "SINGLE_ELIMINATION"
    }
  ];
};

// Get a properly formatted name for a category type
export const getCategoryTypeName = (type: string): string => {
  switch (type) {
    case "MENS_SINGLES":
      return "Men's Singles";
    case "WOMENS_SINGLES":
      return "Women's Singles";
    case "MENS_DOUBLES":
      return "Men's Doubles";
    case "WOMENS_DOUBLES":
      return "Women's Doubles";
    case "MIXED_DOUBLES":
      return "Mixed Doubles";
    case "CUSTOM":
      return "Custom Event";
    default:
      return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};
