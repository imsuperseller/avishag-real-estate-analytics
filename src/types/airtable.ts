export interface MLSReportRecord {
  id?: string;
  fields: {
    'Report ID': string;
    'Upload Date': string;
    'Uploaded By': string;
    'Extracted Data'?: string[];  // Links to Listings
    'Processing Status': 'Pending' | 'Completed' | 'Error';
    'Error Notes'?: string;
  };
}

export interface ListingRecord {
  id?: string;
  fields: {
    'Listing ID': string;
    'Report ID': string[];  // Link to MLS Reports
    'Listing Status': 'Active' | 'Closed';
    'Address': string;
    'List Price': number;
    'Sale Price'?: number;
    'Square Footage': number;
    'Year Built': number;
    'Days on Market': number;
    'Pool Availability': 'Yes' | 'No';
    'Rental Estimate'?: number;
  };
}

export interface InsightRecord {
  id?: string;
  fields: {
    'Insight ID': string;
    'Report ID': string[];  // Link to MLS Reports
    'Listing ID': string[];  // Link to Listings
    'Insight Type': 'Monthly Payment' | 'Rental Estimate' | 'Comparison';
    'Insight Data': string;
    'Calculation Date': string;
  };
}

export interface ConfigurationRecord {
  id?: string;
  fields: {
    'Config Name': string;
    'Value': number;
    'Last Updated': string;
    'Updated By': string;
  };
}

export const AIRTABLE_TABLES = {
  MLS_REPORTS: 'tblQspG6PbH42DpNe',
  LISTINGS: 'tblelYsBnXU2XgMKy',
  INSIGHTS: 'tblIxfwNLRewKnl90',
  CONFIGURATION: 'tblQNrqZxnsLN47kP'
} as const; 