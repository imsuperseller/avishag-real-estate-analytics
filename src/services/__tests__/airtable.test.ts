import { AirtableService } from '../airtable';
import Airtable, { FieldSet } from 'airtable';
import { MLSReportRecord, ListingRecord, InsightRecord } from '../../types/airtable';

// Mock Airtable
jest.mock('airtable', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      base: jest.fn(() => ({
        MLS_REPORTS: jest.fn(),
        LISTINGS: jest.fn(),
        INSIGHTS: jest.fn(),
        CONFIGURATION: jest.fn()
      }))
    }))
  };
});

describe('AirtableService', () => {
  let service: AirtableService;
  
  const mockBase = {
    create: jest.fn(),
    select: jest.fn()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup Airtable mock
    const mockTable = (name: string) => mockBase;
    (Airtable as unknown as jest.Mock).mockImplementation(() => ({
      base: () => new Proxy({}, {
        get: (target, prop) => mockTable(prop as string)
      })
    }));

    // Get service instance
    service = AirtableService.getInstance();
  });

  describe('MLS Reports', () => {
    const mockMLSReport: MLSReportRecord = {
      id: 'rec123',
      fields: {
        'Report ID': 'RPT123',
        'Upload Date': '2023-12-14',
        'Uploaded By': 'Test User',
        'Processing Status': 'Pending'
      }
    };

    it('should create an MLS report', async () => {
      mockBase.create.mockResolvedValueOnce([mockMLSReport]);

      const result = await service.createMLSReport({
        'Upload Date': '2023-12-14',
        'Uploaded By': 'Test User',
        'Processing Status': 'Pending'
      });

      expect(result).toEqual(mockMLSReport);
      expect(mockBase.create).toHaveBeenCalledWith([{
        fields: {
          'Report ID': expect.any(String),
          'Upload Date': '2023-12-14',
          'Uploaded By': 'Test User',
          'Processing Status': 'Pending'
        }
      }]);
    });

    it('should get an MLS report by ID', async () => {
      mockBase.select.mockReturnValueOnce({
        firstPage: () => Promise.resolve([mockMLSReport])
      });

      const result = await service.getMLSReport('RPT123');

      expect(result).toEqual(mockMLSReport);
      expect(mockBase.select).toHaveBeenCalledWith({
        filterByFormula: `{Report ID} = 'RPT123'`
      });
    });
  });

  describe('Listings', () => {
    const mockListing: ListingRecord = {
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
    };

    it('should create a listing', async () => {
      mockBase.create.mockResolvedValueOnce([mockListing]);

      const result = await service.createListing({
        'Report ID': ['RPT123'],
        'Listing Status': 'Active',
        'Address': '123 Test St',
        'List Price': 500000,
        'Square Footage': 2000,
        'Year Built': 2000,
        'Days on Market': 30,
        'Pool Availability': 'No'
      });

      expect(result).toEqual(mockListing);
      expect(mockBase.create).toHaveBeenCalledWith([{
        fields: {
          'Listing ID': expect.any(String),
          'Report ID': ['RPT123'],
          'Listing Status': 'Active',
          'Address': '123 Test St',
          'List Price': 500000,
          'Square Footage': 2000,
          'Year Built': 2000,
          'Days on Market': 30,
          'Pool Availability': 'No'
        }
      }]);
    });

    it('should get listings by report ID', async () => {
      mockBase.select.mockReturnValueOnce({
        all: () => Promise.resolve([mockListing])
      });

      const result = await service.getListingsByReport('RPT123');

      expect(result).toEqual([mockListing]);
      expect(mockBase.select).toHaveBeenCalledWith({
        filterByFormula: `FIND('RPT123', ARRAYJOIN({Report ID}, ',')) > 0`
      });
    });
  });

  describe('Data Transformation', () => {
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

    it('should transform listing to property', () => {
      const result = service.transformListingToProperty(mockListing);

      expect(result).toEqual({
        mlsNumber: 'LST456',
        address: '123 Test St',
        listPrice: 500000,
        soldPrice: 490000,
        sqft: 2000,
        yearBuilt: 2000,
        daysOnMarket: 30,
        pool: true,
        pricePerSqft: 250, // 500000 / 2000
        city: '',
        bedrooms: 0,
        bathrooms: '0/0/0',
        garage: '',
        acres: 0,
        saleToListRatio: 0.98 // 490000 / 500000
      });
    });
  });

  describe('Batch Operations', () => {
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

    it('should create listings in batches', async () => {
      mockBase.create.mockImplementation(([data]) => [{
        id: `rec${Date.now()}`,
        fields: {
          'Listing ID': `LST${Date.now()}`,
          ...data.fields
        }
      }]);

      const result = await service.batchCreateListings(mockListings);

      expect(result).toHaveLength(2);
      expect(mockBase.create).toHaveBeenCalledTimes(2);
      expect(result[0].fields['Address']).toBe('123 Test St');
      expect(result[1].fields['Address']).toBe('456 Test Ave');
    });
  });
}); 