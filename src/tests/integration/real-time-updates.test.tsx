import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';
import { MockWebSocket, FailingWebSocket, createWebSocketMessage } from '@/tests/test-utils/websocket-mock';
import type { Property as BaseProperty } from '@/types/property';
import type { WebSocketMessageData } from '@/types/websocket';

// Extend the base Property type with required test fields
interface TestProperty extends BaseProperty {
  id: string;
}

// Define property update type
interface PropertyUpdate extends WebSocketMessageData<{
  newPrice?: number;
  comment?: string;
}> {
  type: 'price_change' | 'comment';
  propertyId: string;
}

// Helper function to get property ID
const getPropertyId = (): string => {
  const listing = mockMLSData.activeListings?.[0] as TestProperty;
  if (!listing?.id) {
    throw new Error('Mock data is missing required property ID');
  }
  return listing.id;
};

// Helper function to create property update
const createPropertyUpdate = (
  type: PropertyUpdate['type'],
  updateData: {
    newPrice?: number;
    comment?: string;
  }
): PropertyUpdate => ({
  type,
  propertyId: getPropertyId(),
  timestamp: new Date().toISOString(),
  data: updateData
});

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('Real-time Updates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Add test ID to mock data
    (mockMLSData.activeListings[0] as TestProperty).id = 'test-property-1';
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
          ws.sendEvent('message', createWebSocketMessage({
            type: 'price_change',
            propertyId: getPropertyId(),
            newPrice: Math.random() * 1000000,
            timestamp: new Date().toISOString()
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