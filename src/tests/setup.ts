import '@testing-library/jest-dom';

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor() {
    setTimeout(() => {
      if (this.onopen) this.onopen(new Event('open'));
    }, 0);
  }
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
} as any;

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    jsHeapSizeLimit: 2330000000,
    totalJSHeapSize: 30000000,
    usedJSHeapSize: 20000000
  },
  configurable: true,
  enumerable: true,
  writable: true
});