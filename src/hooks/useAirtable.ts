import { useState, useCallback } from 'react';
import { AirtableService } from '../services/airtable';
import { MLSReportRecord, ListingRecord, InsightRecord } from '../types/airtable';
import { Property } from '../types/property';

interface UseAirtableReturn {
  // MLS Reports
  createMLSReport: (report: Omit<MLSReportRecord['fields'], 'Report ID'>) => Promise<MLSReportRecord>;
  getMLSReport: (reportId: string) => Promise<MLSReportRecord | null>;
  
  // Listings
  createListing: (listing: Omit<ListingRecord['fields'], 'Listing ID'>) => Promise<ListingRecord>;
  getListingsByReport: (reportId: string) => Promise<ListingRecord[]>;
  
  // Insights
  createInsight: (insight: Omit<InsightRecord['fields'], 'Insight ID'>) => Promise<InsightRecord>;
  getInsightsByListing: (listingId: string) => Promise<InsightRecord[]>;
  
  // Batch Operations
  batchCreateListings: (listings: Array<Omit<ListingRecord['fields'], 'Listing ID'>>) => Promise<ListingRecord[]>;
  
  // Data Transformation
  transformListingToProperty: (listing: ListingRecord) => Property;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

export const useAirtable = (): UseAirtableReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const airtableService = AirtableService.getInstance();

  const handleOperation = async <T,>(operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createMLSReport = useCallback(
    async (report: Omit<MLSReportRecord['fields'], 'Report ID'>) => 
      handleOperation(() => airtableService.createMLSReport(report)),
    []
  );

  const getMLSReport = useCallback(
    async (reportId: string) => 
      handleOperation(() => airtableService.getMLSReport(reportId)),
    []
  );

  const createListing = useCallback(
    async (listing: Omit<ListingRecord['fields'], 'Listing ID'>) => 
      handleOperation(() => airtableService.createListing(listing)),
    []
  );

  const getListingsByReport = useCallback(
    async (reportId: string) => 
      handleOperation(() => airtableService.getListingsByReport(reportId)),
    []
  );

  const createInsight = useCallback(
    async (insight: Omit<InsightRecord['fields'], 'Insight ID'>) => 
      handleOperation(() => airtableService.createInsight(insight)),
    []
  );

  const getInsightsByListing = useCallback(
    async (listingId: string) => 
      handleOperation(() => airtableService.getInsightsByListing(listingId)),
    []
  );

  const batchCreateListings = useCallback(
    async (listings: Array<Omit<ListingRecord['fields'], 'Listing ID'>>) => 
      handleOperation(() => airtableService.batchCreateListings(listings)),
    []
  );

  const transformListingToProperty = useCallback(
    (listing: ListingRecord) => airtableService.transformListingToProperty(listing),
    []
  );

  return {
    createMLSReport,
    getMLSReport,
    createListing,
    getListingsByReport,
    createInsight,
    getInsightsByListing,
    batchCreateListings,
    transformListingToProperty,
    isLoading,
    error
  };
}; 