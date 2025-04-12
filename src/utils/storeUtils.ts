import { useStore } from '@/stores/store';
import { useTournamentStore } from '@/stores/tournamentStore';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';
import { useScoringStore } from '@/stores/scoring/store';

export const resetAllStores = async () => {
  // Reset main store
  const mainStore = useStore.getState();
  mainStore.reset();

  // Reset tournament store
  const tournamentStore = useTournamentStore.getState();
  tournamentStore.loadTournaments();

  // Reset standalone match store
  const standaloneMatchStore = useStandaloneMatchStore.getState();
  standaloneMatchStore.resetMatches();

  // Reset scoring store
  const scoringStore = useScoringStore.getState();
  scoringStore.setSelectedMatch(null);
  scoringStore.setCurrentSet(0);
}; 