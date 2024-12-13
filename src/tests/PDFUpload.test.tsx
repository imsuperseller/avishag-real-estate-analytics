/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PDFUpload from '../components/PDFUpload';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, accept, maxSize }: any) => {
    let isDragActive = false;
    let isDragAccept = false;
    let isDragReject = false;

    return {
      getRootProps: () => ({
        onClick: jest.fn(),
        onDrop: (files: File[]) => onDrop(files),
        onDragEnter: () => { isDragActive = true; isDragAccept = true; },
        onDragLeave: () => { isDragActive = false; isDragAccept = false; },
        role: 'presentation',
        className: 'dropzone',
        'aria-label': 'Upload PDF file'
      }),
      getInputProps: () => ({
        type: 'file',
        accept: accept['application/pdf'],
        multiple: false,
        'aria-label': 'Upload PDF file',
        onChange: (e: any) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            onDrop([files[0]]);
          }
        }
      }),
      isDragActive,
      isDragAccept,
      isDragReject,
      open: jest.fn()
    };
  }
}));

describe('PDFUpload', () => {
  const mockOnUpload = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area correctly', () => {
    render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    
    expect(screen.getByText(/Drag & drop your MLS report PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to select file/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported format: PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size: 10MB/i)).toBeInTheDocument();
  });

  it('handles file upload correctly', async () => {
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true
      });
      
      await act(async () => {
        fireEvent.change(input);
      });
      
      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file);
      });
    }
  });

  it('handles drag enter and leave events', async () => {
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    const dropzone = container.querySelector('[role="button"]');
    
    if (dropzone) {
      // Simulate drag enter
      fireEvent.dragEnter(dropzone);
      expect(dropzone).toHaveClass('border-blue-400');
      expect(dropzone).toHaveClass('bg-blue-50');
      
      // Simulate drag leave
      fireEvent.dragLeave(dropzone);
      expect(dropzone).not.toHaveClass('border-blue-400');
      expect(dropzone).not.toHaveClass('bg-blue-50');
    }
  });

  it('handles drag and drop of non-PDF files', async () => {
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    const dropzone = container.querySelector('[role="button"]');
    
    if (dropzone) {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [file],
            types: ['Files']
          }
        });
      });
      
      expect(screen.getByTestId('error-message')).toHaveTextContent(/Please upload a PDF file/i);
      expect(dropzone).toHaveClass('border-red-300');
      expect(dropzone).toHaveClass('bg-red-50');
    }
  });

  // Accessibility tests
  it('has proper ARIA labels and roles', () => {
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('aria-label', 'Upload PDF file');
    
    const dropzone = container.querySelector('[role="button"]');
    expect(dropzone).toBeInTheDocument();
    expect(dropzone).toHaveAttribute('aria-label', 'Upload PDF file');
  });

  it('maintains focus management during upload process', async () => {
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Verify input is focusable
    if (input) {
      input.focus();
      expect(document.activeElement).toBe(input);
      
      // Simulate file upload
      Object.defineProperty(input, 'files', {
        value: [new File(['test'], 'test.pdf', { type: 'application/pdf' })],
        configurable: true
      });
      
      await act(async () => {
        fireEvent.change(input);
      });
      
      // Verify focus is maintained after upload
      expect(document.activeElement).toBe(input);
    }
  });

  // Error handling tests
  it('handles upload errors gracefully', async () => {
    const mockOnUploadWithError = jest.fn().mockRejectedValue(new Error('Failed to process PDF'));
    const { container } = render(<PDFUpload onUpload={mockOnUploadWithError} onError={mockOnError} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (input) {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true
      });
      
      await act(async () => {
        fireEvent.change(input);
      });
      
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toHaveTextContent('Failed to process PDF');
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      });
    }
  });

  it('shows and hides loading state correctly', async () => {
    let resolveUpload: (value: unknown) => void;
    const uploadPromise = new Promise(resolve => {
      resolveUpload = resolve;
    });
    
    const mockDelayedUpload = jest.fn().mockImplementation(() => uploadPromise);
    const { container } = render(<PDFUpload onUpload={mockDelayedUpload} onError={mockOnError} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (input) {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true
      });
      
      // Start the upload
      await act(async () => {
        fireEvent.change(input);
      });
      
      // Verify loading state is shown
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toBeInTheDocument();
      expect(loadingIndicator).toHaveTextContent('Processing...');
      expect(loadingIndicator).toHaveAttribute('role', 'status');
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
      
      // Resolve the upload
      await act(async () => {
        resolveUpload!(undefined);
      });
      
      // Verify loading state is removed
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    }
  });

  it('handles validation errors correctly', async () => {
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    
    // Test invalid file type
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (input) {
      // Test invalid file type
      Object.defineProperty(input, 'files', {
        value: [invalidFile],
        configurable: true
      });
      
      await act(async () => {
        fireEvent.change(input);
      });
      
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent('Please upload a PDF file');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      
      // Test file size limit
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(input, 'files', {
        value: [largeFile],
        configurable: true
      });
      
      await act(async () => {
        fireEvent.change(input);
      });
      
      expect(errorMessage).toHaveTextContent('File size exceeds 10MB limit');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    }
  });

  // User Interaction Edge Cases
  it('handles rapid multiple file selections', async () => {
    const file1 = new File(['test1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['test2'], 'test2.pdf', { type: 'application/pdf' });

    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Submit first file
    await act(async () => {
      fireEvent.change(input, { target: { files: [file1] } });
    });

    // Wait for first file to be processed
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file1);
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Submit second file
    await act(async () => {
      fireEvent.change(input, { target: { files: [file2] } });
    });

    // Wait for second file to be processed
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file2);
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Verify both files were processed in order
    expect(mockOnUpload).toHaveBeenCalledTimes(2);
    expect(mockOnUpload).toHaveBeenNthCalledWith(1, file1);
    expect(mockOnUpload).toHaveBeenNthCalledWith(2, file2);
  });

  it('handles drag and drop while processing', async () => {
    let resolveUpload: (value: unknown) => void;
    const uploadPromise = new Promise(resolve => {
      resolveUpload = resolve;
    });
    
    const mockDelayedUpload = jest.fn().mockImplementation(() => uploadPromise);
    const { container } = render(<PDFUpload onUpload={mockDelayedUpload} onError={mockOnError} />);
    
    const dropzone = container.querySelector('[role="button"]');
    if (dropzone) {
      // First file drop
      const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
      
      // Simulate drag enter
      await act(async () => {
        fireEvent.dragEnter(dropzone);
      });
      
      // Verify drag state
      await waitFor(() => {
        expect(dropzone.className).toContain('border-blue-400');
      });
      
      // Simulate drop
      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [file1],
            types: ['Files']
          }
        });
        
        // Need to wait a tick for state to update
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Wait for processing state
      await waitFor(() => {
        const loadingIndicator = screen.getByTestId('loading-indicator');
        expect(loadingIndicator).toBeInTheDocument();
        expect(loadingIndicator).toHaveTextContent('Processing...');
        expect(dropzone).toHaveAttribute('aria-busy', 'true');
        expect(dropzone).toHaveAttribute('aria-disabled', 'true');
      }, { timeout: 1000 });
      
      // Try to drop another file while processing
      const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [file2],
            types: ['Files']
          }
        });
        
        // Need to wait a tick for state to update
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify second drop is ignored while processing
      expect(mockDelayedUpload).toHaveBeenCalledTimes(1);
      expect(mockDelayedUpload).toHaveBeenCalledWith(file1);
      
      // Complete first upload
      await act(async () => {
        resolveUpload!(undefined);
        // Need to wait a tick for state to update
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
        expect(dropzone).toHaveAttribute('aria-busy', 'false');
        expect(dropzone).toHaveAttribute('aria-disabled', 'false');
      }, { timeout: 1000 });
      
      // Now the second drop should work
      await act(async () => {
        fireEvent.dragEnter(dropzone);
        await new Promise(resolve => setTimeout(resolve, 0));
        
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [file2],
            types: ['Files']
          }
        });
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(mockDelayedUpload).toHaveBeenCalledTimes(2);
      expect(mockDelayedUpload).toHaveBeenLastCalledWith(file2);
    }
  });

  // Keyboard Navigation
  it('handles keyboard interactions correctly', async () => {
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    const dropzone = container.querySelector('[role="button"]');
    
    if (dropzone) {
      // Test Space key
      await act(async () => {
        fireEvent.keyDown(dropzone, { key: ' ', code: 'Space' });
      });
      expect(dropzone).toHaveAttribute('aria-pressed', 'true');
      
      await act(async () => {
        fireEvent.keyUp(dropzone, { key: ' ', code: 'Space' });
      });
      expect(dropzone).toHaveAttribute('aria-pressed', 'false');
      
      // Test Enter key
      await act(async () => {
        fireEvent.keyDown(dropzone, { key: 'Enter', code: 'Enter' });
      });
      expect(dropzone).toHaveAttribute('aria-pressed', 'true');
      
      await act(async () => {
        fireEvent.keyUp(dropzone, { key: 'Enter', code: 'Enter' });
      });
      expect(dropzone).toHaveAttribute('aria-pressed', 'false');
      
      // Test Escape key (should cancel drag operation)
      await act(async () => {
        fireEvent.dragEnter(dropzone);
      });
      
      // Wait for drag state to update
      await waitFor(() => {
        expect(dropzone.className).toContain('border-blue-400');
      }, { timeout: 1000 });
      
      await act(async () => {
        fireEvent.keyDown(dropzone, { key: 'Escape', code: 'Escape' });
      });
      
      // Wait for drag state to clear
      await waitFor(() => {
        expect(dropzone.className).not.toContain('border-blue-400');
      }, { timeout: 1000 });
    }
  });

  // Media Query Tests
  it('supports high contrast mode', async () => {
    // Mock high contrast mode
    const mediaQuery = '(forced-colors: active)';
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === mediaQuery,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    
    await waitFor(() => {
      const dropzone = container.querySelector('[role="button"]');
      expect(dropzone?.className).toContain('forced-colors-mode');
    });
  });

  it('respects reduced motion preferences', async () => {
    // Mock reduced motion preference
    const mediaQuery = '(prefers-reduced-motion: reduce)';
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === mediaQuery,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    
    await waitFor(() => {
      const dropzone = container.querySelector('[role="button"]');
      expect(dropzone?.className).toContain('reduce-motion');
    });
  });

  it('maintains proper tab order', () => {
    const { container } = render(<PDFUpload onUpload={mockOnUpload} onError={mockOnError} />);
    
    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Verify tab order
    focusableElements.forEach((element, index) => {
      if (index > 0) {
        const prevTabIndex = Number(focusableElements[index - 1].getAttribute('tabindex') || 0);
        const currentTabIndex = Number(element.getAttribute('tabindex') || 0);
        expect(currentTabIndex).toBeGreaterThanOrEqual(prevTabIndex);
      }
    });
  });
}); 