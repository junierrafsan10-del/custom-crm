import { vi } from 'vitest';

export function createMockFns() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn()
  };
}

export function resetMocks() {
  vi.clearAllMocks();
}
