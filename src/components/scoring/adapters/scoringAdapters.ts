
import { Court } from "@/types/tournament";

/**
 * Adapter function to convert a court object to a court number
 * @param court The court object
 * @returns The court number
 */
export function courtToCourtNumber(court: Court): number {
  return court.number;
}

/**
 * Adapter function to handle team scoring with team1/team2 and increment
 * @param team1Score Current team1 score
 * @param team2Score Current team2 score
 * @param callback The callback function expecting team and increment parameters
 */
export function scoreChangeAdapter(
  team1Score: number, 
  team2Score: number, 
  callback: (team: "team1" | "team2", increment: boolean) => void
) {
  // This is a placeholder implementation 
  // In a real implementation, we'd need to track previous scores to determine which team changed
  callback("team1", team1Score > 0);
}
