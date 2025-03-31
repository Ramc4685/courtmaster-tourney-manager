
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
    const firstName1 = extractFirstNameWithMinLength(validNames[0]);
    const firstName2 = extractFirstNameWithMinLength(validNames[1]);
    
    // If either name couldn't meet the minimum length requirement, generate a creative name
    if (!firstName1 || !firstName2) {
      console.log("Could not extract names with minimum length, generating creative name");
      return generateCreativeTeamName();
    }
    
    return truncateName(`${firstName1}/${firstName2}`, maxLength);
  } else {
    // Multiple players (3+) - use first player's name with "+ X others"
    const firstName = extractFirstNameWithMinLength(validNames[0]);
    if (!firstName) {
      return generateCreativeTeamName();
    }
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
 * Extracts the first name from a full name, ensuring it has a minimum length of 3 characters
 * If name is too short, returns empty string to trigger creative name generation
 * @param name Full name
 * @returns First name with minimum length, or empty string if not possible
 */
const extractFirstNameWithMinLength = (name: string, minLength: number = 3): string => {
  const firstName = extractFirstName(name);
  
  // Check if the first name meets the minimum length requirement
  if (firstName.length < minLength) {
    return ""; // Return empty string to trigger creative name generation
  }
  
  return firstName;
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
