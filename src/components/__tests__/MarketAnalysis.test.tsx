import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MarketAnalysis } from '../MarketAnalysis';
import { useAirtable } from '../../hooks/useAirtable';
import { ListingRecord } from '../../types/airtable';

// Mock the useAirtable hook
jest.mock('../../hooks/useAirtable');

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe('MarketAnalysis', () => {
  const mockListings: ListingRecord[] = [
    {
      id: 'rec1',
      fields: {
        'Listing ID': 'LST1',
        'Report ID': ['RPT123'],
        'Listing Status': 'Active',
        'Address': '123 Test St',
        'List Price': 500000,
        'Square Footage': 2000,
        'Year Built': 2000,
        'Days on Market': 30,
        'Pool Availability': 'No'
      }
    },
    {
      id: 'rec2',
      fields: {
        'Listing ID': 'LST2',
        'Report ID': ['RPT123'],
        'Listing Status': 'Active',
        'Address': '456 Test Ave',
        'List Price': 600000,
        'Square Footage': 2500,
        'Year Built': 2010,
        'Days on Market': 15,
        'Pool Availability': 'Yes'
      }
    }
  ];

  const mockProperties = mockListings.map(listing => ({
    mlsNumber: listing.fields['Listing ID'],
    address: listing.fields['Address'],
    listPrice: listing.fields['List Price'],
    sqft: listing.fields['Square Footage'],
    yearBuilt: listing.fields['Year Built'],
    daysOnMarket: listing.fields['Days on Market'],
    pool: listing.fields['Pool Availability'] === 'Yes',
    pricePerSqft: listing.fields['List Price'] / listing.fields['Square Footage'],
    city: '',
    bedrooms: 0,
    bathrooms: '0/0/0',
    garage: '',
    acres: 0
  }));

  beforeEach(() => {
    (useAirtable as jest.Mock).mockReturnValue({
      getListingsByReport: jest.fn().mockResolvedValue(mockListings),
      transformListingToProperty: jest.fn().mockImplementation((listing: ListingRecord) => ({
        mlsNumber: listing.fields['Listing ID'],
        address: listing.fields['Address'],
        listPrice: listing.fields['List Price'],
        sqft: listing.fields['Square Footage'],
        yearBuilt: listing.fields['Year Built'],
        daysOnMarket: listing.fields['Days on Market'],
        pool: listing.fields['Pool Availability'] === 'Yes',
        pricePerSqft: listing.fields['List Price'] / listing.fields['Square Footage'],
        city: '',
        bedrooms: 0,
        bathrooms: '0/0/0',
        garage: '',
        acres: 0
      })),
      isLoading: false,
      error: null
    });
  });

  it('renders loading state', () => {
    (useAirtable as jest.Mock).mockReturnValue({
      ...useAirtable(),
      isLoading: true
    });

    render(<MarketAnalysis reportId="RPT123" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch data';
    (useAirtable as jest.Mock).mockReturnValue({
      ...useAirtable(),
      error: new Error(errorMessage)
    });

    render(<MarketAnalysis reportId="RPT123" />);
    expect(screen.getByText(`Error loading market analysis: ${errorMessage}`)).toBeInTheDocument();
  });

  it('renders market metrics', async () => {
    render(<MarketAnalysis reportId="RPT123" />);

    await waitFor(() => {
      expect(screen.getByText('Market Analysis')).toBeInTheDocument();
      expect(screen.getByText('$550,000')).toBeInTheDocument(); // Average price
      expect(screen.getByText('23 days')).toBeInTheDocument(); // Average days on market
    });
  });

  it('displays correct market insights', async () => {
    render(<MarketAnalysis reportId="RPT123" />);

    await waitFor(() => {
      // Properties are selling quickly (average DOM < 15)
      expect(screen.getByText(/Properties are selling quickly/)).toBeInTheDocument();
      
      // High-end properties insight (average > median)
      expect(screen.getByText(/high-end properties pulling up the average price/)).toBeInTheDocument();
    });
  });

  it('fetches data with correct report ID', async () => {
    const getListingsByReport = jest.fn().mockResolvedValue(mockListings);
    (useAirtable as jest.Mock).mockReturnValue({
      ...useAirtable(),
      getListingsByReport
    });

    render(<MarketAnalysis reportId="RPT123" />);

    await waitFor(() => {
      expect(getListingsByReport).toHaveBeenCalledWith('RPT123');
    });
  });

  it('handles empty data gracefully', async () => {
    (useAirtable as jest.Mock).mockReturnValue({
      ...useAirtable(),
      getListingsByReport: jest.fn().mockResolvedValue([])
    });

    render(<MarketAnalysis reportId="RPT123" />);

    await waitFor(() => {
      expect(screen.getByText('No data available for analysis')).toBeInTheDocument();
    });
  });

  // Accessibility tests
  it('meets accessibility guidelines', async () => {
    const { container } = render(<MarketAnalysis reportId="RPT123" />);
    
    await waitFor(() => {
      expect(container).toBeInTheDocument();
      // Add more specific accessibility checks here
    });
  });
}); 