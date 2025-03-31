
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
    // Two players - use firstchunk/secondchunk format, ensuring at least 3 chars from each
    const name1Chunk = extractNameChunk(validNames[0], 3);
    const name2Chunk = extractNameChunk(validNames[1], 3);
    
    // If either name couldn't meet the minimum length requirement, generate a creative name
    if (!name1Chunk || !name2Chunk) {
      console.log("Could not extract names with minimum length, generating creative name");
      return generateCreativeTeamName();
    }
    
    // Determine how much space we have for each name chunk within the max length
    // Account for the "/" separator (1 character)
    const availableSpace = maxLength - 1;
    const eachNameMaxLength = Math.floor(availableSpace / 2);
    
    const truncatedName1 = truncateName(name1Chunk, eachNameMaxLength);
    const truncatedName2 = truncateName(name2Chunk, eachNameMaxLength);
    
    return `${truncatedName1}/${truncatedName2}`;
  } else {
    // Multiple players (3+) - use first player's name with "+ X others"
    const nameChunk = extractNameChunk(validNames[0], 3);
    if (!nameChunk) {
      return generateCreativeTeamName();
    }
    return truncateName(`${nameChunk} + ${validNames.length - 1}`, maxLength);
  }
};

/**
 * Extracts a chunk of characters from a name (preferably the first name)
 * ensuring it has at least the specified minimum length
 * @param name Full name
 * @param minLength Minimum length of the extracted chunk
 * @returns Name chunk with at least minLength characters, or null if not possible
 */
const extractNameChunk = (name: string, minLength: number = 3): string | null => {
  name = name.trim();
  
  // First try to get the first name from a full name (if there are spaces)
  const nameParts = name.split(' ');
  const firstName = nameParts[0];
  
  // If the first name meets the minimum length, use it
  if (firstName.length >= minLength) {
    return firstName;
  }
  
  // If the full name doesn't have spaces, or the first name is too short,
  // just take the first minLength characters from the full name
  if (name.length >= minLength) {
    // Use either the whole name or just the first minLength characters if it's very long
    return name.substring(0, Math.min(name.length, 6)); // Limit to 6 characters for balance
  }
  
  // If the name is shorter than minLength, return null
  return null;
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
