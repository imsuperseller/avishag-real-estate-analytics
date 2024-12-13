import type { 
  MLSReport, 
  Property, 
  SchoolInfo, 
  DemographicMetric,
  MarketTrends,
  PricePoint
} from '@/types/property';

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Constants for validation thresholds
const THRESHOLDS = {
  PRICE_VOLATILITY: 0.15,           // 15% max monthly change
  MAX_PRICE_DROP: 0.20,             // 20% max price drop
  MIN_CONFIDENCE: 0.5,              // 50% minimum confidence
  MAX_CONFIDENCE: 1.0,              // 100% maximum confidence
  MAX_SCHOOL_DISTANCE: 10,          // 10 miles max school distance
  MIN_STUDENT_TEACHER_RATIO: 10,    // Minimum reasonable ratio
  MAX_STUDENT_TEACHER_RATIO: 30,    // Maximum reasonable ratio
  MAX_ABSORPTION_RATE: 100,         // Maximum absorption rate
  MAX_PRICE_TO_INCOME_RATIO: 5,     // Maximum price to income ratio
  MAX_PRICE_TO_RENT_RATIO: 30,      // Maximum price to rent ratio
  MAX_SEASONAL_VOLUME_CHANGE: 0.5,  // 50% max seasonal volume change
  MAX_YOY_GROWTH: 0.30,            // 30% maximum year-over-year growth
  MAX_PRICE_DEVIATION: 0.5,         // 50% max deviation from median
  MIN_DAYS_ON_MARKET: 5,           // Minimum reasonable DOM
  MAX_POPULATION_DENSITY: 10000,    // per square mile
} as const;

// Market condition thresholds
const MARKET_CONDITIONS = {
  BUYERS_MARKET: {
    MIN_MONTHS_SUPPLY: 6,
    MIN_DAYS_ON_MARKET: 60,
    MAX_ABSORPTION_RATE: 40,
    MAX_LIST_TO_SOLD_RATIO: 0.95
  },
  SELLERS_MARKET: {
    MAX_MONTHS_SUPPLY: 3,
    MAX_DAYS_ON_MARKET: 30,
    MIN_ABSORPTION_RATE: 60,
    MIN_LIST_TO_SOLD_RATIO: 0.98
  }
} as const;

// Type guards
function isDemographicMetric(value: unknown): value is DemographicMetric {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'trend' in value &&
    'percentChange' in value &&
    typeof (value as DemographicMetric).value === 'number' &&
    ['increasing', 'decreasing', 'stable'].includes((value as DemographicMetric).trend) &&
    typeof (value as DemographicMetric).percentChange === 'number'
  );
}

function isEducationLevels(value: unknown): value is Record<string, DemographicMetric> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(isDemographicMetric)
  );
}

function isPricePoint(value: unknown): value is PricePoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    'date' in value &&
    'price' in value &&
    'volume' in value &&
    typeof (value as PricePoint).date === 'string' &&
    typeof (value as PricePoint).price === 'number' &&
    typeof (value as PricePoint).volume === 'number'
  );
}

function isSchoolInfo(value: unknown): value is SchoolInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'rating' in value &&
    'type' in value &&
    'distance' in value &&
    'enrollment' in value &&
    'studentTeacherRatio' in value &&
    typeof (value as SchoolInfo).name === 'string' &&
    typeof (value as SchoolInfo).rating === 'number' &&
    ['elementary', 'middle', 'high'].includes((value as SchoolInfo).type) &&
    typeof (value as SchoolInfo).distance === 'number' &&
    typeof (value as SchoolInfo).enrollment === 'number' &&
    typeof (value as SchoolInfo).studentTeacherRatio === 'number'
  );
}

// Additional type guards for complex structures
function isMarketTrends(value: unknown): value is MLSReport['marketTrends'] {
  return (
    typeof value === 'object' &&
    value !== null &&
    'priceHistory' in value &&
    'seasonality' in value &&
    'forecast' in value &&
    Array.isArray((value as MLSReport['marketTrends']).priceHistory) &&
    Array.isArray((value as MLSReport['marketTrends']).seasonality) &&
    (value as MLSReport['marketTrends']).priceHistory.every(isPricePoint) &&
    (value as MLSReport['marketTrends']).seasonality.every(isSeasonalityData) &&
    isForecastData((value as MLSReport['marketTrends']).forecast)
  );
}

function isSeasonalityData(value: unknown): value is MLSReport['marketTrends']['seasonality'][0] {
  return (
    typeof value === 'object' &&
    value !== null &&
    'month' in value &&
    'averagePrice' in value &&
    'salesVolume' in value &&
    typeof (value as any).month === 'number' &&
    typeof (value as any).averagePrice === 'number' &&
    typeof (value as any).salesVolume === 'number'
  );
}

