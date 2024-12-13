import { processPDF, validatePDFContent, retryProcessing, PDFProcessingError } from '@/utils/pdf-processor';
import type { ProcessingResult } from '@/utils/pdf-processor';
import type { MLSReport } from '@/types/property';

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation((buffer: Buffer) => {
    // Check if buffer is empty
    if (buffer.length === 0) {
      throw new Error('Empty PDF');
    }

    // Convert buffer to string to check test cases
    const text = buffer.toString();
    
    if (text.includes('INVALID')) {
      throw new Error('Failed to parse PDF');
    }

    return Promise.resolve({
      text: text,
      numpages: 1,
      info: { Producer: 'Test' },
      metadata: null,
      version: '1.0'
    });
  });
});

describe('PDF Processor', () => {
  const validMLSText = `
    MLS#12345
    123 Main St, Plano
    List Price: $500,000
    4 beds, 2.5 baths
    2,500 sqft
    Built: 2010
    2 Car Garage
    0.25 acres
  `;

  const validBuffer = Buffer.from(validMLSText);
  const emptyBuffer = Buffer.from('');
  const invalidBuffer = Buffer.from('INVALID_CONTENT');
  const nonMLSBuffer = Buffer.from('Some random text without MLS data');

  describe('processPDF', () => {
    it('successfully processes valid PDF with MLS data', async () => {
      const result = await processPDF(validBuffer);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.activeListings).toHaveLength(1);
      expect(result.data?.activeListings[0]).toMatchObject({
        mlsNumber: '12345',
        address: '123 Main St',
        city: 'Plano',
        listPrice: 500000
      });
    });

    it('handles empty PDF', async () => {
      const result = await processPDF(emptyBuffer);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty PDF');
      expect(result.data).toBeUndefined();
    });

    it('handles invalid PDF format', async () => {
      const result = await processPDF(invalidBuffer);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to parse PDF');
      expect(result.data).toBeUndefined();
    });

    it('handles PDF without MLS data', async () => {
      const result = await processPDF(nonMLSBuffer);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No listings found in PDF');
      expect(result.rawText).toBeDefined();
    });

    it('preserves raw text for debugging on failure', async () => {
      const result = await processPDF(nonMLSBuffer);
      
      expect(result.success).toBe(false);
      expect(result.rawText).toBe('Some random text without MLS data');
    });
  });

  describe('validatePDFContent', () => {
    it('validates text with MLS number', () => {
      expect(validatePDFContent('MLS#12345')).toBe(true);
      expect(validatePDFContent('MLS Number: 12345')).toBe(true);
    });

    it('validates text with price', () => {
      expect(validatePDFContent('List Price: $500,000')).toBe(true);
      expect(validatePDFContent('Price: 500000')).toBe(true);
    });

    it('validates text with square footage', () => {
      expect(validatePDFContent('2500 sqft')).toBe(true);
      expect(validatePDFContent('Square Feet: 2,500')).toBe(true);
    });

    it('validates text with bedrooms', () => {
      expect(validatePDFContent('4 beds')).toBe(true);
      expect(validatePDFContent('Bedrooms: 4')).toBe(true);
      expect(validatePDFContent('4 BR')).toBe(true);
    });

    it('validates text with bathrooms', () => {
      expect(validatePDFContent('2.5 baths')).toBe(true);
      expect(validatePDFContent('Bathrooms: 2.5')).toBe(true);
      expect(validatePDFContent('2.5 BA')).toBe(true);
    });

    it('returns false for non-MLS content', () => {
      expect(validatePDFContent('Random text')).toBe(false);
      expect(validatePDFContent('')).toBe(false);
    });
  });

  describe('retryProcessing', () => {
    const validText = `
      MLS#12345
      123 Main St, Plano
      List Price: $500,000
      4 beds, 2.5 baths
      2,500 sqft
    `;

    const invalidText = 'Some random text';
    const partialText = 'MLS#12345\nRandom content';

    it('successfully processes valid text on first try', () => {
      const result = retryProcessing(validText);
      expect(result).toBeDefined();
      expect(result?.activeListings[0].mlsNumber).toBe('12345');
    });

    it('returns null for invalid text after max attempts', () => {
      const result = retryProcessing(invalidText);
      expect(result).toBeNull();
    });

    it('returns null for partial MLS data', () => {
      const result = retryProcessing(partialText);
      expect(result).toBeNull();
    });

    it('respects max attempts parameter', () => {
      const mockExtract = jest.spyOn(require('@/utils/mls-validator'), 'extractMLSData');
      
      retryProcessing(validText, 2);
      
      expect(mockExtract).toHaveBeenCalledTimes(1);
      
      mockExtract.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles PDF with multiple listings', async () => {
      const multiListingText = `
        MLS#12345
        123 Main St, Plano
        List Price: $500,000
        4 beds, 2.5 baths
        2,500 sqft

        MLS#67890
        456 Oak Ave, Frisco
        List Price: $600,000
        3 beds, 2 baths
        2,000 sqft
      `;

      const result = await processPDF(Buffer.from(multiListingText));
      
      expect(result.success).toBe(true);
      expect(result.data?.activeListings).toHaveLength(2);
    });

    it('handles PDF with mixed active and closed listings', async () => {
      const mixedListingText = `
        MLS#12345
        123 Main St, Plano
        List Price: $500,000
        4 beds, 2.5 baths
        2,500 sqft

        MLS#67890
        456 Oak Ave, Frisco
        List Price: $600,000
        Sold Price: $595,000
        3 beds, 2 baths
        2,000 sqft
      `;

      const result = await processPDF(Buffer.from(mixedListingText));
      
      expect(result.success).toBe(true);
      expect(result.data?.activeListings).toHaveLength(1);
      expect(result.data?.closedListings).toHaveLength(1);
    });

    it('handles PDF with unusual formatting', async () => {
      const unusualText = `
        MLS # 12345
        Property Address:123 Main St
        Plano,TX
        Price:$500,000
        Features:4br,2.5ba
        Area:2500 square feet
        Year:2010
      `;

      const result = await processPDF(Buffer.from(unusualText));
      
      expect(result.success).toBe(true);
      expect(result.data?.activeListings[0]).toMatchObject({
        mlsNumber: '12345',
        address: '123 Main St',
        city: 'Plano',
        listPrice: 500000
      });
    });

    it('handles PDF with missing optional fields', async () => {
      const minimalText = `
        MLS#12345
        123 Main St, Plano
        List Price: $500,000
      `;

      const result = await processPDF(Buffer.from(minimalText));
      
      expect(result.success).toBe(true);
      expect(result.data?.activeListings[0]).toMatchObject({
        mlsNumber: '12345',
        address: '123 Main St',
        city: 'Plano',
        listPrice: 500000
      });
    });

    it('handles PDF with malformed numbers', async () => {
      const malformedText = `
        MLS#12345
        123 Main St, Plano
        List Price: $1,234,567.00
        4.0 beds, 2.50 baths
        2.500,00 sqft
      `;

      const result = await processPDF(Buffer.from(malformedText));
      
      expect(result.success).toBe(true);
      expect(result.data?.activeListings[0].listPrice).toBe(1234567);
    });
  });

  describe('Error Handling', () => {
    it('throws PDFProcessingError for invalid input', async () => {
      await expect(processPDF(Buffer.from([]))).rejects.toThrow(PDFProcessingError);
    });

    it('handles malformed dates gracefully', async () => {
      const malformedDateText = `
        MLS#12345
        123 Main St, Plano
        List Price: $500,000
        Sold Date: Invalid Date
      `;

      const result = await processPDF(Buffer.from(malformedDateText));
      expect(result.success).toBe(true);
      expect(result.data?.activeListings[0].soldDate).toBeUndefined();
    });

    it('handles corrupted numeric values', async () => {
      const corruptedText = `
        MLS#12345
        123 Main St, Plano
        List Price: $NaN
        Square Feet: undefined
      `;

      const result = await processPDF(Buffer.from(corruptedText));
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('handles missing required fields', async () => {
      const incompleteText = `
        Property at 123 Main St
        Price: $500,000
      `;

      const result = await processPDF(Buffer.from(incompleteText));
      expect(result.success).toBe(false);
      expect(result.error).toBe('No listings found in PDF');
    });
  });
});