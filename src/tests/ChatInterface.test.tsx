/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInterface from '@/components/ChatInterface';
import { sampleMLSData } from './sample-mls-data';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock PDFUpload component
jest.mock('@/components/PDFUpload', () => {
  return function MockPDFUpload({ onUpload }: { onUpload: (file: File) => void }) {
    return (
      <div data-testid="pdf-upload">
        <button onClick={() => onUpload(new File(['test'], 'test.pdf', { type: 'application/pdf' }))}>
          Upload PDF
        </button>
      </div>
    );
  };
});

describe('ChatInterface', () => {
  const mockOnCalculatePayment = jest.fn();
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('renders PDFUpload when no MLS data is provided', () => {
    render(
      <ChatInterface
        mlsData={null}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    expect(screen.getByTestId('pdf-upload')).toBeInTheDocument();
  });

  it('hides PDFUpload when MLS data is provided', () => {
    render(
      <ChatInterface
        mlsData={sampleMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    expect(screen.queryByTestId('pdf-upload')).not.toBeInTheDocument();
  });

  it('handles user input and message submission', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Assistant response' }),
      })
    );

    render(
      <ChatInterface
        mlsData={sampleMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Type a message
    const textarea = screen.getByPlaceholderText(/Ask me about the market data/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });

    // Submit the message
    const submitButton = screen.getByText('Send');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Verify user message is displayed
    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Test message',
        mlsData: sampleMLSData,
      }),
    });

    // Wait for and verify assistant response
    await waitFor(() => {
      expect(screen.getByText('Assistant response')).toBeInTheDocument();
    });
  });

  it('shows loading state during message processing', async () => {
    let resolveResponse: (value: unknown) => void;
    const responsePromise = new Promise(resolve => {
      resolveResponse = resolve;
    });

    mockFetch.mockImplementationOnce(() =>
      responsePromise.then(() => ({
        ok: true,
        json: () => Promise.resolve({ message: 'Assistant response' }),
      }))
    );

    render(
      <ChatInterface
        mlsData={sampleMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Type and submit a message
    const textarea = screen.getByPlaceholderText(/Ask me about the market data/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Send'));
    });

    // Verify loading state
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    expect(textarea).toBeDisabled();
    expect(screen.getByText('Send')).toBeDisabled();

    // Resolve the response
    await act(async () => {
      resolveResponse!(undefined);
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for state updates
    });

    // Verify loading state is removed and input is enabled for new messages
    await waitFor(() => {
      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    });
    expect(textarea).not.toBeDisabled();
    expect(screen.getByText('Send')).toBeDisabled(); // Should be disabled because textarea is empty
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
        mlsData={sampleMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Type and submit a message
    const textarea = screen.getByPlaceholderText(/Ask me about the market data/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    await act(async () => {
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
        mlsData={sampleMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Type and submit a message
    const textarea = screen.getByPlaceholderText(/Ask me about the market data/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Send'));
    });

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
    });
  });

  it('prevents empty message submission', async () => {
    render(
      <ChatInterface
        mlsData={sampleMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Try to submit empty message
    await act(async () => {
      fireEvent.click(screen.getByText('Send'));
    });

    // Verify no API call was made
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles file upload correctly', async () => {
    render(
      <ChatInterface
        mlsData={null}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Trigger file upload
    await act(async () => {
      fireEvent.click(screen.getByText('Upload PDF'));
    });

    // Verify onUpload was called
    expect(mockOnUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test.pdf',
        type: 'application/pdf',
      })
    );
  });

  it('maintains message history', async () => {
    const responses = [
      { message: 'First response' },
      { message: 'Second response' },
    ];

    let responseIndex = 0;
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[responseIndex++]),
      })
    );

    render(
      <ChatInterface
        mlsData={sampleMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Send first message
    const textarea = screen.getByPlaceholderText(/Ask me about the market data/i);
    fireEvent.change(textarea, { target: { value: 'First message' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Send'));
    });

    await waitFor(() => {
      expect(screen.getByText('First response')).toBeInTheDocument();
    });

    // Send second message
    fireEvent.change(textarea, { target: { value: 'Second message' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Send'));
    });

    // Verify both message threads are visible
    await waitFor(() => {
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('First response')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Second response')).toBeInTheDocument();
    });
  });

  it('scrolls to bottom on new messages', async () => {
    const scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Assistant response' }),
      })
    );

    render(
      <ChatInterface
        mlsData={sampleMLSData}
        onCalculatePayment={mockOnCalculatePayment}
        onUpload={mockOnUpload}
      />
    );

    // Send a message
    const textarea = screen.getByPlaceholderText(/Ask me about the market data/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Send'));
    });

    // Verify scroll behavior
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });
}); 