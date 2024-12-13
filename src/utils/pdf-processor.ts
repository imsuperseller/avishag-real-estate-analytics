import pdf from 'pdf-parse';
import { extractMLSData } from './mls-validator';
import type { MLSReport } from '@/types/property';

export interface ProcessingResult {
  success: boolean;
  data?: MLSReport;
  error?: string;
  rawText?: string;
}

export class PDFProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PDFProcessingError';
  }
}

export async function processPDF(fileBuffer: Buffer): Promise<ProcessingResult> {
  try {
    // Step 1: Parse PDF
    const pdfData = await pdf(fileBuffer);
    if (!pdfData || !pdfData.text) {
      throw new PDFProcessingError('Failed to extract text from PDF');
    }

    // Step 2: Extract MLS data
    const mlsData = extractMLSData(pdfData.text);
    
    // Step 3: Validate data
    if (!mlsData.activeListings.length && !mlsData.closedListings.length) {
      return {
        success: false,
        error: 'No listings found in PDF',
        rawText: pdfData.text
      };
    }

    // Step 4: Return successful result
    return {
      success: true,
      data: mlsData,
      rawText: pdfData.text
    };

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Empty PDF') {
        return {
          success: false,
          error: 'Empty PDF'
        };
      }
      return {
        success: false,
        error: error.message,
        rawText: undefined
      };
    }
    return {
      success: false,
      error: 'Unknown error during PDF processing',
      rawText: undefined
    };
  }
}

export function validatePDFContent(text: string): boolean {
  // Basic validation to check if the text contains MLS-related content
  const mlsIndicators = [
    /MLS\s*(?:#|Number:?\s*)\d+/i,
    /(?:list(?:ing)?\s*price|price\s*:)\s*\$?[\d,]+/i,
    /(?:\d[\d,]*\s*(?:sq(?:uare)?\s*ft|sf)|sq(?:uare)?\s*ft\s*:\s*[\d,]+)/i,
    /(?:\d+\s*(?:bed(?:room)?s?|br)|bed(?:room)?s?\s*:\s*\d+)/i,
    /(?:\d+(?:\.\d+)?\s*(?:bath(?:room)?s?|ba)|bath(?:room)?s?\s*:\s*\d+(?:\.\d+)?)/i
  ];

  // Check if at least one MLS indicator is present
  return mlsIndicators.some(pattern => pattern.test(text));
}

export function retryProcessing(text: string, maxAttempts: number = 3): MLSReport | null {
  let attempt = 0;
  let lastError: Error | null = null;

  // First check if the text contains any MLS-related content
  if (!validatePDFContent(text)) {
    return null;
  }

  while (attempt < maxAttempts) {
    try {
      const data = extractMLSData(text);
      if (data.activeListings.length || data.closedListings.length) {
        return data;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
    attempt++;
  }

  if (lastError) {
    console.error(`Failed to process after ${maxAttempts} attempts:`, lastError);
  }
  return null;
} 