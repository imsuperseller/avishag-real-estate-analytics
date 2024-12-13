import type {
  MLSReport,
  Property,
  MarketTrends,
  Statistics,
  DemographicAnalysis,
  SchoolInfo,
  DemographicMetric
} from '@/types/property';

function isDemographicMetric(metric: any): metric is DemographicMetric {
  return (
    typeof metric === 'object' &&
    'value' in metric &&
    'trend' in metric &&
    'percentChange' in metric
  );
}

export function validateMLSReport(data: MLSReport): string[] {
  const errors: string[] = [];

  // Validate required fields
  if (!data.mlsNumber) errors.push('MLS number is required');
  if (!data.listPrice) errors.push('List price is required');
  if (!data.propertyType) errors.push('Property type is required');
  if (!data.address) errors.push('Address is required');
  if (!data.features) errors.push('Features are required');
  if (!data.photos) errors.push('Photos are required');

  // Validate address fields
  if (data.address) {
    if (!data.address.street) errors.push('Street address is required');
    if (!data.address.city) errors.push('City is required');
    if (!data.address.state) errors.push('State is required');
    if (!data.address.zipCode) errors.push('ZIP code is required');
  }

  // Validate numeric fields
  if (data.bedrooms <= 0) errors.push('Bedrooms must be greater than 0');
  if (data.bathrooms <= 0) errors.push('Bathrooms must be greater than 0');
  if (data.squareFeet <= 0) errors.push('Square feet must be greater than 0');
  if (data.yearBuilt <= 1800) errors.push('Year built must be after 1800');
  if (data.lotSize <= 0) errors.push('Lot size must be greater than 0');

  // Validate market trends
  validateMarketTrends(data.marketTrends, errors);

  // Validate statistics
  validateStatistics(data.statistics, errors);

  // Validate school district
  validateSchoolDistrict(data.schoolDistrict, errors);

  // Validate demographic analysis
  validateDemographicAnalysis(data.demographicAnalysis, errors);

  return errors;
}

function validateMarketTrends(trends: MarketTrends, errors: string[]): void {
  if (!trends.priceHistory || !Array.isArray(trends.priceHistory)) {
    errors.push('Price history must be an array');
    return;
  }

  if (!trends.seasonality || !Array.isArray(trends.seasonality)) {
    errors.push('Seasonality data must be an array');
    return;
  }

  if (!trends.forecast) {
    errors.push('Market forecast is required');
    return;
  }

  // Validate forecast data
  const { nextMonth, nextQuarter, nextYear } = trends.forecast;
  if (!nextMonth || typeof nextMonth.priceChange !== 'number' || typeof nextMonth.confidence !== 'number') {
    errors.push('Invalid next month forecast data');
  }
  if (!nextQuarter || typeof nextQuarter.priceChange !== 'number' || typeof nextQuarter.confidence !== 'number') {
    errors.push('Invalid next quarter forecast data');
  }
  if (!nextYear || typeof nextYear.priceChange !== 'number' || typeof nextYear.confidence !== 'number') {
    errors.push('Invalid next year forecast data');
  }
}

function validateStatistics(stats: Statistics, errors: string[]): void {
  const requiredFields = [
    'averageDaysOnMarket',
    'medianDaysOnMarket',
    'totalActiveListings',
    'totalClosedSales',
    'averagePrice',
    'medianPrice',
    'pricePerSquareFoot',
    'inventoryLevel',
    'daysOfInventory',
    'absorptionRate',
    'newListings',
    'closedListings',
    'pendingListings',
    'canceledListings',
    'averageListPrice',
    'medianListPrice',
    'averageSoldPrice',
    'medianSoldPrice',
    'listToSoldRatio',
    'monthsOfSupply'
  ] as const;

  requiredFields.forEach(field => {
    if (typeof stats[field] !== 'number') {
      errors.push(`Invalid or missing ${field} in statistics`);
    }
  });
}

function validateSchoolDistrict(district: MLSReport['schoolDistrict'], errors: string[]): void {
  if (!district.name) {
    errors.push('School district name is required');
  }
  if (typeof district.rating !== 'number' || district.rating < 0 || district.rating > 10) {
    errors.push('School district rating must be between 0 and 10');
  }
  if (!district.schools || !district.schools.elementary || !district.schools.middle || !district.schools.high) {
    errors.push('School information is incomplete');
  }
}

function validateDemographicAnalysis(analysis: DemographicAnalysis, errors: string[]): void {
  const metrics = ['population', 'medianAge', 'medianIncome', 'employmentRate'] as const;
  metrics.forEach(metric => {
    const value = analysis[metric];
    if (!isDemographicMetric(value)) {
      errors.push(`Invalid ${metric} demographic metric`);
    }
  });

  const { educationLevels } = analysis;
  if (!educationLevels) {
    errors.push('Education levels are required');
    return;
  }

  const educationMetrics = ['highSchool', 'bachelors', 'graduate'] as const;
  educationMetrics.forEach(level => {
    const value = educationLevels[level];
    if (!isDemographicMetric(value)) {
      errors.push(`Invalid ${level} education level metric`);
    }
  });
}

export function extractMLSData(pdfText: string): MLSReport {
  // Implementation of PDF text extraction logic
  // This is a placeholder that should be replaced with actual implementation
  throw new Error('Not implemented');
} 