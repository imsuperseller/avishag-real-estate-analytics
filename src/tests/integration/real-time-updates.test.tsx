import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';
import type { MLSReport, Property as BaseProperty } from '@/types/property';

// Extend the base Property type with required test fields
interface TestProperty extends BaseProperty {
  id: string;
}

// Define property update type
interface PropertyUpdate {
  type: 'price_change' | 'comment';
  propertyId: string;
  newPrice?: number;
  comment?: string;
  timestamp: string;
}

// Define specific WebSocket message types
interface WebSocketMessageMap {
  message: MessageEvent<string>;
  open: Event;
  close: CloseEvent;
  error: Event;
}

// Define listener types for each event type
type WebSocketListeners = {
  [K in keyof WebSocketMessageMap]: Array<(event: WebSocketMessageMap[K]) => void>;
};

// Mock WebSocket implementation
class MockWebSocket implements Pick<WebSocket, keyof WebSocket> {
  // Static properties
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  // Instance properties
  readonly CONNECTING = MockWebSocket.CONNECTING;
  readonly OPEN = MockWebSocket.OPEN;
  readonly CLOSING = MockWebSocket.CLOSING;
  readonly CLOSED = MockWebSocket.CLOSED;
  
  private listeners: Partial<WebSocketListeners> = {};
  public readyState: number = this.CONNECTING;
  public binaryType: BinaryType = 'blob';
  public bufferedAmount: number = 0;
  public extensions: string = '';
  public protocol: string = '';
  public url: string = '';
  
  // Event handlers
  public onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  public onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  public onmessage: ((this: WebSocket, ev: MessageEvent<any>) => any) | null = null;
  public onopen: ((this: WebSocket, ev: Event) => any) | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    if (protocols) {
      this.protocol = Array.isArray(protocols) ? protocols[0] : protocols;
    }
    setTimeout(() => {
      this.readyState = this.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 0);
  }

  addEventListener<K extends keyof WebSocketMessageMap>(
    type: K,
    listener: (event: WebSocketMessageMap[K]) => void
  ): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    (this.listeners[type] as Array<(event: WebSocketMessageMap[K]) => void>).push(listener);
  }

  removeEventListener<K extends keyof WebSocketMessageMap>(
    type: K,
    listener: (event: WebSocketMessageMap[K]) => void
  ): void {
    if (!this.listeners[type]) return;
    this.listeners[type] = (this.listeners[type] as Array<(event: WebSocketMessageMap[K]) => void>)
      .filter(l => l !== listener);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState !== this.OPEN) {
      throw new Error('WebSocket is not open');
    }
    
    const messageData = typeof data === 'string' ? data :
      data instanceof Blob ? '(blob)' :
      ArrayBuffer.isView(data) ? '(binary)' :
      JSON.stringify(data);

    setTimeout(() => {
      this.dispatchEvent(new MessageEvent('message', { data: messageData }));
    }, 50);
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === this.CLOSED) return;
    this.readyState = this.CLOSING;
    setTimeout(() => {
      this.readyState = this.CLOSED;
      this.dispatchEvent(new CloseEvent('close', { code, reason, wasClean: true }));
    }, 0);
  }

  dispatchEvent(event: Event): boolean {
    const type = event.type as keyof WebSocketMessageMap;
    const listeners = this.listeners[type];
    if (!listeners?.length) return false;

    try {
      listeners.forEach(listener => {
        if (event instanceof MessageEvent && type === 'message') {
          (listener as (event: MessageEvent<string>) => void)(event);
        } else if (event instanceof CloseEvent && type === 'close') {
          (listener as (event: CloseEvent) => void)(event);
        } else {
          (listener as (event: Event) => void)(event);
        }
      });

      // Call the corresponding event handler
      switch (type) {
        case 'open':
          this.onopen?.call(this, event);
          break;
        case 'message':
          if (event instanceof MessageEvent) {
            this.onmessage?.call(this, event);
          }
          break;
        case 'close':
          if (event instanceof CloseEvent) {
            this.onclose?.call(this, event);
          }
          break;
        case 'error':
          this.onerror?.call(this, event);
          break;
      }
      return true;
    } catch (error) {
      console.error('Error dispatching WebSocket event:', error);
      return false;
    }
  }
}

