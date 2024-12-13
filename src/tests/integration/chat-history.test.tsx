import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from '@/components/ChatInterface';
import { mockMLSData } from '@/tests/test-utils';
import type { MLSReport } from '@/types/property';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Chat History Integration', () => {
  const mockOnCalculatePayment = jest.fn();
  const mockOnUpload = jest.fn();
  const testMLSData: MLSReport = mockMLSData;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Test response' }),
      })
    );
  });

  it('displays chat history correctly', async () => {
    render(
      <ChatInterface
        mlsData={testMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Type and submit a message
    const textarea = screen.getByPlaceholderText(/Ask me about the market data/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Send'));
    });

    // Verify message appears in chat history
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(
      <ChatInterface
        mlsData={testMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Type and submit a message
    const textarea = screen.getByPlaceholderText(/Ask me about the market data/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Send'));
    });

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    render(
      <ChatInterface
        mlsData={testMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Type and submit a message
    const textarea = screen.getByPlaceholderText(/Ask me about the market data/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Send'));
    });

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
    });
  });
}); 