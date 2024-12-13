/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { sampleMLSData } from './sample-mls-data';

describe('PropertyAnalysis', () => {
  it('renders market overview correctly', () => {
    render(
      <PropertyAnalysis
        data={sampleMLSData}
      />
    );

    // Check market overview section
    expect(screen.getByText(/Average Prices/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Listings:/i)).toBeInTheDocument();
    expect(screen.getByText(`$${sampleMLSData.statistics.averageListPrice.toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(`${sampleMLSData.statistics.averageDaysOnMarket} days`)).toBeInTheDocument();
  });

  it('displays active listings details', () => {
    render(
      <PropertyAnalysis
        data={sampleMLSData}
      />
    );

    // Check active listings section
    const activeListing = sampleMLSData.activeListings[0];
    expect(screen.getByText(activeListing.address)).toBeInTheDocument();
    expect(screen.getByText(`$${activeListing.listPrice.toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${activeListing.bedrooms}/${activeListing.bathrooms}`))).toBeInTheDocument();
    expect(screen.getByText(activeListing.sqft.toLocaleString())).toBeInTheDocument();
  });

  it('displays closed sales details', () => {
    render(
      <PropertyAnalysis
        data={sampleMLSData}
      />
    );

    const closedListing = sampleMLSData.closedListings[0];
    expect(screen.getByText(closedListing.address)).toBeInTheDocument();
    expect(screen.getByText(`$${closedListing.soldPrice?.toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${closedListing.bedrooms}/${closedListing.bathrooms}`))).toBeInTheDocument();
    expect(screen.getByText(closedListing.sqft.toLocaleString())).toBeInTheDocument();
  });

  it('shows and hides calculator on button click', () => {
    render(
      <PropertyAnalysis
        data={sampleMLSData}
      />
    );

    const showCalculatorButton = screen.getByText(/Show Calculator/i);
    fireEvent.click(showCalculatorButton);

    // Calculator should be visible
    expect(screen.getByText(/Hide Calculator/i)).toBeInTheDocument();

    // Click again to hide
    fireEvent.click(screen.getByText(/Hide Calculator/i));
    expect(screen.getByText(/Show Calculator/i)).toBeInTheDocument();
  });

  it('displays market trends and statistics', () => {
    render(
      <PropertyAnalysis
        data={sampleMLSData}
      />
    );

    // Check market statistics
    expect(screen.getByText(/Median Prices/i)).toBeInTheDocument();
    expect(screen.getByText(`$${sampleMLSData.statistics.medianListPrice.toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(`$${sampleMLSData.statistics.medianSoldPrice.toLocaleString()}`)).toBeInTheDocument();
  });

  it('handles empty MLS data gracefully', () => {
    const emptyMLSData = {
      ...sampleMLSData,
      activeListings: [],
      closedListings: []
    };

    render(
      <PropertyAnalysis
        data={emptyMLSData}
      />
    );

    expect(screen.queryByText(/123 Main Street/)).not.toBeInTheDocument();
    expect(screen.queryByText(/456 Oak Avenue/)).not.toBeInTheDocument();
  });

  it('displays property features correctly', () => {
    render(
      <PropertyAnalysis
        data={sampleMLSData}
      />
    );

    const activeListing = sampleMLSData.activeListings[0];
    
    // Check property features
    expect(screen.getByText(new RegExp(`${activeListing.yearBuilt}`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`\\$${activeListing.pricePerSqft}`))).toBeInTheDocument();
  });

  it('displays price trends correctly', () => {
    render(
      <PropertyAnalysis
        data={sampleMLSData}
      />
    );

    const closedListing = sampleMLSData.closedListings[0];
    expect(screen.getByText(new RegExp(`${closedListing.daysOnMarket}`))).toBeInTheDocument();
  });

  it('handles accessibility requirements', () => {
    render(
      <PropertyAnalysis
        data={sampleMLSData}
      />
    );

    // Check for headings
    expect(screen.getByRole('heading', { name: /Average Prices/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Active Listings/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Closed Listings/i })).toBeInTheDocument();
  });

  it('provides responsive layout classes', () => {
    const { container } = render(
      <PropertyAnalysis
        data={sampleMLSData}
      />
    );

    // Check for responsive layout classes
    expect(container.querySelector('.grid-cols-1')).toBeInTheDocument();
    expect(container.querySelector('.md\\:grid-cols-3')).toBeInTheDocument();
  });
}); 