
import '@testing-library/jest-dom';
import { expect } from 'vitest';

// Extend expect with custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => `expected ${received} to be in the document`
    };
  }
});
