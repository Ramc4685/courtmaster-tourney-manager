
/**
 * Utility functions for team name generation based on player names
 * This service provides consistent team name generation across the application
 */

/**
 * Generates a team name based on player names
 * @param playerNames Array of player names
 * @param maxLength Maximum length of the generated team name
 * @returns Generated team name
 */
export const generateTeamName = (playerNames: string[], maxLength: number = 12): string => {
  // Filter out empty player names
  const validNames = playerNames.filter(name => name && name.trim() !== '');

  if (validNames.length === 0) {
    return "";
  }
  
  if (validNames.length === 1) {
    // Single player - use their name
    return truncateName(validNames[0].trim(), maxLength);
  } else if (validNames.length === 2) {
    // Two players - use "FirstName1/FirstName2" format
    const firstName1 = extractFirstName(validNames[0]);
    const firstName2 = extractFirstName(validNames[1]);
    return truncateName(`${firstName1}/${firstName2}`, maxLength);
  } else {
    // Multiple players (3+) - use first player's name with "+ X others"
    const firstName = extractFirstName(validNames[0]);
    return truncateName(`${firstName} + ${validNames.length - 1} others`, maxLength);
  }
};

/**
 * Extracts the first name from a full name
 * @param name Full name
 * @returns First name
 */
const extractFirstName = (name: string): string => {
  const nameParts = name.trim().split(' ');
  return nameParts[0];
};

/**
 * Truncates a name to the specified maximum length
 * @param name Name to truncate
 * @param maxLength Maximum length
 * @returns Truncated name
 */
const truncateName = (name: string, maxLength: number): string => {
  return name.length > maxLength ? name.substring(0, maxLength) : name;
};

/**
 * Generates an AI-inspired team name when regular name generation doesn't work well
 * @returns Creative team name
 */
export const generateCreativeTeamName = (): string => {
  // Array of creative team name parts
  const prefixes = [
    "Blazing", "Swift", "Mighty", "Power", "Elite", 
    "Thunder", "Victory", "Dynamic", "Stellar", "Prime"
  ];
  
  const suffixes = [
    "Smashers", "Aces", "Stars", "Squad", "Force",
    "Titans", "Knights", "Legends", "Phoenix", "Dragons"
  ];
  
  // Randomly select a prefix and suffix
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix} ${suffix}`;
};
