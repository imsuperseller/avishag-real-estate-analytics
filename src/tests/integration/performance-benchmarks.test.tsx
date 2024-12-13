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

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    performance.mark('test-start');
  });

  afterEach(() => {
    jest.useRealTimers();
    performance.clearMarks();
    performance.clearMeasures();
  });

  describe('Load Testing', () => {
    it('handles high-frequency WebSocket messages efficiently', async () => {
      const messageCount = 1000;
      const ws = new WebSocket('ws://localhost:3000');
      const receivedMessages: PropertyUpdate[] = [];

      render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        // Simulate rapid WebSocket messages
        for (let i = 0; i < messageCount; i++) {
          const update: PropertyUpdate = {
            type: 'price_change',
            propertyId: 'test-property',
            newPrice: 500000 + (i * 1000),
            timestamp: new Date().toISOString()
          };
          ws.send(JSON.stringify(update));
          receivedMessages.push(update);
        }
        jest.advanceTimersByTime(5000);
      });

      performance.mark('test-end');
      performance.measure('message-processing', 'test-start', 'test-end');
      
      const measure = performance.getEntriesByName('message-processing')[0];
      expect(measure.duration).toBeLessThan(5000); // Should process 1000 messages in under 5 seconds
      
      // Verify UI responsiveness
      const priceHistory = screen.getByTestId('price-history');
      expect(priceHistory).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('maintains memory efficiency under load', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize;
      const largeDataSet = {
        ...mockMLSData,
        marketTrends: {
          ...mockMLSData.marketTrends,
          priceHistory: Array(1000).fill(null).map((_, i) => ({
            date: new Date(2020, i % 12, 1).toISOString().slice(0, 7),
            price: 500000 + (i * 1000),
            volume: 100 + (i % 50)
          }))
        }
      };

      const { unmount } = render(<PropertyAnalysis data={largeDataSet} />);
      
      await act(async () => {
        // Simulate user interactions
        for (let i = 0; i < 100; i++) {
          fireEvent.mouseMove(screen.getByTestId('price-history'));
          jest.advanceTimersByTime(16); // Simulate 60fps
        }
      });

      const midMemory = (performance as any).memory?.usedJSHeapSize;
      
      // Cleanup
      unmount();
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const finalMemory = (performance as any).memory?.usedJSHeapSize;
      
      if (initialMemory && midMemory && finalMemory) {
        // Memory growth during operation should be reasonable
        expect(midMemory - initialMemory).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
        // Memory should be properly cleaned up
        expect(finalMemory).toBeLessThan(midMemory);
      }
    });

    it('handles concurrent WebSocket connections efficiently', async () => {
      const connectionCount = 5;
      const connections: WebSocket[] = [];
      
      performance.mark('connections-start');
      
      // Create multiple WebSocket connections
      for (let i = 0; i < connectionCount; i++) {
        connections.push(new WebSocket('ws://localhost:3000'));
      }

      render(<PropertyAnalysis data={mockMLSData} />);
      
      await act(async () => {
        // Simulate messages on all connections
        connections.forEach((ws, i) => {
          for (let j = 0; j < 100; j++) {
            ws.send(JSON.stringify({
              type: 'price_change',
              propertyId: `property-${i}`,
              newPrice: 500000 + (j * 1000),
              timestamp: new Date().toISOString()
            }));
          }
        });
        jest.advanceTimersByTime(3000);
      });

      performance.mark('connections-end');
      performance.measure('connection-handling', 'connections-start', 'connections-end');
      
      const measure = performance.getEntriesByName('connection-handling')[0];
      expect(measure.duration).toBeLessThan(3000); // Should handle multiple connections in under 3 seconds
      
      // Verify UI is still responsive
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    });

    it('maintains render performance with large datasets', async () => {
      performance.mark('render-start');
      
      const largeDataSet = {
        ...mockMLSData,
        activeListings: Array(1000).fill(null).map((_, i) => ({
          ...mockMLSData.activeListings[0],
          id: `listing-${i}`,
          listPrice: 500000 + (i * 1000)
        }))
      };

      render(<PropertyAnalysis data={largeDataSet} />);
      
      performance.mark('render-end');
      performance.measure('initial-render', 'render-start', 'render-end');
      
      const measure = performance.getEntriesByName('initial-render')[0];
      expect(measure.duration).toBeLessThan(1000); // Initial render should be under 1 second
      
      // Test interaction performance
      performance.mark('interaction-start');
      
      await act(async () => {
        // Simulate rapid user interactions
        for (let i = 0; i < 50; i++) {
          fireEvent.scroll(screen.getByTestId('property-list'));
          jest.advanceTimersByTime(16); // Simulate 60fps
        }
      });
      
      performance.mark('interaction-end');
      performance.measure('interaction-performance', 'interaction-start', 'interaction-end');
      
      const interactionMeasure = performance.getEntriesByName('interaction-performance')[0];
      expect(interactionMeasure.duration).toBeLessThan(1000); // Interactions should remain smooth
    });
  });
}); 