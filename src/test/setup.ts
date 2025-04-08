import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the matchScoringStore
vi.mock('@/stores/matchScoringStore', () => ({
  useMatchScoringStore: vi.fn(),
}));

// Mock the useMatchScoring hook
vi.mock('@/hooks/useMatchScoring', () => ({
  useMatchScoring: vi.fn(),
})); 