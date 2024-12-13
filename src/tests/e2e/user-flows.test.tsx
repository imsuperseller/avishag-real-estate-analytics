import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import ChatInterface from '@/components/ChatInterface';
import PDFUpload from '@/components/PDFUpload';
import { mockMLSData } from '@/tests/test-utils';
import type { MLSReport } from '@/types/property';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock WebSocket
class MockWebSocket {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  constructor(url: string) {
    setTimeout(() => {
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send(data: string) {
    // Mock sending data
  }

  close() {
    this.onclose?.(new CloseEvent('close'));
  }
}

(global as any).WebSocket = MockWebSocket;

describe('End-to-End User Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      })
    );
  });

  describe('PDF Upload Flow', () => {
    it('handles complete PDF upload and analysis flow', async () => {
      const onUpload = jest.fn();
      const onError = jest.fn();
      
      render(
        <PDFUpload
          onUpload={onUpload}
          onError={onError}
        />
      );

      // Create a mock PDF file
      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload pdf file/i);

      // Upload file
      await act(async () => {
        await userEvent.upload(input, file);
      });

      // Verify upload started
      expect(screen.getByText(/processing/i)).toBeInTheDocument();

      // Mock successful processing
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMLSData)
        })
      );

      // Wait for processing to complete
      await waitFor(() => {
        expect(onUpload).toHaveBeenCalledWith(file);
      });
    });

    it('handles upload errors gracefully', async () => {
      const onUpload = jest.fn();
      const onError = jest.fn();
      
      render(
        <PDFUpload
          onUpload={onUpload}
          onError={onError}
        />
      );

      // Mock an error response
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid PDF format' })
        })
      );

      const file = new File(['invalid content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload pdf file/i);

      await act(async () => {
        await userEvent.upload(input, file);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Invalid PDF format');
      });
    });
  });

  describe('Property Analysis Flow', () => {
    it('completes full property analysis workflow', async () => {
      const onPriceSelect = jest.fn();
      
      render(
        <PropertyAnalysis
          data={mockMLSData}
          onPriceSelect={onPriceSelect}
        />
      );

      // Verify initial render
      expect(screen.getByText(/market overview/i)).toBeInTheDocument();
      expect(screen.getByTestId('price-history')).toBeInTheDocument();

      // Test price point selection
      const firstPricePoint = screen.getByTestId(
        `price-point-${mockMLSData.marketTrends.priceHistory[0].date}`
      );
      await userEvent.click(firstPricePoint);

      expect(onPriceSelect).toHaveBeenCalledWith(
        mockMLSData.marketTrends.priceHistory[0].price
      );

      // Test market comparison mode
      const compareButton = screen.getByText(/compare points/i);
      await userEvent.click(compareButton);

      // Select two points for comparison
      const points = screen.getAllByTestId(/price-point/);
      await userEvent.click(points[0]);
      await userEvent.click(points[1]);

      expect(screen.getByTestId('comparison-analysis')).toBeInTheDocument();

      // Test print view
      const printButton = screen.getByText(/print view/i);
      await userEvent.click(printButton);

      expect(screen.getByTestId('print-view')).toBeInTheDocument();
    });

    it('handles real-time updates correctly', async () => {
      render(
        <PropertyAnalysis
          data={mockMLSData}
          onPriceSelect={jest.fn()}
        />
      );

      // Wait for WebSocket connection
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      // Simulate price update
      const ws = new MockWebSocket('');
      act(() => {
        ws.onmessage?.(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'price_change',
            propertyId: mockMLSData.mlsNumber,
            newPrice: 550000,
            timestamp: new Date().toISOString()
          })
        }));
      });

      await waitFor(() => {
        expect(screen.getByText('$550,000')).toBeInTheDocument();
      });
    });
  });

  describe('Chat Interface Flow', () => {
    it('completes full chat interaction flow', async () => {
      const onCalculatePayment = jest.fn();
      
      render(
        <ChatInterface
          mlsData={mockMLSData}
          onCalculatePayment={onCalculatePayment}
          onUpload={jest.fn()}
        />
      );

      // Type and send a message
      const textarea = screen.getByPlaceholderText(/ask me about/i);
      await userEvent.type(textarea, 'What is the average price?');
      
      const sendButton = screen.getByText('Send');
      await userEvent.click(sendButton);

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });

      // Test payment calculation request
      await userEvent.type(textarea, 'Calculate monthly payment');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(onCalculatePayment).toHaveBeenCalled();
      });
    });

    it('handles API errors in chat gracefully', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500
        })
      );

      render(
        <ChatInterface
          mlsData={mockMLSData}
          onCalculatePayment={jest.fn()}
          onUpload={jest.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText(/ask me about/i);
      await userEvent.type(textarea, 'What is the average price?');
      
      const sendButton = screen.getByText('Send');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component Integration', () => {
    it('maintains state across component interactions', async () => {
      const { rerender } = render(
        <>
          <PropertyAnalysis
            data={mockMLSData}
            onPriceSelect={jest.fn()}
          />
          <ChatInterface
            mlsData={mockMLSData}
            onCalculatePayment={jest.fn()}
            onUpload={jest.fn()}
          />
        </>
      );

      // Select a price point
      const pricePoint = screen.getByTestId(
        `price-point-${mockMLSData.marketTrends.priceHistory[0].date}`
      );
      await userEvent.click(pricePoint);

      // Verify chat context includes selected price
      const textarea = screen.getByPlaceholderText(/ask me about/i);
      await userEvent.type(textarea, 'Tell me about the selected price');
      
      const sendButton = screen.getByText('Send');
      await userEvent.click(sendButton);

      // Mock API response checking for price context
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(mockMLSData.marketTrends.priceHistory[0].price.toString())
        })
      );
    });
  });
}); 