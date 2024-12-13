import { renderHook, act } from '@testing-library/react';
import { useAirtable } from '../useAirtable';
import { AirtableService } from '../../services/airtable';
import { MLSReportRecord, ListingRecord } from '../../types/airtable';

// Mock the AirtableService
jest.mock('../../services/airtable', () => ({
  AirtableService: {
    getInstance: jest.fn()
  }
}));

describe('useAirtable', () => {
  const mockAirtableService = {
    createMLSReport: jest.fn(),
    getMLSReport: jest.fn(),
    createListing: jest.fn(),
    getListingsByReport: jest.fn(),
    createInsight: jest.fn(),
    getInsightsByListing: jest.fn(),
    batchCreateListings: jest.fn(),
    transformListingToProperty: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AirtableService.getInstance as jest.Mock).mockReturnValue(mockAirtableService);
  });

  it('should handle successful MLS report creation', async () => {
    const mockReport = {
      'Upload Date': '2023-12-14',
      'Uploaded By': 'Test User',
      'Processing Status': 'Pending' as const
    };

    const mockResponse: MLSReportRecord = {
      id: 'rec123',
      fields: {
        'Report ID': 'RPT123',
        ...mockReport
      }
    };

    mockAirtableService.createMLSReport.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAirtable());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    let response;
    await act(async () => {
      response = await result.current.createMLSReport(mockReport);
    });

    expect(response).toEqual(mockResponse);
    expect(mockAirtableService.createMLSReport).toHaveBeenCalledWith(mockReport);
  });

  it('should handle failed MLS report creation', async () => {
    const mockError = new Error('Failed to create report');
    mockAirtableService.createMLSReport.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useAirtable());

    await act(async () => {
      try {
        await result.current.createMLSReport({
          'Upload Date': '2023-12-14',
          'Uploaded By': 'Test User',
          'Processing Status': 'Pending' as const
        });
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should handle successful listing retrieval', async () => {
    const mockListings: ListingRecord[] = [
      {
        id: 'rec456',
        fields: {
          'Listing ID': 'LST456',
          'Report ID': ['RPT123'],
          'Listing Status': 'Active',
          'Address': '123 Test St',
          'List Price': 500000,
          'Square Footage': 2000,
          'Year Built': 2000,
          'Days on Market': 30,
          'Pool Availability': 'No'
        }
      }
    ];

    mockAirtableService.getListingsByReport.mockResolvedValueOnce(mockListings);

    const { result } = renderHook(() => useAirtable());

    let response;
    await act(async () => {
      response = await result.current.getListingsByReport('RPT123');
    });

    expect(response).toEqual(mockListings);
    expect(mockAirtableService.getListingsByReport).toHaveBeenCalledWith('RPT123');
  });

  it('should handle property transformation', () => {
    const mockListing: ListingRecord = {
      id: 'rec456',
      fields: {
        'Listing ID': 'LST456',
        'Report ID': ['RPT123'],
        'Listing Status': 'Active',
        'Address': '123 Test St',
        'List Price': 500000,
        'Sale Price': 490000,
        'Square Footage': 2000,
        'Year Built': 2000,
        'Days on Market': 30,
        'Pool Availability': 'Yes'
      }
    };

    const mockProperty = {
      mlsNumber: 'LST456',
      address: '123 Test St',
      listPrice: 500000,
      soldPrice: 490000,
      sqft: 2000,
      yearBuilt: 2000,
      daysOnMarket: 30,
      pool: true,
      pricePerSqft: 250,
      city: '',
      bedrooms: 0,
      bathrooms: '0/0/0',
      garage: '',
      acres: 0,
      saleToListRatio: 0.98
    };

    mockAirtableService.transformListingToProperty.mockReturnValueOnce(mockProperty);

    const { result } = renderHook(() => useAirtable());

    const transformedProperty = result.current.transformListingToProperty(mockListing);

    expect(transformedProperty).toEqual(mockProperty);
    expect(mockAirtableService.transformListingToProperty).toHaveBeenCalledWith(mockListing);
  });

  it('should handle batch listing creation', async () => {
    const mockListings = [
      {
        'Report ID': ['RPT123'],
        'Listing Status': 'Active' as const,
        'Address': '123 Test St',
        'List Price': 500000,
        'Square Footage': 2000,
        'Year Built': 2000,
        'Days on Market': 30,
        'Pool Availability': 'No' as const
      },
      {
        'Report ID': ['RPT123'],
        'Listing Status': 'Active' as const,
        'Address': '456 Test Ave',
        'List Price': 600000,
        'Square Footage': 2500,
        'Year Built': 2010,
        'Days on Market': 15,
        'Pool Availability': 'Yes' as const
      }
    ];

    const mockResponse: ListingRecord[] = mockListings.map((listing, index) => ({
      id: `rec${index}`,
      fields: {
        'Listing ID': `LST${index}`,
        ...listing
      }
    }));

    mockAirtableService.batchCreateListings.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAirtable());

    let response;
    await act(async () => {
      response = await result.current.batchCreateListings(mockListings);
    });

    expect(response).toEqual(mockResponse);
    expect(mockAirtableService.batchCreateListings).toHaveBeenCalledWith(mockListings);
  });

  it('should handle loading state correctly', async () => {
    mockAirtableService.getMLSReport.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useAirtable());

    expect(result.current.isLoading).toBe(false);

    const promise = act(async () => {
      await result.current.getMLSReport('RPT123');
    });

    expect(result.current.isLoading).toBe(true);

    await promise;

    expect(result.current.isLoading).toBe(false);
  });
}); 