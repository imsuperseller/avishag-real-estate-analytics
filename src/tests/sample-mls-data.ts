import type { MLSReport } from '@/types/property';

export const sampleMLSData: MLSReport = {
  mlsNumber: "MLS123456",
  listPrice: 500000,
  propertyType: "Single Family",
  bedrooms: 4,
  bathrooms: 2.5,
  squareFeet: 2500,
  yearBuilt: 2010,
  lotSize: 0.25,
  description: "Beautiful home in prime location",
  address: {
    street: "123 Main Street",
    city: "Plano",
    state: "TX",
    zipCode: "75024"
  },
  features: ["Updated Kitchen", "Hardwood Floors", "Pool"],
  photos: ["photo1.jpg", "photo2.jpg", "photo3.jpg"],
  marketTrends: {
    priceHistory: [
      { date: "2023-10", price: 495000, volume: 100 },
      { date: "2023-11", price: 500000, volume: 95 },
      { date: "2023-12", price: 505000, volume: 105 }
    ],
    seasonality: [
      { month: 10, averagePrice: 490000, salesVolume: 100 },
      { month: 11, averagePrice: 495000, salesVolume: 95 },
      { month: 12, averagePrice: 500000, salesVolume: 105 }
    ],
    forecast: {
      nextMonth: { priceChange: 1.5, confidence: 0.8 },
      nextQuarter: { priceChange: 3.0, confidence: 0.7 },
      nextYear: { priceChange: 5.0, confidence: 0.6 }
    }
  },
  activeListings: [
    {
      mlsNumber: "MLS123456",
      address: "123 Main Street",
      city: "Plano",
      bedrooms: 4,
      bathrooms: "2/1/0",
      sqft: 2500,
      yearBuilt: 2010,
      garage: "2 Car Attached",
      pool: false,
      acres: 0.25,
      pricePerSqft: 200,
      listPrice: 500000
    }
  ],
  closedListings: [
    {
      mlsNumber: "MLS123457",
      address: "456 Oak Avenue",
      city: "Frisco",
      bedrooms: 3,
      bathrooms: "2/0/0",
      sqft: 2000,
      yearBuilt: 2015,
      garage: "2 Car Attached",
      pool: true,
      acres: 0.2,
      pricePerSqft: 225,
      listPrice: 450000,
      soldPrice: 445000,
      soldDate: "2023-12-01",
      saleToListRatio: 0.989,
      daysOnMarket: 45
    }
  ],
  statistics: {
    averageListPrice: 475000,
    medianListPrice: 475000,
    averageSoldPrice: 445000,
    medianSoldPrice: 445000,
    averageDaysOnMarket: 45,
    medianDaysOnMarket: 40,
    totalActiveListings: 100,
    totalClosedSales: 50,
    averagePrice: 460000,
    medianPrice: 455000,
    pricePerSquareFoot: 200,
    inventoryLevel: 150,
    daysOfInventory: 90,
    absorptionRate: 0.33,
    newListings: 25,
    closedListings: 20,
    pendingListings: 15,
    canceledListings: 5,
    listToSoldRatio: 0.98,
    monthsOfSupply: 3
  },
  schoolDistrict: {
    name: "Plano ISD",
    rating: 9,
    schools: {
      elementary: ["Wilson Elementary", "Mathews Elementary"],
      middle: ["Rice Middle School"],
      high: ["Plano Senior High"]
    }
  },
  demographics: {
    population: 285000,
    medianAge: 35.5,
    medianIncome: 95000,
    employmentRate: 0.96,
    educationLevel: {
      highSchool: 0.95,
      bachelors: 0.65,
      graduate: 0.25
    }
  },
  schoolDistricts: [
    {
      name: "Wilson Elementary",
      rating: 9,
      type: "elementary",
      distance: 0.5,
      enrollment: 500,
      studentTeacherRatio: 15
    },
    {
      name: "Rice Middle School",
      rating: 8,
      type: "middle",
      distance: 1.2,
      enrollment: 800,
      studentTeacherRatio: 18
    },
    {
      name: "Plano Senior High",
      rating: 9,
      type: "high",
      distance: 1.8,
      enrollment: 1200,
      studentTeacherRatio: 20
    }
  ],
  demographicAnalysis: {
    population: { value: 285000, trend: "increasing", percentChange: 2.5 },
    medianAge: { value: 35.5, trend: "stable", percentChange: 0.1 },
    medianIncome: { value: 95000, trend: "increasing", percentChange: 3.2 },
    employmentRate: { value: 0.96, trend: "stable", percentChange: 0.0 },
    educationLevels: {
      highSchool: { value: 0.95, trend: "stable", percentChange: 0.1 },
      bachelors: { value: 0.65, trend: "increasing", percentChange: 1.5 },
      graduate: { value: 0.25, trend: "increasing", percentChange: 2.0 }
    }
  }
}; 