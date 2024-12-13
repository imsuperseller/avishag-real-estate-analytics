import { Property, MLSReport } from '../types/property';

export function extractMLSData(text: string): MLSReport {
  const properties: Property[] = [];
  const lines = text.split('\n');
  let currentProperty: Partial<Property> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for MLS number
    const mlsMatch = line.match(/MLS#?\s*(\d+[-\s]*\d*)/i);
    if (mlsMatch) {
      if (Object.keys(currentProperty).length > 0 && currentProperty.mlsNumber) {
        properties.push(currentProperty as Property);
      }
      currentProperty = {
        mlsNumber: mlsMatch[1].replace(/[-\s]/g, ''),
        city: 'Plano',
        bedrooms: 0,
        bathrooms: '0/0/0',
        sqft: 0,
        yearBuilt: 0,
        garage: '',
        pool: false,
        acres: 0,
        pricePerSqft: 0,
        listPrice: 0
      };
      continue;
    }

    // Check for address
    const addressMatch = line.match(/(\d+[^,\n]*(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way)[^,\n]*)/i);
    if (addressMatch && currentProperty) {
      currentProperty.address = addressMatch[1].trim();
      continue;
    }

    // Check for price
    const priceMatch = line.match(/(?:List|Price|Sold)(?:\s*Price)?:\s*\$?([\d,]+)/i);
    if (priceMatch && currentProperty) {
      const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      if (line.toLowerCase().includes('sold')) {
        currentProperty.soldPrice = price;
      } else {
        currentProperty.listPrice = price;
      }
      continue;
    }

    // Check for bedrooms
    const bedroomMatch = line.match(/(\d+)\s*(?:beds|bedrooms|BR)/i);
    if (bedroomMatch && currentProperty) {
      currentProperty.bedrooms = parseInt(bedroomMatch[1], 10);
      continue;
    }

    // Check for bathrooms
    const bathroomMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:baths|bathrooms|BA)/i);
    if (bathroomMatch && currentProperty) {
      currentProperty.bathrooms = `${bathroomMatch[1]}/0/0`;
      continue;
    }

    // Check for square footage
    const sqftMatch = line.match(/([\d,]+)\s*(?:sqft|sf|square\s*feet)/i);
    if (sqftMatch && currentProperty) {
      currentProperty.sqft = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
      if (currentProperty.listPrice) {
        currentProperty.pricePerSqft = Math.round(currentProperty.listPrice / currentProperty.sqft);
      }
      continue;
    }
  }

  // Add the last property if exists
  if (Object.keys(currentProperty).length > 0 && currentProperty.mlsNumber) {
    properties.push(currentProperty as Property);
  }

  // Separate active and closed listings
  const activeListings: Property[] = [];
  const closedListings: Property[] = [];

  properties.forEach(property => {
    if (property.soldPrice) {
      closedListings.push(property);
    } else {
      activeListings.push(property);
    }
  });

  // Calculate statistics
  const calculateAverage = (prices: number[]) => 
    prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  const calculateMedian = (prices: number[]) => {
    if (!prices.length) return 0;
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  };

  const activeListPrices = activeListings.map(p => p.listPrice).filter(p => p > 0);
  const soldPrices = closedListings.map(p => p.soldPrice || 0).filter(p => p > 0);

  return {
    mlsNumber: properties[0]?.mlsNumber || "UNKNOWN",
    listPrice: properties[0]?.listPrice || 0,
    propertyType: "Single Family",
    bedrooms: properties[0]?.bedrooms || 0,
    bathrooms: 0,
    squareFeet: properties[0]?.sqft || 0,
    yearBuilt: properties[0]?.yearBuilt || 0,
    lotSize: properties[0]?.acres || 0,
    description: "Property details extracted from MLS data",
    address: {
      street: properties[0]?.address || "",
      city: properties[0]?.city || "",
      state: "TX",
      zipCode: "00000"
    },
    features: [],
    photos: [],
    marketTrends: {
      priceHistory: [],
      seasonality: [],
      forecast: {
        nextMonth: { priceChange: 0, confidence: 0 },
        nextQuarter: { priceChange: 0, confidence: 0 },
        nextYear: { priceChange: 0, confidence: 0 }
      }
    },
    activeListings,
    closedListings,
    statistics: {
      averageListPrice: calculateAverage(activeListPrices),
      medianListPrice: calculateMedian(activeListPrices),
      averageSoldPrice: calculateAverage(soldPrices),
      medianSoldPrice: calculateMedian(soldPrices),
      averageDaysOnMarket: calculateAverage(closedListings.map(p => p.daysOnMarket || 0)),
      medianDaysOnMarket: calculateMedian(closedListings.map(p => p.daysOnMarket || 0)),
      totalActiveListings: activeListings.length,
      totalClosedSales: closedListings.length,
      averagePrice: calculateAverage([...activeListPrices, ...soldPrices]),
      medianPrice: calculateMedian([...activeListPrices, ...soldPrices]),
      pricePerSquareFoot: calculateAverage([...activeListings, ...closedListings].map(p => p.pricePerSqft)),
      inventoryLevel: activeListings.length,
      daysOfInventory: 90, // Default to 3 months
      absorptionRate: closedListings.length / (activeListings.length || 1),
      newListings: Math.round(activeListings.length * 0.25), // Estimate 25% are new
      closedListings: closedListings.length,
      pendingListings: Math.round(activeListings.length * 0.1), // Estimate 10% are pending
      canceledListings: Math.round(activeListings.length * 0.05), // Estimate 5% are canceled
      listToSoldRatio: soldPrices.length ? calculateAverage(soldPrices) / calculateAverage(activeListPrices) : 1,
      monthsOfSupply: activeListings.length / ((closedListings.length / 3) || 1) // Based on 3 months of data
    },
    schoolDistrict: {
      name: "Unknown School District",
      rating: 0,
      schools: {
        elementary: [],
        middle: [],
        high: []
      }
    },
    demographics: {
      population: 0,
      medianAge: 0,
      medianIncome: 0,
      employmentRate: 0,
      educationLevel: {
        highSchool: 0,
        bachelors: 0,
        graduate: 0
      }
    },
    schoolDistricts: [],
    demographicAnalysis: {
      population: { value: 0, trend: "stable", percentChange: 0 },
      medianAge: { value: 0, trend: "stable", percentChange: 0 },
      medianIncome: { value: 0, trend: "stable", percentChange: 0 },
      employmentRate: { value: 0, trend: "stable", percentChange: 0 },
      educationLevels: {
        highSchool: { value: 0, trend: "stable", percentChange: 0 },
        bachelors: { value: 0, trend: "stable", percentChange: 0 },
        graduate: { value: 0, trend: "stable", percentChange: 0 }
      }
    }
  };
}