function isForecastData(value: unknown): value is MLSReport['marketTrends']['forecast'] {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nextMonth' in value &&
    'nextQuarter' in value &&
    'nextYear' in value &&
    isForecastMetric((value as any).nextMonth) &&
    isForecastMetric((value as any).nextQuarter) &&
    isForecastMetric((value as any).nextYear)
  );
}

function isForecastMetric(value: unknown): value is { priceChange: number; confidence: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'priceChange' in value &&
    'confidence' in value &&
    typeof (value as any).priceChange === 'number' &&
    typeof (value as any).confidence === 'number'
  );
}

function isStatistics(value: unknown): value is MLSReport['statistics'] {
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
  ];

  return (
    typeof value === 'object' &&
    value !== null &&
    requiredFields.every(field => 
      field in value && typeof (value as any)[field] === 'number'
    )
  );
}

function isProperty(value: unknown): value is Property {
  const requiredFields = {
    mlsNumber: 'string',
    address: 'string',
    city: 'string',
    listPrice: 'number',
    bedrooms: 'number',
    bathrooms: 'string',
    sqft: 'number',
    yearBuilt: 'number',
    garage: 'string',
    pool: 'boolean',
    acres: 'number',
    pricePerSqft: 'number'
  } as const;

  return (
    typeof value === 'object' &&
    value !== null &&
    Object.entries(requiredFields).every(([field, type]) =>
      field in value && typeof (value as any)[field] === type
    )
  );
}

export function validatePricePoint(value: unknown): asserts value is PricePoint {
  if (!isPricePoint(value)) {
    throw new ValidationError('Invalid price point structure', 'structure');
  }

  const dateRegex = /^\d{4}-\d{2}$/;
  if (!dateRegex.test(value.date)) {
    throw new ValidationError('Invalid date format. Expected YYYY-MM', 'date');
  }

  if (value.price <= 0) {
    throw new ValidationError('Invalid price. Must be a positive number', 'price');
  }

  if (value.volume < 0) {
    throw new ValidationError('Invalid volume. Must be a positive number', 'volume');
  }
}

export function validateMarketTrends(value: unknown): asserts value is MLSReport['marketTrends'] {
  if (!isMarketTrends(value)) {
    throw new ValidationError('Invalid market trends structure', 'structure');
  }

  // Validate price history chronology and volatility
  value.priceHistory.forEach((point, index) => {
    validatePricePoint(point);
    if (index > 0) {
      const prevPoint = value.priceHistory[index - 1];
      if (point.date <= prevPoint.date) {
        throw new ValidationError('Price history must be in chronological order', `priceHistory[${index}].date`);
      }
      const priceChange = Math.abs((point.price - prevPoint.price) / prevPoint.price);
      if (priceChange > THRESHOLDS.PRICE_VOLATILITY) {
        throw new ValidationError('Price volatility exceeds market threshold', `priceHistory[${index}].price`);
      }
    }
  });

  // Validate seasonality
  value.seasonality.forEach((point, index) => {
    if (point.month < 1 || point.month > 12) {
      throw new ValidationError('Invalid month. Must be between 1 and 12', `seasonality[${index}].month`);
    }
    if (index > 0) {
      const volumeChange = Math.abs((point.salesVolume - value.seasonality[index - 1].salesVolume) 
        / value.seasonality[index - 1].salesVolume);
      if (volumeChange > THRESHOLDS.MAX_SEASONAL_VOLUME_CHANGE) {
        throw new ValidationError('Invalid seasonal volume pattern', `seasonality[${index}].salesVolume`);
      }
    }
  });

  // Validate forecasts
  Object.entries(value.forecast).forEach(([period, forecast]) => {
    if (forecast.confidence < THRESHOLDS.MIN_CONFIDENCE || forecast.confidence > THRESHOLDS.MAX_CONFIDENCE) {
      throw new ValidationError('Invalid confidence value', `forecast.${period}.confidence`);
    }
    if (period === 'nextYear' && Math.abs(forecast.priceChange) > THRESHOLDS.MAX_YOY_GROWTH) {
      throw new ValidationError('Annual growth rate exceeds historical bounds', `forecast.${period}.priceChange`);
    }
  });
}

