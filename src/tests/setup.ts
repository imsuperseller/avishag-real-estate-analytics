import dotenv from 'dotenv';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { configureAxe } from 'jest-axe';

// Load environment variables
dotenv.config();

// Configure axe for testing
const axe = configureAxe({
  rules: {
    // Add specific rule configurations
    'color-contrast': { enabled: true },
    'frame-title': { enabled: false }, // Disable iframe title checks in tests
    'scrollable-region-focusable': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-required-children': { enabled: true },
    'aria-required-parent': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'button-name': { enabled: true },
    'document-title': { enabled: true },
    'duplicate-id': { enabled: true },
    'heading-order': { enabled: true },
    'html-has-lang': { enabled: true },
    'image-alt': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'meta-viewport': { enabled: true },
    'region': { enabled: true }
  }
});

// Make axe available globally in tests
(global as any).axe = axe;

// Mock fetch globally
const mockFetch = jest.fn(
  async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = {
      ok: true,
      json: async () => ({}),
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      text: async () => '',
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      redirected: false,
      type: 'basic' as ResponseType,
      url: typeof input === 'string' ? input : input.toString(),
      body: null,
      bodyUsed: false,
      clone: function(this: Response) { return { ...this } as Response }
    };

    return response as Response;
  }
);

// Assign the mock to global.fetch
global.fetch = mockFetch as unknown as typeof global.fetch;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
} as Console;

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];
  
  constructor(private callback: IntersectionObserverCallback) {}
  
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});