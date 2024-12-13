export interface Property {
  mlsNumber: string;
  address: string;
  city: string;
  listPrice: number;
  bedrooms: number;
  bathrooms: string;  // Format: "full/half/quarter"
  sqft: number;
  yearBuilt: number;
  garage: string;
  pool: boolean;
  acres: number;
  pricePerSqft: number;
  soldPrice?: number;  // Optional for active listings
  soldDate?: string;   // Optional for active listings
  daysOnMarket?: number; // Optional for active listings
  saleToListRatio?: number; // Optional for active listings
}

export interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

export interface SeasonalityData {
  month: number;
  averagePrice: number;
  salesVolume: number;
}

export interface ForecastData {
  priceChange: number;
  confidence: number;
}

export interface MarketTrends {
  priceHistory: PricePoint[];
  seasonality: SeasonalityData[];
  forecast: {
    nextMonth: ForecastData;
    nextQuarter: ForecastData;
    nextYear: ForecastData;
  };
}

export interface Statistics {
  averageDaysOnMarket: number;
  medianDaysOnMarket: number;
  totalActiveListings: number;
  totalClosedSales: number;
  averagePrice: number;
  medianPrice: number;
  pricePerSquareFoot: number;
  inventoryLevel: number;
  daysOfInventory: number;
  absorptionRate: number;
  newListings: number;
  closedListings: number;
  pendingListings: number;
  canceledListings: number;
  averageListPrice: number;
  medianListPrice: number;
  averageSoldPrice: number;
  medianSoldPrice: number;
  listToSoldRatio: number;
  monthsOfSupply: number;
}

export interface SchoolInfo {
  name: string;
  rating: number;
  type: 'elementary' | 'middle' | 'high';
  distance: number;
  enrollment: number;
  studentTeacherRatio: number;
}

export interface DemographicMetric {
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
}

export interface DemographicAnalysis {
  population: DemographicMetric;
  medianAge: DemographicMetric;
  medianIncome: DemographicMetric;
  employmentRate: DemographicMetric;
  educationLevels: {
    highSchool: DemographicMetric;
    bachelors: DemographicMetric;
    graduate: DemographicMetric;
  };
}

export interface MLSReport {
  mlsNumber: string;
  listPrice: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize: number;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  features: string[];
  photos: string[];
  marketTrends: MarketTrends;
  statistics: Statistics;
  schoolDistrict: {
    name: string;
    rating: number;
    schools: {
      elementary: string[];
      middle: string[];
      high: string[];
    };
  };
  demographics: {
    population: number;
    medianAge: number;
    medianIncome: number;
    employmentRate: number;
    educationLevel: {
      highSchool: number;
      bachelors: number;
      graduate: number;
    };
  };
  activeListings: Property[];
  closedListings: Property[];
  schoolDistricts: SchoolInfo[];
  demographicAnalysis: DemographicAnalysis;
} 