export function validateSchoolInfo(value: unknown): asserts value is SchoolInfo {
  if (!isSchoolInfo(value)) {
    throw new ValidationError('Invalid school info structure', 'structure');
  }

  if (value.rating < 0 || value.rating > 10) {
    throw new ValidationError('Invalid school rating. Must be between 0 and 10', 'rating');
  }

  if (!['elementary', 'middle', 'high'].includes(value.type)) {
    throw new ValidationError('Invalid school type. Must be elementary, middle, or high', 'type');
  }

  if (value.distance < 0 || value.distance > THRESHOLDS.MAX_SCHOOL_DISTANCE) {
    throw new ValidationError('School district outside reasonable distance', 'distance');
  }

  if (value.studentTeacherRatio < THRESHOLDS.MIN_STUDENT_TEACHER_RATIO || 
      value.studentTeacherRatio > THRESHOLDS.MAX_STUDENT_TEACHER_RATIO) {
    throw new ValidationError('Invalid student-teacher ratio', 'studentTeacherRatio');
  }
}

export function validateDemographicMetric(value: unknown): asserts value is DemographicMetric {
  if (!isDemographicMetric(value)) {
    throw new ValidationError('Invalid demographic metric structure', 'structure');
  }

  if (value.value <= 0) {
    throw new ValidationError('Invalid demographic value. Must be a positive number', 'value');
  }

  if (!['increasing', 'decreasing', 'stable'].includes(value.trend)) {
    throw new ValidationError('Invalid trend. Must be increasing, decreasing, or stable', 'trend');
  }

  if (typeof value.percentChange !== 'number') {
    throw new ValidationError('Invalid percent change. Must be a number', 'percentChange');
  }
}

export function validateProperty(value: unknown): asserts value is Property {
  if (!isProperty(value)) {
    throw new ValidationError('Invalid property structure', 'structure');
  }

  if (value.listPrice <= 0) {
    throw new ValidationError('Invalid list price. Must be a positive number', 'listPrice');
  }

  if (value.sqft <= 0) {
    throw new ValidationError('Invalid square footage. Must be a positive number', 'sqft');
  }

  if (!value.address.trim()) {
    throw new ValidationError('Invalid address', 'address');
  }

  if (value.bedrooms <= 0) {
    throw new ValidationError('Invalid number of bedrooms. Must be a positive number', 'bedrooms');
  }

  if (!/^\d+\/\d+\/\d+$/.test(value.bathrooms)) {
    throw new ValidationError('Invalid bathroom format. Must be in format "full/half/quarter"', 'bathrooms');
  }

  // Validate price per square foot
  const calculatedPricePerSqft = value.listPrice / value.sqft;
  if (Math.abs(calculatedPricePerSqft - value.pricePerSqft) > 1) {
    throw new ValidationError('Invalid price per square foot', 'pricePerSqft');
  }
}

function validateMarketConditions(report: MLSReport): void {
  const { statistics } = report;
  
  // Buyer's Market Validation
  if (statistics.monthsOfSupply >= MARKET_CONDITIONS.BUYERS_MARKET.MIN_MONTHS_SUPPLY) {
    if (statistics.absorptionRate > MARKET_CONDITIONS.BUYERS_MARKET.MAX_ABSORPTION_RATE ||
        statistics.listToSoldRatio > MARKET_CONDITIONS.BUYERS_MARKET.MAX_LIST_TO_SOLD_RATIO ||
        statistics.averageDaysOnMarket < MARKET_CONDITIONS.BUYERS_MARKET.MIN_DAYS_ON_MARKET) {
      throw new ValidationError('Inconsistent market condition indicators', 'statistics');
    }
  }

  // Seller's Market Validation
  if (statistics.monthsOfSupply <= MARKET_CONDITIONS.SELLERS_MARKET.MAX_MONTHS_SUPPLY) {
    if (statistics.absorptionRate < MARKET_CONDITIONS.SELLERS_MARKET.MIN_ABSORPTION_RATE ||
        statistics.listToSoldRatio < MARKET_CONDITIONS.SELLERS_MARKET.MIN_LIST_TO_SOLD_RATIO ||
        statistics.averageDaysOnMarket > MARKET_CONDITIONS.SELLERS_MARKET.MAX_DAYS_ON_MARKET) {
      throw new ValidationError('Inconsistent market condition indicators', 'statistics');
    }
  }

  // Validate price trends
  if (statistics.averageSoldPrice > statistics.averageListPrice &&
      statistics.listToSoldRatio < 1) {
    throw new ValidationError('Inconsistent sale-to-list metrics', 'statistics');
  }

  // Validate inventory metrics
  const calculatedInventory = statistics.totalActiveListings + statistics.pendingListings;
  if (Math.abs(calculatedInventory - statistics.inventoryLevel) > 5) { // Allow small difference for timing
    throw new ValidationError('Inconsistent inventory metrics', 'statistics');
  }
}

