import { saveMLSData, createMLSReport, createListings, createInsight, getConfiguration, updateMLSReportStatus } from '@/utils/airtable';
import type { MLSReport } from '@/types/property';
import { mockMLSData } from '@/tests/test-utils';

// Mock Airtable
jest.mock('airtable', () => {
  return class MockAirtable {
    static apiKey: string;
    static base: string;

    constructor({ apiKey }: { apiKey: string }) {
      MockAirtable.apiKey = apiKey;
    }

    base(baseId: string) {
      MockAirtable.base = baseId;
      return {
        create: jest.fn().mockImplementation((data) => {
          if (Array.isArray(data)) {
            return Promise.resolve(data.map((record, index) => ({
              id: `MOCK_ID_${index}`,
              fields: record.fields
            })));
          }
          return Promise.resolve({
            id: 'MOCK_ID',
            fields: data
          });
        }),
        update: jest.fn().mockResolvedValue({ id: 'MOCK_ID', fields: {} }),
        select: jest.fn().mockReturnValue({
          firstPage: jest.fn().mockResolvedValue([{
            id: 'MOCK_CONFIG_ID',
            fields: { Value: 0.05 }
          }])
        })
      };
    }
  };
});

describe('Airtable Integration', () => {
  const sampleMLSData: MLSReport = mockMLSData;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMLSReport', () => {
    it('creates a new MLS report record', async () => {
      const reportId = await createMLSReport(sampleMLSData);
      expect(reportId).toBe('MOCK_ID');
    });

    it('sets correct initial status', async () => {
      const reportId = await createMLSReport(sampleMLSData);
      expect(reportId).toBeDefined();
      // Verify the created record had the correct status
      const mockAirtable = jest.requireMock('airtable');
      const createCall = mockAirtable.mock.results[0].value.base().create.mock.calls[0][0];
      expect(createCall.fields['Processing Status']).toBe('Pending');
    });
  });

  describe('createListings', () => {
    it('creates records for all properties', async () => {
      const reportId = 'MOCK_REPORT_ID';
      const properties = [...sampleMLSData.activeListings, ...sampleMLSData.closedListings];
      const listingIds = await createListings(reportId, properties);
      
      expect(listingIds).toHaveLength(properties.length);
      expect(listingIds[0]).toBe('MOCK_ID_0');
      expect(listingIds[1]).toBe('MOCK_ID_1');
    });

    it('sets correct listing status for active and closed listings', async () => {
      const reportId = 'MOCK_REPORT_ID';
      const properties = [...sampleMLSData.activeListings, ...sampleMLSData.closedListings];
      await createListings(reportId, properties);

      const mockAirtable = jest.requireMock('airtable');
      const createCalls = mockAirtable.mock.results[0].value.base().create.mock.calls[0][0];
      
      expect(createCalls[0].fields['Listing Status']).toBe('Active');
      expect(createCalls[1].fields['Listing Status']).toBe('Closed');
    });
  });

  describe('createInsight', () => {
    it('creates an insight record with correct fields', async () => {
      const reportId = 'MOCK_REPORT_ID';
      const listingId = 'MOCK_LISTING_ID';
      const insightId = await createInsight(
        reportId,
        listingId,
        'Monthly Payment',
        JSON.stringify({ payment: 2500, rate: 0.045 })
      );

      expect(insightId).toBe('MOCK_ID');
      
      const mockAirtable = jest.requireMock('airtable');
      const createCall = mockAirtable.mock.results[0].value.base().create.mock.calls[0][0];
      expect(createCall.fields['Report ID']).toEqual([reportId]);
      expect(createCall.fields['Listing ID']).toEqual([listingId]);
      expect(createCall.fields['Insight Type']).toBe('Monthly Payment');
    });
  });

  describe('getConfiguration', () => {
    it('retrieves configuration value', async () => {
      const value = await getConfiguration('InterestRate');
      expect(value).toBe(0.05);
    });

    it('returns null for non-existent configuration', async () => {
      const mockAirtable = jest.requireMock('airtable');
      mockAirtable.mock.results[0].value.base().select().firstPage.mockResolvedValueOnce([]);
      
      const value = await getConfiguration('NonExistent');
      expect(value).toBeNull();
    });
  });

  describe('updateMLSReportStatus', () => {
    it('updates report status to completed', async () => {
      await updateMLSReportStatus('MOCK_ID', 'Completed');
      
      const mockAirtable = jest.requireMock('airtable');
      const updateCall = mockAirtable.mock.results[0].value.base().update.mock.calls[0];
      expect(updateCall[0]).toBe('MOCK_ID');
      expect(updateCall[1]['Processing Status']).toBe('Completed');
    });

    it('updates report status with error notes', async () => {
      const errorNotes = 'Failed to process data';
      await updateMLSReportStatus('MOCK_ID', 'Error', errorNotes);
      
      const mockAirtable = jest.requireMock('airtable');
      const updateCall = mockAirtable.mock.results[0].value.base().update.mock.calls[0];
      expect(updateCall[0]).toBe('MOCK_ID');
      expect(updateCall[1]['Processing Status']).toBe('Error');
      expect(updateCall[1]['Error Notes']).toBe(errorNotes);
    });
  });

  describe('saveMLSData', () => {
    it('saves complete MLS data successfully', async () => {
      await expect(saveMLSData(sampleMLSData)).resolves.not.toThrow();
    });

    it('handles errors during save process', async () => {
      const mockAirtable = jest.requireMock('airtable');
      mockAirtable.mock.results[0].value.base().create.mockRejectedValueOnce(new Error('Airtable error'));

      await expect(saveMLSData(sampleMLSData)).rejects.toThrow('Airtable error');
    });
  });
}); 