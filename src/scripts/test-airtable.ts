import { saveMLSData } from '../utils/airtable';
import type { MLSReport } from '@/types/property';
import '../config/env.js';

const sampleMLSData: MLSReport = {
  mlsNumber: "TEST001",
  listPrice: 450000,
  propertyType: "Single Family",
  bedrooms: 4,
  bathrooms: 2.5,
  squareFeet: 2500,
  yearBuilt: 2015,
  lotSize: 0.25,
  description: "Beautiful test property",
  address: {
    street: "123 Test Ave",
    city: "Plano",
    state: "TX",
    zipCode: "75024"
  },
  features: ["Pool", "2 Car Garage", "Updated Kitchen"],
  photos: ["photo1.jpg", "photo2.jpg"],
  marketTrends: {
    priceHistory: [{
      date: "2024-02-15",
      price: 450000,
      volume: 10
    }],
    seasonality: [{
      month: 2,
      averagePrice: 450000,
      salesVolume: 100
    }],
    forecast: {
      nextMonth: { priceChange: 0.5, confidence: 0.8 },
      nextQuarter: { priceChange: 1.5, confidence: 0.7 },
      nextYear: { priceChange: 3.0, confidence: 0.6 }
    }
  },
  statistics: {
    averageDaysOnMarket: 25,
    medianDaysOnMarket: 20,
    totalActiveListings: 2,
    totalClosedSales: 1,
    averagePrice: 475000,
    medianPrice: 450000,
    pricePerSquareFoot: 180,
    inventoryLevel: 3,
    daysOfInventory: 45,
    absorptionRate: 0.67,
    newListings: 2,
    closedListings: 1,
    pendingListings: 0,
    canceledListings: 0,
    averageListPrice: 475000,
    medianListPrice: 450000,
    averageSoldPrice: 420000,
    medianSoldPrice: 420000,
    listToSoldRatio: 0.988,
    monthsOfSupply: 1.5
  },
  schoolDistrict: {
    name: "Plano ISD",
    rating: 9,
    schools: {
      elementary: ["Test Elementary"],
      middle: ["Test Middle"],
      high: ["Test High"]
    }
  },
  demographics: {
    population: 100000,
    medianAge: 35,
    medianIncome: 95000,
    employmentRate: 0.95,
    educationLevel: {
      highSchool: 0.95,
      bachelors: 0.45,
      graduate: 0.15
    }
  },
  activeListings: [
    {
      mlsNumber: "TEST001",
      address: "123 Test Ave",
      city: "Plano",
      listPrice: 450000,
      bedrooms: 4,
      bathrooms: "2.5",
      sqft: 2500,
      yearBuilt: 2015,
      garage: "2 Car",
      pool: false,
      acres: 0.25,
      pricePerSqft: 180
    },
    {
      mlsNumber: "TEST002",
      address: "456 Sample St",
      city: "McKinney",
      listPrice: 550000,
      bedrooms: 5,
      bathrooms: "3",
      sqft: 3000,
      yearBuilt: 2018,
      garage: "3 Car",
      pool: true,
      acres: 0.3,
      pricePerSqft: 183
    }
  ],
  closedListings: [
    {
      mlsNumber: "TEST003",
      address: "789 Sold Lane",
      city: "Frisco",
      listPrice: 425000,
      soldPrice: 420000,
      bedrooms: 3,
      bathrooms: "2",
      sqft: 2200,
      yearBuilt: 2010,
      garage: "2 Car",
      pool: false,
      acres: 0.2,
      pricePerSqft: 191,
      soldDate: "2024-02-15",
      saleToListRatio: 0.988,
      daysOnMarket: 25
    }
  ],
  schoolDistricts: [
    {
      name: "Test Elementary",
      rating: 9,
      type: "elementary",
      distance: 1.2,
      enrollment: 500,
      studentTeacherRatio: 15
    },
    {
      name: "Test Middle",
      rating: 8,
      type: "middle",
      distance: 2.1,
      enrollment: 800,
      studentTeacherRatio: 18
    },
    {
      name: "Test High",
      rating: 9,
      type: "high",
      distance: 3.5,
      enrollment: 2000,
      studentTeacherRatio: 20
    }
  ],
  demographicAnalysis: {
    population: {
      value: 100000,
      trend: "increasing",
      percentChange: 2.5
    },
    medianAge: {
      value: 35,
      trend: "stable",
      percentChange: 0.1
    },
    medianIncome: {
      value: 95000,
      trend: "increasing",
      percentChange: 3.2
    },
    employmentRate: {
      value: 0.95,
      trend: "stable",
      percentChange: 0.0
    },
    educationLevels: {
      highSchool: {
        value: 0.95,
        trend: "stable",
        percentChange: 0.1
      },
      bachelors: {
        value: 0.45,
        trend: "increasing",
        percentChange: 1.5
      },
      graduate: {
        value: 0.15,
        trend: "increasing",
        percentChange: 2.0
      }
    }
  }
};

async function runTest() {
  console.log('Starting Airtable integration test...');
  
  try {
    console.log('Saving test data to Airtable...');
    await saveMLSData(sampleMLSData);
    console.log('Test completed successfully! 🎉');
    console.log('\nPlease check your Airtable base for:');
    console.log('1. New MLS Report record');
    console.log('2. New Listings records');
    console.log('3. Verify all relationships are properly connected');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest().catch(console.error); 