// Helper function to get property ID
const getPropertyId = (): string => {
  const listing = mockMLSData.activeListings?.[0] as TestProperty;
  if (!listing?.id) {
    throw new Error('Mock data is missing required property ID');
  }
  return listing.id;
};

// Helper function to create WebSocket message
const createWebSocketMessage = <T extends object>(data: T): MessageEvent<string> => {
  return new MessageEvent('message', {
    data: JSON.stringify(data)
  });
};

// Helper function to create property update
const createPropertyUpdate = (
  type: PropertyUpdate['type'],
  data: Partial<Omit<PropertyUpdate, 'type' | 'propertyId' | 'timestamp'>>
): PropertyUpdate => {
  return {
    type,
    propertyId: getPropertyId(),
    timestamp: new Date().toISOString(),
    ...data
  };
};

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('Real-time Updates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Verify mock data is valid
    const listing = mockMLSData.activeListings?.[0] as TestProperty;
    expect(listing?.id).toBeDefined();
  });

  afterEach(() => {
    jest.useRealTimers();
    // Reset WebSocket mock
    (global as any).WebSocket = MockWebSocket;
  });

  describe('WebSocket Connection', () => {
    it('establishes connection successfully', async () => {
      render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    });

    it('handles connection failures gracefully', async () => {
      // Mock WebSocket failure
      (global as any).WebSocket = FailingWebSocket;

      render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Reconnecting');
      expect(screen.getByRole('alert')).toHaveTextContent('Connection error');
    });

    it('attempts reconnection on disconnect', async () => {
      const ws = new MockWebSocket('ws://localhost');
      render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      ws.close();
      
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId('connection-status')).toHaveTextContent('Reconnecting');
    });
  });

  describe('Real-time Data Updates', () => {
    it('processes price updates in real-time', async () => {
      const { container } = render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const priceUpdate = createPropertyUpdate('price_change', {
        newPrice: 550000
      });

      // Simulate incoming WebSocket message
      act(() => {
        const ws = new MockWebSocket('');
        ws.sendEvent('message', createWebSocketMessage(priceUpdate));
      });

      await screen.findByText('$550,000');
      expect(container).toMatchSnapshot('after-price-update');
    });

    it('handles multiple rapid updates efficiently', async () => {
      const { container } = render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const updates = Array(10).fill(null).map((_, i) => 
        createPropertyUpdate('price_change', {
          newPrice: 500000 + (i * 10000)
        })
      );

      // Send rapid updates
      act(() => {
        const ws = new MockWebSocket('');
        updates.forEach((update, i) => {
          setTimeout(() => {
            ws.sendEvent('message', createWebSocketMessage(update));
          }, i * 100);
        });
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('price-history')).toMatchSnapshot('after-multiple-updates');
    });

    it('debounces high-frequency updates', async () => {
      const { container } = render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Send 100 rapid updates
      act(() => {
        const ws = new MockWebSocket('');
        Array(100).fill(null).forEach((_, i) => {
          ws.sendEvent('message', createWebSocketMessage({
            type: 'price_change' as const,
            propertyId: getPropertyId(),
            newPrice: 500000 + i,
            timestamp: new Date().toISOString()
          }));
        });
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Verify updates were debounced
      const priceElements = screen.getAllByTestId(/price-/);
      expect(priceElements.length).toBeLessThan(20);
    });
  });

  describe('Data Synchronization', () => {
    it('maintains data consistency during network issues', async () => {
      const { rerender } = render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Simulate network disconnect
      act(() => {
        const ws = new MockWebSocket('');
        ws.close();
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Local update during disconnect
      const updatedData = {
        ...mockMLSData,
        listPrice: 600000
      };
      rerender(<PropertyAnalysis data={updatedData} />);

      // Reconnect and receive conflicting update
      act(() => {
        const ws = new MockWebSocket('');
        ws.sendEvent('message', createWebSocketMessage({
          type: 'price_change' as const,
          propertyId: getPropertyId(),
          newPrice: 650000,
          timestamp: new Date().toISOString()
        }));
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Should show conflict resolution UI
      expect(screen.getByTestId('sync-conflict')).toBeInTheDocument();
      expect(screen.getByText('Data Sync Conflict')).toBeInTheDocument();

      // Resolve conflict
      await userEvent.click(screen.getByText('Use Server Data'));
      expect(screen.getByTestId('property-price')).toHaveTextContent('$650,000');
    });

    it('queues updates during offline mode', async () => {
      const { container } = render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Go offline
      act(() => {
        const ws = new MockWebSocket('');
        ws.close();
      });

      // Queue updates while offline
      const offlineUpdates = Array(5).fill(null).map((_, i) => ({
        type: 'comment' as const,
        propertyId: getPropertyId(),
        comment: `Offline comment ${i}`,
        timestamp: new Date().toISOString()
      }));

      offlineUpdates.forEach(update => {
        act(() => {
          fireEvent.click(screen.getByTestId('add-comment'));
          fireEvent.change(screen.getByTestId('comment-input'), {
            target: { value: update.comment }
          });
          fireEvent.click(screen.getByTestId('submit-comment'));
        });
      });

      // Should show queued updates indicator
      expect(screen.getByTestId('offline-queue')).toHaveTextContent('5 updates pending');

      // Reconnect
      act(() => {
        const ws = new MockWebSocket('');
        offlineUpdates.forEach(update => {
          ws.sendEvent('message', createWebSocketMessage(update));
        });
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should sync queued updates
      offlineUpdates.forEach(update => {
        expect(screen.getByText(update.comment)).toBeInTheDocument();
      });
      expect(screen.queryByTestId('offline-queue')).not.toBeInTheDocument();
    });
  });

  describe('Performance and Resource Usage', () => {
    it('limits WebSocket reconnection attempts', async () => {
      const connectAttempts = jest.fn();
      
      class ReconnectingWebSocket extends MockWebSocket {
        constructor() {
          super('ws://localhost');
          connectAttempts();
          setTimeout(() => {
            this.sendEvent('error', new Event('error'));
          }, 0);
        }
      }

      // Mock failing WebSocket
      (global as any).WebSocket = ReconnectingWebSocket;

      render(<PropertyAnalysis data={mockMLSData} />);

      // Advance time through multiple reconnection attempts
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          jest.advanceTimersByTime(5000);
        }
      });

      // Should stop trying after max attempts
      expect(connectAttempts).toHaveBeenCalledTimes(5); // Max 5 attempts
      expect(screen.getByText('Connection unavailable')).toBeInTheDocument();
    });

    it('handles memory cleanup on unmount', async () => {
      const { unmount } = render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Create some real-time updates
      act(() => {
        const ws = new MockWebSocket('');
        Array(50).fill(null).forEach(() => {
          ws.sendEvent('message', new MessageEvent('message', {
            data: JSON.stringify({
              type: 'price_change',
              propertyId: getPropertyId(),
              newPrice: Math.random() * 1000000,
              timestamp: new Date().toISOString()
            })
          }));
        });
      });

      // Measure memory before unmount
      const memoryBefore = (performance as any).memory?.usedJSHeapSize;

      // Unmount and wait for cleanup
      unmount();
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Check memory after unmount
      const memoryAfter = (performance as any).memory?.usedJSHeapSize;
      
      if (memoryBefore && memoryAfter) {
        // Should not retain significant memory
        expect(memoryAfter).toBeLessThan(memoryBefore * 1.1);
      }
    });
  });
}); 