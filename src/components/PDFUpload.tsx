import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

interface PDFUploadProps {
  onUpload: (file: File) => void;
  onError: (message: string) => void;
}

const PDFUpload: React.FC<PDFUploadProps> = ({ onUpload, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    motionQuery.addEventListener('change', handleMotionChange);
    
    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(forced-colors: active)');
    setPrefersHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    
    contrastQuery.addEventListener('change', handleContrastChange);
    
    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setIsDragging(false);
    
    if (!file) return;
    if (isProcessing) return; // Prevent multiple uploads while processing

    // Validate file type
    if (!file.type || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      onError('Please upload a PDF file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      onError('File size exceeds 10MB limit');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      // Ensure state update is complete before proceeding
      await new Promise(resolve => setTimeout(resolve, 0));
      
      await onUpload(file);
    } catch (err) {
      const errorMessage = 'Failed to process PDF';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [onUpload, onError, isProcessing]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isProcessing) return;
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      onError('Please upload a PDF file');
      return;
    }
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      onError('File size exceeds 10MB limit');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Ensure state update is complete before proceeding
      await new Promise(resolve => setTimeout(resolve, 0));
      
      await onUpload(file);
    } catch (err) {
      const errorMessage = 'Failed to process PDF';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      setIsPressed(true);
    } else if (e.key === 'Escape') {
      // Cancel any ongoing operation
      setIsPressed(false);
      setIsDragging(false);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      setIsPressed(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      setIsDragging(true);
      setError(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isProcessing,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDropAccepted: () => {
      setIsDragging(false);
    },
    onDropRejected: () => {
      setIsDragging(false);
      setError('Please upload a valid PDF file');
      onError('Please upload a valid PDF file');
    }
  });

  const dropzoneProps = {
    ...getRootProps(),
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Upload PDF file',
    'aria-pressed': isPressed,
    'aria-busy': isProcessing,
    'aria-disabled': isProcessing
  };

  const getClassName = () => {
    const baseClasses = 'p-8 border-2 border-dashed rounded-lg text-center cursor-pointer';
    const transitionClasses = prefersReducedMotion ? '' : 'transition-colors';
    const stateClasses = [
      isDragging || isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
      error ? 'border-red-300 bg-red-50' : '',
      prefersHighContrast ? 'forced-colors-mode' : '',
      prefersReducedMotion ? 'reduce-motion' : '',
      isPressed ? 'ring-2 ring-blue-400' : ''
    ].filter(Boolean).join(' ');

    return `${baseClasses} ${transitionClasses} ${stateClasses}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div {...dropzoneProps} className={getClassName()}>
        <input {...getInputProps()} aria-label="Upload PDF file" />
        
        {isProcessing ? (
          <div 
            data-testid="loading-indicator" 
            className="text-lg text-blue-600"
            role="status"
            aria-live="polite"
          >
            Processing...
          </div>
        ) : (
          <>
            <p className="text-lg mb-2">
              Drag & drop your MLS report PDF
            </p>
            <p className="text-sm text-gray-500">
              or click to select file
            </p>
            <div className="mt-4 text-xs text-gray-400">
              <p>Supported format: PDF</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </>
        )}

        {error && (
          <div 
            data-testid="error-message" 
            className="mt-4 text-sm text-red-600"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFUpload; 