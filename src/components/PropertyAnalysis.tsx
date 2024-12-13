import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { 
  MLSReport, 
  PricePoint, 
  Property, 
  SchoolInfo, 
  DemographicMetric, 
  SeasonalityData 
} from '@/types/property';
import MonthlyPaymentCalculator from './MonthlyPaymentCalculator';
import { validateMLSReport, ValidationError } from '@/utils/market-data-validator';

interface PropertyAnalysisProps {
  data: MLSReport;
  onPriceSelect?: (price: number) => void;
}

const formatMetric = (metric: DemographicMetric) => {
  const sign = metric.percentChange > 0 ? '+' : '';
  return `${metric.value.toLocaleString()} (${sign}${metric.percentChange}%, ${metric.trend})`;
};

// Seasonality Chart Component
const SeasonalityChart = ({ data }: { data: SeasonalityData[] }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Validate data
  if (!data.length) {
    return (
      <div 
        className="bg-white rounded-lg shadow p-6"
        role="region"
        aria-label="Market Seasonality"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Market Seasonality</h3>
        <div className="text-gray-500 text-center py-8">
          No seasonality data available
        </div>
      </div>
    );
  }

  // Validate month values
  if (data.some(d => d.month < 1 || d.month > 12)) {
    return (
      <div 
        className="bg-white rounded-lg shadow p-6"
        role="region"
        aria-label="Market Seasonality"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Market Seasonality</h3>
        <div className="text-red-500 text-center py-8">
          Invalid month data
        </div>
      </div>
    );
  }

  const maxPrice = Math.max(...data.map(d => d.averagePrice));
  const maxVolume = Math.max(...data.map(d => d.salesVolume));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => prev === null ? 0 : Math.max(0, prev - 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => prev === null ? 0 : Math.min(11, prev + 1));
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(11);
        break;
    }
  };

  const renderDataDetails = (index: number) => {
    const point = data[index];
    return (
      <div 
        data-testid={`data-details`}
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
          bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-30"
      >
        <div>Price: ${point.averagePrice.toLocaleString()}</div>
        <div>Volume: {point.salesVolume}</div>
      </div>
    );
  };

  return (
    <div 
      className="bg-white rounded-lg shadow p-6"
      role="region"
      aria-label="Market Seasonality"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Market Seasonality</h3>
      <div 
        className="relative h-64" 
        data-testid="seasonality-chart" 
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="application"
        aria-label="Market seasonality chart with keyboard navigation"
      >
        {/* Price Trend Line */}
        <svg 
          className="absolute inset-0" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          <path
            data-testid="price-trend-line"
            d={data.map((point, i) => 
              `${i === 0 ? 'M' : 'L'} ${(i / 11) * 100} ${100 - (point.averagePrice / maxPrice) * 100}`
            ).join(' ')}
            fill="none"
            stroke="#E195AB"
            strokeWidth="2"
            className="transition-all duration-300"
          />
          {data.map((point, i) => (
            <circle
              key={i}
              data-testid={`price-point-${i}`}
              cx={`${(i / 11) * 100}`}
              cy={`${100 - (point.averagePrice / maxPrice) * 100}`}
              r="2"
              className={`transition-all duration-300 ${
                i === focusedIndex || i === hoveredIndex ? 'highlighted' : ''
              }`}
              fill="#E195AB"
            />
          ))}
        </svg>

        {/* Volume Bars */}
        <div className="absolute inset-0 flex items-end" data-testid="volume-bars">
          {data.map((point, i) => (
            <div
              key={i}
              data-testid={`volume-bar-${i}`}
              className={`flex-1 bg-blue-100 mx-0.5 transition-all duration-300 ${
                i === focusedIndex || i === hoveredIndex ? 'highlighted opacity-50' : 'opacity-30'
              }`}
              style={{ height: `${(point.salesVolume / maxVolume) * 100}%` }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {(i === focusedIndex || i === hoveredIndex) && (
                <div data-testid={`volume-tooltip-${i}`} className="absolute bottom-full mb-1 w-full">
                  {renderDataDetails(i)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Month Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 pt-2">
          {months.map((month, i) => (
            <div 
              key={i} 
              data-testid={`month-label-${i}`}
              className={`transform -rotate-45 origin-top-left transition-colors duration-300 ${
                i === focusedIndex ? 'focused text-blue-600 font-bold' : ''
              }`}
            >
              {month}
            </div>
          ))}
        </div>

        {/* Scales */}
        {/* ... existing scales code ... */}

        {/* Legend */}
        <div className="mt-4 flex justify-center space-x-6 text-sm" data-testid="chart-legend">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#E195AB] rounded-full mr-2" />
            <span>Price Trend</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded-full mr-2" />
            <span>Sales Volume</span>
          </div>
        </div>

        {/* Keyboard Instructions */}
        <div className="sr-only">
          Use arrow keys to navigate between months, Home and End to jump to first or last month
        </div>

        {/* Live Region for Announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          className="sr-only"
        >
          {focusedIndex !== null && (
            `${months[focusedIndex]}: $${data[focusedIndex].averagePrice.toLocaleString()}, 
             Volume: ${data[focusedIndex].salesVolume}`
          )}
        </div>
      </div>

      {/* Analysis Section */}
      <div className="mt-4 text-sm text-gray-500">
        <p>
          Best time to sell: {months[data.reduce((maxI, point, i, arr) => 
            point.averagePrice > arr[maxI].averagePrice ? i : maxI, 0
          )]}
        </p>
        <p>
          Most active month: {months[data.reduce((maxI, point, i, arr) => 
            point.salesVolume > arr[maxI].salesVolume ? i : maxI, 0
          )]}
        </p>
      </div>
    </div>
  );
};

// Add keyboard navigation hook
const useKeyboardNavigation = (itemCount: number, onSelect: (index: number) => void) => {
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          setFocusIndex(prev => Math.min(prev + 1, itemCount - 1));
          break;
        case 'ArrowLeft':
          setFocusIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          onSelect(focusIndex);
          e.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [itemCount, onSelect, focusIndex]);

  return focusIndex;
};

export default function PropertyAnalysis({ data, onPriceSelect }: PropertyAnalysisProps) {
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<PricePoint | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [districtUpdateMessage, setDistrictUpdateMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPoints, setComparisonPoints] = useState<PricePoint[]>([]);
  const [focusedPointIndex, setFocusedPointIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Validate data on mount and updates
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      validateMLSReport(data);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(`Invalid market data: ${err.message} (${err.field})`);
      } else {
        setError('An unexpected error occurred while validating market data');
      }
      console.error('Validation error:', err);
      setIsLoading(false);
    }
  }, [data]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <h2 className="text-red-700 font-semibold mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="animate-pulse" role="status" aria-label="Loading content">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4">
            <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-200 rounded" />
              <div className="h-3 w-3/4 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );

  // Error Message
  const ErrorMessage = ({ message }: { message: string }) => (
    <div 
      role="alert" 
      className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700"
    >
      <p className="font-medium">Error</p>
      <p>{message}</p>
    </div>
  );

  // Market Trends Section
  const maxPrice = useMemo(() => {
    try {
      return Math.max(...data.marketTrends.priceHistory.map(point => point.price));
    } catch (err) {
      setError('Failed to calculate price range');
      return 0;
    }
  }, [data.marketTrends.priceHistory]);

  // Price Click Handler
  const handlePriceClick = useCallback(async (price: number) => {
    try {
      setError(null);
      setIsLoading(true);
      setShowCalculator(true);
      await onPriceSelect?.(price);
    } catch (err) {
      setError('Failed to calculate payment. Please try again.');
      setShowCalculator(false);
    } finally {
      setIsLoading(false);
    }
  }, [onPriceSelect]);

  // School District Click Handler
  const handleDistrictClick = useCallback(async (districtName: string) => {
    try {
      setError(null);
      setDistrictUpdateMessage(`Loading details for ${districtName}...`);
      // Additional district loading logic here
    } catch (err) {
      setError('Failed to load district details');
      setDistrictUpdateMessage(null);
    }
  }, []);

  // Market Trends Comparison
  const handleComparisonToggle = useCallback(() => {
    setComparisonMode(prev => !prev);
    setComparisonPoints([]);
  }, []);

  const handlePointSelect = useCallback((point: PricePoint) => {
    if (!comparisonMode) {
      setSelectedPoint(point);
      handlePriceClick(point.price);
      return;
    }

    setComparisonPoints(prev => {
      if (prev.length >= 2) return prev;
      if (prev.find(p => p.date === point.date)) {
        return prev.filter(p => p.date !== point.date);
      }
      return [...prev, point];
    });
  }, [comparisonMode, handlePriceClick]);

  // Comparison Analysis
  const comparisonAnalysis = useMemo(() => {
    if (comparisonPoints.length !== 2) return null;

    const [earlier, later] = comparisonPoints.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const priceDiff = later.price - earlier.price;
    const priceChange = (priceDiff / earlier.price) * 100;
    const volumeChange = ((later.volume - earlier.volume) / earlier.volume) * 100;
    const monthsDiff = (new Date(later.date).getTime() - new Date(earlier.date).getTime()) / (1000 * 60 * 60 * 24 * 30);

    return {
      priceDiff,
      priceChange,
      volumeChange,
      monthsDiff: Math.round(monthsDiff),
      annualizedReturn: (Math.pow(1 + priceChange / 100, 12 / monthsDiff) - 1) * 100
    };
  }, [comparisonPoints]);

  // Keyboard Navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!data.marketTrends.priceHistory.length) return;

    const currentIndex = focusedPointIndex ?? -1;
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = Math.min(data.marketTrends.priceHistory.length - 1, currentIndex + 1);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = data.marketTrends.priceHistory.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex !== -1) {
          handlePointSelect(data.marketTrends.priceHistory[currentIndex]);
        }
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      setFocusedPointIndex(newIndex);
      setHoveredPoint(data.marketTrends.priceHistory[newIndex]);
    }
  }, [data.marketTrends.priceHistory, focusedPointIndex, handlePointSelect]);

  // Focus Management
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handleFocus = () => {
      if (focusedPointIndex === null && data.marketTrends.priceHistory.length > 0) {
        setFocusedPointIndex(0);
        setHoveredPoint(data.marketTrends.priceHistory[0]);
      }
    };

    const handleBlur = () => {
      setFocusedPointIndex(null);
      setHoveredPoint(null);
    };

    chart.addEventListener('focus', handleFocus);
    chart.addEventListener('blur', handleBlur);

    return () => {
      chart.removeEventListener('focus', handleFocus);
      chart.removeEventListener('blur', handleBlur);
    };
  }, [data.marketTrends.priceHistory, focusedPointIndex]);

  // Price History Chart
  const renderPricePoint = useCallback((point: PricePoint, index: number, total: number) => {
    const x = (index / (total - 1)) * 100;
    const y = ((maxPrice - point.price) / maxPrice) * 100;
    const isSelected = selectedPoint?.date === point.date;
    const isHovered = hoveredPoint?.date === point.date;
    const isComparisonPoint = comparisonPoints.some(p => p.date === point.date);
    const isFocused = index === focusedPointIndex;

    return (
      <div
        key={point.date}
        data-testid={`price-point-${point.date}`}
        className={`absolute w-3 h-3 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 
          transition-all duration-300 ease-in-out
          ${isSelected || isHovered ? 'scale-150 z-20' : 'hover:scale-125'}
          ${isComparisonPoint ? 'bg-purple-600 ring-4 ring-purple-200' : 
            isSelected ? 'bg-blue-600 ring-4 ring-blue-200' : 'bg-blue-400'}
          ${isFocused ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
        style={{ 
          left: `${x}%`, 
          top: `${y}%`,
          opacity: isLoading ? '0.5' : '1',
          transform: `translate(-50%, -50%) ${isSelected || isHovered ? 'scale(1.5)' : 'scale(1)'}`,
        }}
        onClick={() => handlePointSelect(point)}
        onMouseEnter={() => setHoveredPoint(point)}
        onMouseLeave={() => setHoveredPoint(null)}
        role="button"
        aria-label={`Price point for ${point.date}: $${point.price.toLocaleString()}`}
        aria-pressed={isSelected || isComparisonPoint}
        tabIndex={isFocused ? 0 : -1}
      >
        {(isSelected || isHovered || isComparisonPoint || isFocused) && (
          <div 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
              bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-30
              transition-opacity duration-200 ease-in-out"
            style={{ opacity: isSelected || isHovered || isComparisonPoint || isFocused ? '1' : '0' }}
          >
            {point.date}: ${point.price.toLocaleString()}
            <br />
            Volume: {point.volume}
          </div>
        )}
      </div>
    );
  }, [maxPrice, selectedPoint, hoveredPoint, isLoading, handlePointSelect, comparisonPoints, focusedPointIndex]);

  // Render Listings with Animation
  const renderListings = useCallback((listings: Property[]) => {
    return listings.map((listing, index) => (
      <div 
        key={listing.mlsNumber}
        className="bg-gray-50 rounded-lg p-4 transform transition-all duration-300 ease-in-out
          hover:shadow-lg hover:-translate-y-1"
        data-testid={`listing-${listing.mlsNumber}`}
        style={{
          opacity: isLoading ? '0.7' : '1',
          transform: `translateY(${isLoading ? '10px' : '0'})`,
        }}
      >
        <h4 className="text-lg font-medium text-gray-800">{listing.address}</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>MLS#: {listing.mlsNumber}</div>
          <div>${listing.listPrice.toLocaleString()}</div>
          <div>{listing.bedrooms} beds, {listing.bathrooms} baths</div>
          <div>{listing.sqft.toLocaleString()} sqft</div>
          <div>Built: {listing.yearBuilt}</div>
          {listing.garage && <div>{listing.garage}</div>}
          {listing.pool && <div>Pool</div>}
          <div>{listing.acres} acres</div>
          {listing.soldPrice && (
            <>
              <div className="text-green-600 transition-colors duration-300">
                Sold: ${listing.soldPrice.toLocaleString()}
              </div>
              <div>Date: {listing.soldDate}</div>
              <div>Days on Market: {listing.daysOnMarket}</div>
            </>
          )}
        </div>
        <button
          onClick={() => handlePriceClick(listing.listPrice)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 rounded"
          disabled={isLoading}
        >
          Calculate Payment
        </button>
      </div>
    ));
  }, [handlePriceClick, isLoading]);

  // School Districts
  const renderSchoolDistricts = useCallback((districts: SchoolInfo[]) => {
    return districts.map((district) => (
      <div 
        key={district.name} 
        className="bg-gray-50 rounded-lg p-4 cursor-pointer"
        onClick={() => handleDistrictClick(district.name)}
      >
        <h4 className="text-lg font-medium text-gray-800">{district.name}</h4>
        <div className="text-sm text-gray-600">
          <div>Rating: {district.rating}/10</div>
          <div>Type: {district.type}</div>
          <div>Distance: {district.distance} miles</div>
          <div>Enrollment: {district.enrollment}</div>
          <div>Student/Teacher: {district.studentTeacherRatio}:1</div>
        </div>
      </div>
    ));
  }, [handleDistrictClick]);

  // Demographic Analysis
  const renderDemographicMetric = useCallback((metric: DemographicMetric) => {
    const trendColor = metric.trend === 'increasing' ? 'text-green-600' : 
                      metric.trend === 'decreasing' ? 'text-red-600' : 
                      'text-gray-600';
    return (
      <div className="flex items-center">
        <span className="font-medium">{metric.value.toLocaleString()}</span>
        <span className={`ml-2 ${trendColor}`}>
          ({metric.percentChange > 0 ? '+' : ''}{metric.percentChange}%)
        </span>
      </div>
    );
  }, []);

  // Print View Styles
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #print-view, #print-view * {
        visibility: visible;
      }
      #print-view {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-after: always;
      }
    }
  `;

  // Format Date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Print View Component
  const PrintView = () => (
    <div id="print-view" className="p-8 bg-white">
      <style>{printStyles}</style>
      
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Market Analysis Report</h1>
        <p className="text-gray-600">Generated on {formatDate(new Date().toISOString())}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Property Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>MLS Number:</strong> {data.mlsNumber}
          </div>
          <div>
            <strong>List Price:</strong> ${data.listPrice.toLocaleString()}
          </div>
          <div>
            <strong>Property Type:</strong> {data.propertyType}
          </div>
          <div>
            <strong>Year Built:</strong> {data.yearBuilt}
          </div>
        </div>
      </div>

      <div className="mb-8 page-break">
        <h2 className="text-xl font-semibold mb-4">Market Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Average List Price:</strong> ${data.statistics.averageListPrice.toLocaleString()}
          </div>
          <div>
            <strong>Average Sold Price:</strong> ${data.statistics.averageSoldPrice.toLocaleString()}
          </div>
          <div>
            <strong>Days on Market:</strong> {data.statistics.medianDaysOnMarket}
          </div>
          <div>
            <strong>Active Listings:</strong> {data.statistics.totalActiveListings}
          </div>
          <div>
            <strong>Price per Sqft:</strong> ${data.statistics.pricePerSquareFoot}
          </div>
          <div>
            <strong>Absorption Rate:</strong> {data.statistics.absorptionRate}%
          </div>
        </div>
      </div>

      {comparisonAnalysis && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Price Comparison Analysis</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Price Change:</strong>{' '}
              {comparisonAnalysis.priceChange > 0 ? '+' : ''}
              {comparisonAnalysis.priceChange.toFixed(1)}%
            </div>
            <div>
              <strong>Volume Change:</strong>{' '}
              {comparisonAnalysis.volumeChange > 0 ? '+' : ''}
              {comparisonAnalysis.volumeChange.toFixed(1)}%
            </div>
            <div>
              <strong>Time Period:</strong> {comparisonAnalysis.monthsDiff} months
            </div>
            <div>
              <strong>Annualized Return:</strong>{' '}
              {comparisonAnalysis.annualizedReturn > 0 ? '+' : ''}
              {comparisonAnalysis.annualizedReturn.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 page-break">
        <h2 className="text-xl font-semibold mb-4">School Districts</h2>
        <div className="grid grid-cols-1 gap-4">
          {data.schoolDistricts.map(district => (
            <div key={district.name} className="border-b pb-4">
              <h3 className="font-medium mb-2">{district.name}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>Rating: {district.rating}/10</div>
                <div>Type: {district.type}</div>
                <div>Distance: {district.distance} miles</div>
                <div>Student/Teacher: {district.studentTeacherRatio}:1</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Report generated by Avishag's Real Estate Assistant</p>
      </div>
    </div>
  );

  // Calculate Market Predictions
  const marketPredictions = useMemo(() => {
    if (!data.marketTrends.priceHistory.length) return null;

    // Sort price history by date
    const sortedHistory = [...data.marketTrends.priceHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate moving averages
    const shortTermMA = calculateMovingAverage(sortedHistory, 3);  // 3-month MA
    const longTermMA = calculateMovingAverage(sortedHistory, 6);   // 6-month MA

    // Calculate trend strength
    const recentTrend = calculateTrendStrength(sortedHistory.slice(-6));

    // Calculate seasonality
    const seasonalityPattern = analyzeSeasonality(data.marketTrends.seasonality);

    // Generate predictions
    const nextThreeMonths = generatePredictions(
      sortedHistory,
      shortTermMA,
      longTermMA,
      recentTrend,
      seasonalityPattern,
      3
    );

    return {
      shortTermMA,
      longTermMA,
      recentTrend,
      seasonalityPattern,
      predictions: nextThreeMonths
    };
  }, [data.marketTrends.priceHistory, data.marketTrends.seasonality]);

  // Helper Functions
  const calculateMovingAverage = (prices: PricePoint[], period: number) => {
    return prices.map((_, index, array) => {
      if (index < period - 1) return null;
      const slice = array.slice(index - period + 1, index + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.price, 0);
      return {
        date: array[index].date,
        price: sum / period
      };
    }).filter((p): p is { date: string; price: number } => p !== null);
  };

  const calculateTrendStrength = (recentPrices: PricePoint[]) => {
    if (recentPrices.length < 2) return { strength: 0, direction: 'stable' as const };

    const priceChanges = recentPrices.map((p, i) => 
      i === 0 ? 0 : ((p.price - recentPrices[i - 1].price) / recentPrices[i - 1].price) * 100
    );

    const avgChange = priceChanges.reduce((a, b) => a + b, 0) / (priceChanges.length - 1);
    const volatility = Math.sqrt(
      priceChanges.reduce((acc, val) => acc + Math.pow(val - avgChange, 2), 0) / priceChanges.length
    );

    return {
      strength: Math.abs(avgChange) / volatility,
      direction: avgChange > 0 ? 'increasing' as const : 
                avgChange < 0 ? 'decreasing' as const : 
                'stable' as const
    };
  };

  const analyzeSeasonality = (seasonality: Array<{ month: number; averagePrice: number; salesVolume: number }>) => {
    const avgByMonth = new Array(12).fill(0);
    const countByMonth = new Array(12).fill(0);

    seasonality.forEach(data => {
      avgByMonth[data.month - 1] += data.averagePrice;
      countByMonth[data.month - 1]++;
    });

    return avgByMonth.map((sum, i) => 
      countByMonth[i] ? sum / countByMonth[i] : null
    );
  };

  const generatePredictions = (
    history: PricePoint[],
    shortMA: { date: string; price: number }[],
    longMA: { date: string; price: number }[],
    trend: { strength: number; direction: 'increasing' | 'decreasing' | 'stable' },
    seasonality: (number | null)[],
    months: number
  ) => {
    const lastPrice = history[history.length - 1].price;
    const lastDate = new Date(history[history.length - 1].date);
    
    return Array.from({ length: months }, (_, i) => {
      const predictionDate = new Date(lastDate);
      predictionDate.setMonth(predictionDate.getMonth() + i + 1);
      
      const month = predictionDate.getMonth();
      const seasonalFactor = seasonality[month] ? 
        seasonality[month]! / seasonality[lastDate.getMonth()]! : 1;

      const trendFactor = trend.direction === 'stable' ? 1 :
        trend.direction === 'increasing' ? 
          1 + (0.01 * trend.strength * (i + 1)) :
          1 - (0.01 * trend.strength * (i + 1));

      const maFactor = shortMA.length && longMA.length ?
        shortMA[shortMA.length - 1].price / longMA[longMA.length - 1].price : 1;

      const predictedPrice = lastPrice * trendFactor * seasonalFactor * maFactor;
      const confidence = Math.max(0, 1 - (0.1 * (i + 1)) - (0.1 * (1 / trend.strength)));

      return {
        date: predictionDate.toISOString().slice(0, 7),
        price: predictedPrice,
        confidence
      };
    });
  };

  // Render Prediction Section
  const renderPredictions = () => {
    if (!marketPredictions) return null;

    const { predictions, recentTrend } = marketPredictions;
    const trendColor = recentTrend.direction === 'increasing' ? 'text-green-600' :
                      recentTrend.direction === 'decreasing' ? 'text-red-600' :
                      'text-gray-600';

    return (
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Market Predictions</h3>
          <div className={`text-sm font-medium ${trendColor}`}>
            {recentTrend.direction.charAt(0).toUpperCase() + recentTrend.direction.slice(1)} Trend
            ({recentTrend.strength.toFixed(2)} strength)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.map((prediction, index) => (
            <div 
              key={prediction.date}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="text-sm text-gray-600 mb-1">
                {new Date(prediction.date).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
              <div className="text-lg font-medium">
                ${prediction.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-gray-500">
                Confidence: {(prediction.confidence * 100).toFixed(0)}%
              </div>
              <div className="mt-2 h-1 bg-gray-200 rounded">
                <div 
                  className="h-full bg-blue-500 rounded"
                  style={{ width: `${prediction.confidence * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Predictions are based on historical trends, seasonality, and market momentum.
          Actual results may vary.
        </div>
      </section>
    );
  };

  // Inject print styles
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = printStyles;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  const focusedPriceIndex = useKeyboardNavigation(
    data.marketTrends.priceHistory.length,
    (index) => handlePointSelect(data.marketTrends.priceHistory[index])
  );

  // Add ARIA announcer for dynamic updates
  const [announcement, setAnnouncement] = useState<string>('');
  
  useEffect(() => {
    if (selectedPoint) {
      setAnnouncement(`Selected price point: $${selectedPoint.price.toLocaleString()} from ${selectedPoint.date}`);
    }
  }, [selectedPoint]);

  // Add keyboard navigation for comparison mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && comparisonMode) {
        setComparisonMode(false);
        setComparisonPoints([]);
        setAnnouncement('Exited comparison mode');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [comparisonMode]);

  // Update comparison announcements
  useEffect(() => {
    if (comparisonPoints.length === 1) {
      setAnnouncement('Selected first comparison point. Please select a second point.');
    } else if (comparisonPoints.length === 2) {
      const [earlier, later] = comparisonPoints.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const priceDiff = later.price - earlier.price;
      const priceChange = (priceDiff / earlier.price) * 100;
      setAnnouncement(
        `Comparing prices: ${earlier.date} at $${earlier.price.toLocaleString()} to ` +
        `${later.date} at $${later.price.toLocaleString()}. ` +
        `Price change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%`
      );
    }
  }, [comparisonPoints]);

  if (!data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showPrintView && <PrintView />}
      
      <div className={showPrintView ? 'no-print' : ''}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            <button
              onClick={handleComparisonToggle}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                ${comparisonMode ? 
                  'bg-purple-100 text-purple-700 hover:bg-purple-200' : 
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              aria-pressed={comparisonMode}
            >
              {comparisonMode ? 'Exit Comparison' : 'Compare Points'}
            </button>
            <button
              onClick={() => setShowPredictions(prev => !prev)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                ${showPredictions ? 
                  'bg-blue-100 text-blue-700 hover:bg-blue-200' : 
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              aria-pressed={showPredictions}
            >
              {showPredictions ? 'Hide Predictions' : 'Show Predictions'}
            </button>
            <button
              onClick={() => {
                setShowPrintView(true);
                setTimeout(() => {
                  window.print();
                  setShowPrintView(false);
                }, 100);
              }}
              className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
            >
              Print Report
            </button>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Market Overview */}
        <section 
          className="bg-white rounded-lg shadow p-6"
          aria-labelledby="market-overview-title"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 id="market-overview-title" className="text-xl font-semibold text-gray-800">
              Market Overview
            </h3>
            <button
              onClick={handleComparisonToggle}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                ${comparisonMode ? 
                  'bg-purple-100 text-purple-700 hover:bg-purple-200' : 
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              aria-pressed={comparisonMode}
            >
              {comparisonMode ? 'Exit Comparison' : 'Compare Points'}
            </button>
          </div>

          {comparisonAnalysis && (
            <div className="mb-4 bg-purple-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-purple-800 mb-2">Price Comparison Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-purple-600">Price Change</div>
                  <div className="font-medium">
                    {comparisonAnalysis.priceChange > 0 ? '+' : ''}
                    {comparisonAnalysis.priceChange.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-purple-600">Volume Change</div>
                  <div className="font-medium">
                    {comparisonAnalysis.volumeChange > 0 ? '+' : ''}
                    {comparisonAnalysis.volumeChange.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-purple-600">Time Period</div>
                  <div className="font-medium">{comparisonAnalysis.monthsDiff} months</div>
                </div>
                <div>
                  <div className="text-sm text-purple-600">Annualized Return</div>
                  <div className="font-medium">
                    {comparisonAnalysis.annualizedReturn > 0 ? '+' : ''}
                    {comparisonAnalysis.annualizedReturn.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {comparisonMode && comparisonPoints.length < 2 && (
            <div className="mb-4 bg-purple-50 rounded-lg p-4 text-purple-700">
              Select {2 - comparisonPoints.length} more point{comparisonPoints.length === 0 ? 's' : ''} to compare
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div 
                  className="bg-white rounded-lg shadow p-4"
                  role="region"
                  aria-labelledby="average-prices-title"
                >
                  <h4 id="average-prices-title" className="text-lg font-semibold text-gray-800 mb-2">
                    Average Prices
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">List Price:</span>
                      <span className="font-medium">${data.statistics.averageListPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sold Price:</span>
                      <span className="font-medium">${data.statistics.averageSoldPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Market Activity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Listings:</span>
                      <span className="font-medium">{data.statistics.totalActiveListings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days on Market:</span>
                      <span className="font-medium">{data.statistics.medianDaysOnMarket} days</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Market Trends</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price/Sqft:</span>
                      <span className="font-medium">${data.statistics.pricePerSquareFoot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Absorption Rate:</span>
                      <span className="font-medium">{data.statistics.absorptionRate}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Price History Chart */}
        <section 
          className="bg-white rounded-lg shadow p-6"
          aria-labelledby="price-history-title"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 id="price-history-title" className="text-xl font-semibold text-gray-800">
              Price History
            </h3>
            <div className="text-sm text-gray-500">
              Use arrow keys to navigate points
            </div>
          </div>
          <div 
            ref={chartRef}
            className="h-64" 
            data-testid="price-history"
            role="region"
            aria-label="Price history chart"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <div className="relative h-full">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={`vline-${i}`} 
                    className="border-l border-gray-200 transition-opacity duration-300"
                    style={{ 
                      left: `${(i + 1) * 25}%`,
                      opacity: isLoading ? '0.3' : '0.7'
                    }} 
                  />
                ))}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={`hline-${i}`} 
                    className="border-t border-gray-200 transition-opacity duration-300"
                    style={{ 
                      top: `${(i + 1) * 25}%`,
                      opacity: isLoading ? '0.3' : '0.7'
                    }} 
                  />
                ))}
              </div>

              {/* Data Points */}
              {data.marketTrends.priceHistory.map((point, index) => 
                renderPricePoint(point, index, data.marketTrends.priceHistory.length)
              )}

              {/* Axes */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-px bg-gray-300 transition-opacity duration-300"
                style={{ opacity: isLoading ? '0.3' : '1' }}
              />
              <div 
                className="absolute top-0 bottom-0 left-0 w-px bg-gray-300 transition-opacity duration-300"
                style={{ opacity: isLoading ? '0.3' : '1' }}
              />

              {/* Y-axis Labels */}
              <div 
                className="absolute -left-14 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 transition-opacity duration-300"
                style={{ opacity: isLoading ? '0.5' : '1' }}
              >
                <span>${maxPrice.toLocaleString()}</span>
                <span>${(maxPrice * 0.75).toLocaleString()}</span>
                <span>${(maxPrice * 0.5).toLocaleString()}</span>
                <span>${(maxPrice * 0.25).toLocaleString()}</span>
                <span>$0</span>
              </div>

              {/* X-axis Labels */}
              <div 
                className="absolute left-0 right-0 bottom-0 flex justify-between transform translate-y-4 text-xs text-gray-500 transition-opacity duration-300"
                style={{ opacity: isLoading ? '0.5' : '1' }}
              >
                {data.marketTrends.priceHistory.map((point, i) => (
                  i % Math.ceil(data.marketTrends.priceHistory.length / 4) === 0 && (
                    <span key={point.date}>{point.date}</span>
                  )
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            Click on any point to calculate monthly payment
          </div>
        </section>

        {/* Market Seasonality */}
        <SeasonalityChart data={data.marketTrends.seasonality} />

        {/* Market Predictions */}
        {showPredictions && renderPredictions()}

        {/* Active Listings */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Active Listings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderListings(data.activeListings)}
          </div>
        </section>

        {/* Closed Listings */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recently Closed</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderListings(data.closedListings)}
          </div>
        </section>

        {/* School Districts */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">School Districts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderSchoolDistricts(data.schoolDistricts)}
          </div>
          {districtUpdateMessage && (
            <div className="mt-4 text-sm text-blue-600">{districtUpdateMessage}</div>
          )}
        </section>

        {/* Demographics */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-800 mb-2">Population</h4>
              {renderDemographicMetric(data.demographicAnalysis.population)}
              <div className="mt-2">
                <span className="text-gray-600">Median Age:</span>
                {renderDemographicMetric(data.demographicAnalysis.medianAge)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-800 mb-2">Income</h4>
              {renderDemographicMetric(data.demographicAnalysis.medianIncome)}
              <div className="mt-2">
                <span className="text-gray-600">Employment:</span>
                {renderDemographicMetric(data.demographicAnalysis.employmentRate)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-800 mb-2">Education</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">High School:</span>
                  {renderDemographicMetric(data.demographicAnalysis.educationLevels.highSchool)}
                </div>
                <div>
                  <span className="text-gray-600">Bachelor's:</span>
                  {renderDemographicMetric(data.demographicAnalysis.educationLevels.bachelors)}
                </div>
                <div>
                  <span className="text-gray-600">Graduate:</span>
                  {renderDemographicMetric(data.demographicAnalysis.educationLevels.graduate)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator Modal */}
        <MonthlyPaymentCalculator
          listPrice={data.listPrice}
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
        />
      </div>
    </div>
  );
} 