export function validateMLSReport(report: MLSReport): string[] {
  const errors: string[] = [];

  // Validate active listings
  report.activeListings.forEach((property, index) => {
    // Required fields
    if (!property.mlsNumber) {
      errors.push(`Missing MLS number for active listing ${index}`);
    }
    if (!property.address) {
      errors.push(`Missing address for active listing ${index}`);
    }
    if (!property.listPrice) {
      errors.push(`Missing list price for active listing ${index}`);
    }

    // Value ranges
    if (property.bedrooms < 0 || property.bedrooms > 20) {
      errors.push(`Bedrooms value ${property.bedrooms} is outside valid range [0-20]`);
    }
    if (property.sqft < 100 || property.sqft > 100000) {
      errors.push(`Square footage value ${property.sqft} is outside valid range [100-100000]`);
    }
    if (property.yearBuilt < 1800 || property.yearBuilt > new Date().getFullYear()) {
      errors.push(`Year built value ${property.yearBuilt} is outside valid range [1800-${new Date().getFullYear()}]`);
    }
    if (property.acres < 0 || property.acres > 1000) {
      errors.push(`Acres value ${property.acres} is outside valid range [0-1000]`);
    }
  });

  // Validate statistics
  const stats = report.statistics;
  const validatePrice = (price: number, name: string) => {
    if (price < 0) {
      errors.push(`Negative value not allowed for ${name}: ${price}`);
    }
    if (price < 1000 || price > 100000000) {
      errors.push(`${name} value ${price} is outside valid range [1000-100000000]`);
    }
  };

  validatePrice(stats.averageListPrice, 'Average list price');
  validatePrice(stats.medianListPrice, 'Median list price');
  
  if (stats.averageSoldPrice > 0) {
    validatePrice(stats.averageSoldPrice, 'Average sold price');
  }
  if (stats.medianSoldPrice > 0) {
    validatePrice(stats.medianSoldPrice, 'Median sold price');
  }

  // Validate statistical consistency
  const priceDiff = Math.abs(stats.averageListPrice - stats.medianListPrice);
  if (priceDiff > stats.averageListPrice * 0.5) {
    errors.push('Large discrepancy between average and median list prices');
  }

  if (stats.averageDaysOnMarket < 0) {
    errors.push(`Negative value not allowed for averageDaysOnMarket: ${stats.averageDaysOnMarket}`);
  }

  return errors;
} 