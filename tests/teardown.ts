// Cleanup after each test
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Reset all mocks
afterEach(() => {
  vi.clearAllMocks();
});

// Clean up localStorage
afterEach(() => {
  localStorage.clear();
});