function validateDemographicTrends(report: MLSReport): void {
  const { demographicAnalysis, statistics } = report;

  // Validate education levels
  if (!isEducationLevels(demographicAnalysis.educationLevels)) {
    throw new ValidationError('Invalid education levels structure', 'demographicAnalysis.educationLevels');
  }

  // Validate education levels total
  const totalEducation = Object.values(demographicAnalysis.educationLevels)
    .reduce((sum, metric) => sum + metric.value, 0);
  if (totalEducation > 1.1) { // Allow 10% overlap for rounding
    throw new ValidationError('Invalid education level total', 'demographicAnalysis.educationLevels');
  }

  // Validate population density
  if (!isDemographicMetric(demographicAnalysis.population)) {
    throw new ValidationError('Invalid population metric structure', 'demographicAnalysis.population');
  }
  if (demographicAnalysis.population.value > THRESHOLDS.MAX_POPULATION_DENSITY) {
    throw new ValidationError('Population exceeds geographic bounds', 'demographicAnalysis.population');
  }

  // Validate price-to-income ratio
  if (!isDemographicMetric(demographicAnalysis.medianIncome)) {
    throw new ValidationError('Invalid median income metric structure', 'demographicAnalysis.medianIncome');
  }
  const priceToIncomeRatio = statistics.medianPrice / demographicAnalysis.medianIncome.value;
  if (priceToIncomeRatio > THRESHOLDS.MAX_PRICE_TO_INCOME_RATIO) {
    throw new ValidationError('Price-to-income ratio exceeds reasonable threshold', 'statistics.medianPrice');
  }

  // Validate trend consistency
  if (!isDemographicMetric(demographicAnalysis.employmentRate)) {
    throw new ValidationError('Invalid employment rate metric structure', 'demographicAnalysis.employmentRate');
  }
  if (demographicAnalysis.medianIncome.trend === 'decreasing' && 
      demographicAnalysis.employmentRate.trend === 'decreasing' &&
      statistics.medianPrice > statistics.medianListPrice) {
    throw new ValidationError('Inconsistent trend indicators', 'demographicAnalysis');
  }
}

export function validateMLSReport(report: MLSReport): void {
  // Validate market trends
  validateMarketTrends(report.marketTrends);

  // Validate school districts
  report.schoolDistricts.forEach((school, index) => {
    try {
      validateSchoolInfo(school);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Invalid school district at index ${index}: ${error.message}`,
          `schoolDistricts[${index}].${error.field}`
        );
      }
      throw error;
    }
  });

  // Validate demographic analysis
  Object.entries(report.demographicAnalysis).forEach(([key, metric]) => {
    if (key === 'educationLevels') {
      const educationLevels = metric as Record<string, DemographicMetric>;
      Object.entries(educationLevels).forEach(([level, eduMetric]) => {
        try {
          validateDemographicMetric(eduMetric);
        } catch (error) {
          if (error instanceof ValidationError) {
            throw new ValidationError(
              `Invalid demographic metric for educationLevels.${level}`,
              `demographicAnalysis.educationLevels.${level}.${error.field}`
            );
          }
          throw error;
        }
      });
    } else if (typeof metric === 'object') {
      try {
        validateDemographicMetric(metric as DemographicMetric);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ValidationError(
            `Invalid demographic metric for ${key}`,
            `demographicAnalysis.${key}.${error.field}`
          );
        }
        throw error;
      }
    }
  });

  // Validate properties
  [...report.activeListings, ...report.closedListings].forEach((property, index) => {
    try {
      validateProperty(property);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Invalid property in ${index < report.activeListings.length ? 'activeListings' : 'closedListings'} at index ${index}: ${error.message}`,
          `${index < report.activeListings.length ? 'activeListings' : 'closedListings'}[${index}].${error.field}`
        );
      }
      throw error;
    }
  });

  // Validate market conditions
  validateMarketConditions(report);

  // Validate demographic trends
  validateDemographicTrends(report);

  // Validate statistics
  if (report.statistics.absorptionRate > THRESHOLDS.MAX_ABSORPTION_RATE) {
    throw new ValidationError('Invalid absorption rate. Must be between 0 and 100', 'statistics.absorptionRate');
  }

  // Validate price distribution
  const priceDeviation = Math.abs(report.statistics.averagePrice - report.statistics.medianPrice) / report.statistics.medianPrice;
  if (priceDeviation > THRESHOLDS.MAX_PRICE_DEVIATION) {
    throw new ValidationError('Price distribution exceeds normal bounds', 'statistics');
  }

  // Validate days on market
  if (report.statistics.averageDaysOnMarket < THRESHOLDS.MIN_DAYS_ON_MARKET) {
    throw new ValidationError('Invalid average days on market', 'statistics.averageDaysOnMarket');
  }
} 