import { extractMLSData, validateMLSReport } from '@/utils/mls-validator';
import type { MLSReport, Property, Statistics, MarketTrends, DemographicAnalysis } from '@/types/property';
import { mockMLSData } from '@/tests/test-utils';

describe('MLS Validator', () => {
  const sampleMLSText = `
    MLS#12345
    123 Main St, Plano
    List Price: $500,000
    4 beds, 2.5 baths
    2,500 sqft
    Built: 2010
    2 Car Garage
    0.25 acres
    
    MLS#67890
    456 Oak Ave, Frisco
    List Price: $600,000
    Sold Price: $595,000
    Sold Date: 2024-02-15
    Days on Market: 30
    3 beds, 2 baths
    2,000 sqft
    Built: 2015
    Pool
    0.2 acres
  `;

  describe('extractMLSData', () => {
    let result: MLSReport;

    beforeEach(() => {
      result = extractMLSData(sampleMLSText);
    });

    it('extracts active listings correctly', () => {
      expect(result.activeListings).toHaveLength(1);
      const listing = result.activeListings[0];
      expect(listing).toMatchObject<Partial<Property>>({
        mlsNumber: '12345',
        address: '123 Main St',
        city: 'Plano',
        listPrice: 500000,
        bedrooms: 4,
        bathrooms: '2/1/0',
        sqft: 2500,
        yearBuilt: 2010,
        garage: '2 Car',
        pool: false,
        acres: 0.25
      });
    });

    it('extracts closed listings correctly', () => {
      expect(result.closedListings).toHaveLength(1);
      const listing = result.closedListings[0];
      expect(listing).toMatchObject<Partial<Property>>({
        mlsNumber: '67890',
        address: '456 Oak Ave',
        city: 'Frisco',
        listPrice: 600000,
        soldPrice: 595000,
        soldDate: '2024-02-15',
        daysOnMarket: 30,
        bedrooms: 3,
        bathrooms: '2/0/0',
        sqft: 2000,
        yearBuilt: 2015,
        garage: '',
        pool: true,
        acres: 0.2
      });
    });

    it('calculates statistics correctly', () => {
      expect(result.statistics).toMatchObject<Partial<Statistics>>({
        averageListPrice: 550000,
        medianListPrice: 550000,
        averageSoldPrice: 595000,
        medianSoldPrice: 595000,
        averageDaysOnMarket: 30,
        medianDaysOnMarket: 30,
        totalActiveListings: 1,
        totalClosedSales: 1,
        pricePerSquareFoot: expect.any(Number),
        inventoryLevel: expect.any(Number),
        daysOfInventory: expect.any(Number),
        absorptionRate: expect.any(Number),
        newListings: expect.any(Number),
        closedListings: expect.any(Number),
        pendingListings: expect.any(Number),
        canceledListings: expect.any(Number),
        listToSoldRatio: expect.any(Number),
        monthsOfSupply: expect.any(Number)
      });
    });

    it('includes market trends data', () => {
      expect(result.marketTrends).toBeDefined();
      expect(result.marketTrends.forecast).toBeDefined();
      expect(result.marketTrends.forecast.nextMonth).toMatchObject({
        priceChange: expect.any(Number),
        confidence: expect.any(Number)
      });
    });

    it('includes school district information', () => {
      expect(result.schoolDistrict).toBeDefined();
      expect(result.schoolDistrict.name).toBeDefined();
      expect(result.schoolDistrict.rating).toBeGreaterThanOrEqual(0);
      expect(result.schoolDistrict.rating).toBeLessThanOrEqual(10);
      expect(result.schoolDistrict.schools).toBeDefined();
      expect(Array.isArray(result.schoolDistrict.schools.elementary)).toBe(true);
      expect(Array.isArray(result.schoolDistrict.schools.middle)).toBe(true);
      expect(Array.isArray(result.schoolDistrict.schools.high)).toBe(true);
    });

    it('includes demographic analysis', () => {
      expect(result.demographicAnalysis).toBeDefined();
      const { demographicAnalysis } = result;
      
      // Check main metrics
      expect(demographicAnalysis.population.value).toBeGreaterThan(0);
      expect(demographicAnalysis.medianAge.value).toBeGreaterThan(0);
      expect(demographicAnalysis.medianIncome.value).toBeGreaterThan(0);
      expect(demographicAnalysis.employmentRate.value).toBeGreaterThan(0);
      expect(demographicAnalysis.employmentRate.value).toBeLessThanOrEqual(1);

      // Check education levels
      expect(demographicAnalysis.educationLevels.highSchool.value).toBeGreaterThan(0);
      expect(demographicAnalysis.educationLevels.highSchool.value).toBeLessThanOrEqual(1);
      expect(demographicAnalysis.educationLevels.bachelors.value).toBeGreaterThan(0);
      expect(demographicAnalysis.educationLevels.bachelors.value).toBeLessThanOrEqual(1);
      expect(demographicAnalysis.educationLevels.graduate.value).toBeGreaterThan(0);
      expect(demographicAnalysis.educationLevels.graduate.value).toBeLessThanOrEqual(1);
    });
  });

  describe('validateMLSReport', () => {
    const validReport: MLSReport = mockMLSData;

    it('validates a correct report without errors', () => {
      const errors = validateMLSReport(validReport);
      expect(errors).toHaveLength(0);
    });

    it('detects missing required fields', () => {
      const invalidReport = {
        ...validReport,
        mlsNumber: '',
        listPrice: 0
      } as MLSReport;

      const errors = validateMLSReport(invalidReport);
      expect(errors).toContain('MLS number is required');
      expect(errors).toContain('List price is required');
    });

    it('validates numeric ranges', () => {
      const invalidReport = {
        ...validReport,
        bedrooms: -1,
        bathrooms: -0.5,
        squareFeet: -100
      } as MLSReport;

      const errors = validateMLSReport(invalidReport);
      expect(errors).toContain('Bedrooms must be greater than 0');
      expect(errors).toContain('Bathrooms must be greater than 0');
      expect(errors).toContain('Square feet must be greater than 0');
    });

    it('validates market trends data', () => {
      const invalidReport = {
        ...validReport,
        marketTrends: {
          ...validReport.marketTrends,
          forecast: {
            nextMonth: { priceChange: 0, confidence: 1.5 }, // Invalid confidence
            nextQuarter: { priceChange: 0, confidence: 0.7 },
            nextYear: { priceChange: 0, confidence: 0.6 }
          }
        }
      } as MLSReport;

      const errors = validateMLSReport(invalidReport);
      expect(errors).toContain('Invalid next month forecast data');
    });

    it('validates school district data', () => {
      const invalidReport = {
        ...validReport,
        schoolDistrict: {
          ...validReport.schoolDistrict,
          rating: 11 // Invalid rating
        }
      } as MLSReport;

      const errors = validateMLSReport(invalidReport);
      expect(errors).toContain('School district rating must be between 0 and 10');
    });

    it('validates demographic analysis', () => {
      const invalidReport = {
        ...validReport,
        demographicAnalysis: {
          ...validReport.demographicAnalysis,
          employmentRate: {
            value: 1.5, // Invalid rate
            trend: 'increasing',
            percentChange: 0.1
          }
        }
      } as MLSReport;

      const errors = validateMLSReport(invalidReport);
      expect(errors).toContain('Invalid employmentRate demographic metric');
    });
  });
}); 