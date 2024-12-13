import Airtable, { FieldSet } from 'airtable';
import { 
  MLSReportRecord, 
  ListingRecord, 
  InsightRecord, 
  ConfigurationRecord,
  AIRTABLE_TABLES 
} from '../types/airtable';
import { Property, MLSReport } from '../types/property';

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  throw new Error('Airtable configuration missing');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export class AirtableService {
  private static instance: AirtableService;

  private constructor() {}

  public static getInstance(): AirtableService {
    if (!AirtableService.instance) {
      AirtableService.instance = new AirtableService();
    }
    return AirtableService.instance;
  }

  // MLS Reports
  async createMLSReport(report: Omit<MLSReportRecord['fields'], 'Report ID'>): Promise<MLSReportRecord> {
    const reportId = `RPT${Date.now()}`;
    const record = await base<FieldSet>(AIRTABLE_TABLES.MLS_REPORTS).create([{
      fields: {
        'Report ID': reportId,
        ...report
      }
    }]);
    return record[0] as unknown as MLSReportRecord;
  }

  async getMLSReport(reportId: string): Promise<MLSReportRecord | null> {
    try {
      const records = await base<FieldSet>(AIRTABLE_TABLES.MLS_REPORTS)
        .select({
          filterByFormula: `{Report ID} = '${reportId}'`
        })
        .firstPage();
      return records[0] as unknown as MLSReportRecord;
    } catch (error) {
      console.error('Error fetching MLS report:', error);
      return null;
    }
  }

  // Listings
  async createListing(listing: Omit<ListingRecord['fields'], 'Listing ID'>): Promise<ListingRecord> {
    const listingId = `LST${Date.now()}`;
    const record = await base<FieldSet>(AIRTABLE_TABLES.LISTINGS).create([{
      fields: {
        'Listing ID': listingId,
        ...listing
      }
    }]);
    return record[0] as unknown as ListingRecord;
  }

  async getListingsByReport(reportId: string): Promise<ListingRecord[]> {
    try {
      const records = await base<FieldSet>(AIRTABLE_TABLES.LISTINGS)
        .select({
          filterByFormula: `FIND('${reportId}', ARRAYJOIN({Report ID}, ',')) > 0`
        })
        .all();
      return records as unknown as ListingRecord[];
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  }

  // Insights
  async createInsight(insight: Omit<InsightRecord['fields'], 'Insight ID'>): Promise<InsightRecord> {
    const insightId = `INS${Date.now()}`;
    const record = await base<FieldSet>(AIRTABLE_TABLES.INSIGHTS).create([{
      fields: {
        'Insight ID': insightId,
        ...insight
      }
    }]);
    return record[0] as unknown as InsightRecord;
  }

  async getInsightsByListing(listingId: string): Promise<InsightRecord[]> {
    try {
      const records = await base<FieldSet>(AIRTABLE_TABLES.INSIGHTS)
        .select({
          filterByFormula: `FIND('${listingId}', ARRAYJOIN({Listing ID}, ',')) > 0`
        })
        .all();
      return records as unknown as InsightRecord[];
    } catch (error) {
      console.error('Error fetching insights:', error);
      return [];
    }
  }

  // Configuration
  async getConfiguration(configName: string): Promise<ConfigurationRecord | null> {
    try {
      const records = await base<FieldSet>(AIRTABLE_TABLES.CONFIGURATION)
        .select({
          filterByFormula: `{Config Name} = '${configName}'`
        })
        .firstPage();
      return records[0] as unknown as ConfigurationRecord;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      return null;
    }
  }

  // Data Transformation
  transformListingToProperty(listing: ListingRecord): Property {
    return {
      mlsNumber: listing.fields['Listing ID'],
      address: listing.fields['Address'],
      listPrice: listing.fields['List Price'],
      soldPrice: listing.fields['Sale Price'],
      sqft: listing.fields['Square Footage'],
      yearBuilt: listing.fields['Year Built'],
      daysOnMarket: listing.fields['Days on Market'],
      pool: listing.fields['Pool Availability'] === 'Yes',
      pricePerSqft: listing.fields['List Price'] / listing.fields['Square Footage'],
      // Additional fields will be populated from MLS data
      city: '', // Will be extracted from address
      bedrooms: 0,
      bathrooms: '0/0/0',
      garage: '',
      acres: 0,
      saleToListRatio: listing.fields['Sale Price'] 
        ? listing.fields['Sale Price'] / listing.fields['List Price']
        : undefined
    };
  }

  // Batch Operations
  async batchCreateListings(listings: Array<Omit<ListingRecord['fields'], 'Listing ID'>>): Promise<ListingRecord[]> {
    const createdListings: ListingRecord[] = [];
    // Process in batches of 10 (Airtable's limit)
    for (let i = 0; i < listings.length; i += 10) {
      const batch = listings.slice(i, i + 10);
      const records = await Promise.all(
        batch.map(listing => this.createListing(listing))
      );
      createdListings.push(...records);
    }
    return createdListings;
  }
} 