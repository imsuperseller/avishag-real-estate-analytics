import { render, screen, within, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MLSReport, PricePoint, SeasonalityData, SchoolInfo, DemographicAnalysis, DemographicMetric } from '@/types/property';

const createDemographicMetric = (value: number, trend: 'increasing' | 'decreasing' | 'stable', percentChange: number): DemographicMetric => ({
  value,
  trend,
  percentChange
});

export const mockPriceHistory: PricePoint[] = [
  { date: '2024-01', price: 500000, volume: 120 },
  { date: '2024-02', price: 505000, volume: 115 },
  { date: '2024-03', price: 510000, volume: 125 }
];

export const mockSeasonality: SeasonalityData[] = [
  { month: 1, averagePrice: 495000, salesVolume: 100 },
  { month: 2, averagePrice: 500000, salesVolume: 95 },
  { month: 3, averagePrice: 505000, salesVolume: 110 }
];

export const mockSchoolDistricts: SchoolInfo[] = [
  {
    name: 'Wilson Elementary',
    rating: 9,
    type: 'elementary',
    distance: 0.5,
    enrollment: 500,
    studentTeacherRatio: 15
  },
  {
    name: 'Wilson Middle',
    rating: 8,
    type: 'middle',
    distance: 1.2,
    enrollment: 800,
    studentTeacherRatio: 18
  },
  {
    name: 'Wilson High',
    rating: 9,
    type: 'high',
    distance: 1.8,
    enrollment: 1200,
    studentTeacherRatio: 20
  }
];

export const mockDemographicAnalysis: DemographicAnalysis = {
  population: createDemographicMetric(285000, 'increasing', 2.5),
  medianAge: createDemographicMetric(35.5, 'stable', 0.1),
  medianIncome: createDemographicMetric(95000, 'increasing', 3.2),
  employmentRate: createDemographicMetric(0.96, 'stable', 0.0),
  educationLevels: {
    highSchool: createDemographicMetric(0.95, 'stable', 0.1),
    bachelors: createDemographicMetric(0.65, 'increasing', 1.5),
    graduate: createDemographicMetric(0.25, 'increasing', 2.0)
  }
};

export const mockMLSData: MLSReport = {
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
    street: "123 Main St",
    city: "Plano",
    state: "TX",
    zipCode: "75024"
  },
  features: ["Updated Kitchen", "Pool", "Hardwood Floors"],
  photos: ["photo1.jpg", "photo2.jpg"],
  marketTrends: {
    priceHistory: mockPriceHistory,
    seasonality: mockSeasonality,
    forecast: {
      nextMonth: { priceChange: 1.2, confidence: 0.85 },
      nextQuarter: { priceChange: 3.5, confidence: 0.75 },
      nextYear: { priceChange: 8.0, confidence: 0.65 }
    }
  },
  statistics: {
    averageDaysOnMarket: 25,
    medianDaysOnMarket: 20,
    totalActiveListings: 150,
    totalClosedSales: 45,
    averagePrice: 485000,
    medianPrice: 475000,
    pricePerSquareFoot: 194,
    inventoryLevel: 2.5,
    daysOfInventory: 75,
    absorptionRate: 30,
    newListings: 65,
    closedListings: 45,
    pendingListings: 35,
    canceledListings: 5,
    averageListPrice: 495000,
    medianListPrice: 485000,
    averageSoldPrice: 490000,
    medianSoldPrice: 480000,
    listToSoldRatio: 0.98,
    monthsOfSupply: 3.2
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
  activeListings: [],
  closedListings: [],
  schoolDistricts: mockSchoolDistricts,
  demographicAnalysis: mockDemographicAnalysis
};

interface RenderWithLoadingResult extends RenderResult {
  findLoadingState: () => Promise<HTMLElement>;
  findErrorState: () => Promise<HTMLElement>;
}

export const renderWithLoading = (ui: React.ReactElement): RenderWithLoadingResult => {
  const result = render(ui);
  return {
    ...result,
    findLoadingState: () => screen.findByTestId('loading-spinner'),
    findErrorState: () => screen.findByTestId('error-message')
  };
};

interface MockIntersectionObserverInit {
  root?: Element | null;
  rootMargin?: string;
  thresholds?: number[];
  disconnect?: () => void;
  observe?: (target: Element) => void;
  unobserve?: (target: Element) => void;
  takeRecords?: () => IntersectionObserverEntry[];
}

export const setupIntersectionObserverMock = ({
  root = null,
  rootMargin = '',
  thresholds = [],
  disconnect = () => null,
  observe = () => null,
  unobserve = () => null,
  takeRecords = () => []
}: MockIntersectionObserverInit = {}): void => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = root;
    readonly rootMargin: string = rootMargin;
    readonly thresholds: ReadonlyArray<number> = thresholds;
    disconnect: () => void = disconnect;
    observe: (target: Element) => void = observe;
    unobserve: (target: Element) => void = unobserve;
    takeRecords: () => IntersectionObserverEntry[] = takeRecords;
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver
  });
};

// Test utility functions
export const findByTextWithMarkup = async (text: string | RegExp): Promise<HTMLElement> => {
  const elements = await screen.findAllByText(text);
  return elements[0];
};

export const findButtonByText = async (text: string | RegExp): Promise<HTMLElement> => {
  return screen.findByRole('button', { name: text });
};

export const findSelectByLabel = async (label: string | RegExp): Promise<HTMLElement> => {
  return screen.findByRole('combobox', { name: label });
};

export const findTabByText = async (text: string | RegExp): Promise<HTMLElement> => {
  return screen.findByRole('tab', { name: text });
};

export const findTableCell = async (rowText: string | RegExp, columnText: string | RegExp): Promise<HTMLElement> => {
  const row = await screen.findByRole('row', { name: new RegExp(rowText.toString()) });
  return within(row).findByRole('cell', { name: new RegExp(columnText.toString()) });
};

export const selectOption = async (selectElement: HTMLElement, optionText: string | RegExp): Promise<void> => {
  await userEvent.click(selectElement);
  const option = await within(screen.getByRole('listbox')).findByText(optionText);
  await userEvent.click(option);
};

export const waitForLoadingToComplete = async (): Promise<void> => {
  try {
    const loadingElement = await screen.findByTestId('loading-spinner');
    await waitFor(() => {
      expect(loadingElement).not.toBeInTheDocument();
    });
  } catch (error) {
    // Loading spinner was not found, which means the content loaded immediately
  }
};