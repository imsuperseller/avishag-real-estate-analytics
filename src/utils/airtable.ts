import Airtable from 'airtable';
import type { Property, MLSReport } from '@/types/property';
import type { MLSReportRecord, ListingRecord, InsightRecord, ConfigurationRecord } from '@/types/airtable';
import { AIRTABLE_TABLES } from '@/types/airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

export async function createMLSReport(mlsData: MLSReport): Promise<string> {
  const reportRecord = await base(AIRTABLE_TABLES.MLS_REPORTS).create({
    'Report ID': `RPT${Date.now()}`,
    'Upload Date': new Date().toISOString(),
    'Uploaded By': 'System',
    'Processing Status': 'Pending'
  });

  return reportRecord.id;
}

export async function createListings(reportId: string, properties: Property[]): Promise<string[]> {
  const listingRecords = properties.map(property => ({
    fields: {
      'Listing ID': `LST${Date.now()}-${property.mlsNumber}`,
      'Report ID': [reportId],
      'Listing Status': property.soldPrice ? 'Closed' : 'Active',
      'Address': property.address,
      'List Price': property.listPrice,
      'Sale Price': property.soldPrice,
      'Square Footage': property.sqft,
      'Year Built': property.yearBuilt,
      'Days on Market': property.daysOnMarket || 0,
      'Pool Availability': property.pool ? 'Yes' : 'No'
    }
  }));

  const records = await base(AIRTABLE_TABLES.LISTINGS).create(listingRecords);
  return records.map(record => record.id);
}

export async function createInsight(
  reportId: string, 
  listingId: string, 
  type: 'Monthly Payment' | 'Rental Estimate' | 'Comparison',
  data: string
): Promise<string> {
  const insightRecord = await base(AIRTABLE_TABLES.INSIGHTS).create({
    'Insight ID': `INS${Date.now()}`,
    'Report ID': [reportId],
    'Listing ID': [listingId],
    'Insight Type': type,
    'Insight Data': data,
    'Calculation Date': new Date().toISOString()
  });

  return insightRecord.id;
}

export async function getConfiguration(configName: string): Promise<number | null> {
  const records = await base(AIRTABLE_TABLES.CONFIGURATION)
    .select({
      filterByFormula: `{Config Name} = '${configName}'`
    })
    .firstPage();

  if (records && records.length > 0) {
    return records[0].fields['Value'] as number;
  }

  return null;
}

export async function updateMLSReportStatus(
  reportId: string, 
  status: 'Completed' | 'Error',
  errorNotes?: string
): Promise<void> {
  await base(AIRTABLE_TABLES.MLS_REPORTS).update(reportId, {
    'Processing Status': status,
    'Error Notes': errorNotes
  });
}

export async function saveMLSData(mlsData: MLSReport): Promise<void> {
  try {
    // Create MLS Report
    const reportId = await createMLSReport(mlsData);

    // Create Listings
    const allProperties = [...mlsData.activeListings, ...mlsData.closedListings];
    const listingIds = await createListings(reportId, allProperties);

    // Update MLS Report with listing references
    await base(AIRTABLE_TABLES.MLS_REPORTS).update(reportId, {
      'Extracted Data': listingIds,
      'Processing Status': 'Completed'
    });

  } catch (error) {
    console.error('Error saving MLS data:', error);
    throw error;
  }
} 