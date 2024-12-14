import React, { useEffect, useState } from 'react';
import { useAirtable } from '../hooks/useAirtable';
import { Property } from '../types/property';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps 
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface MarketMetrics {
  averagePrice: number;
  medianPrice: number;
  averageDaysOnMarket: number;
  totalListings: number;
  pricePerSqft: number;
  monthlyTrend: Array<{
    date: string;
    price: number;
    volume: number;
  }>;
}

interface TrendDataPoint {
  date: string;
  price: number;
  volume: number;
}

const formatTooltipValue = (value: ValueType, name: NameType): [string | number, string] => {
  if (name === 'price') {
    const numValue = typeof value === 'number' ? value : 0;
    return [`$${numValue.toLocaleString()}`, 'Average Price'];
  }
  return [value as number, 'Number of Listings'];
};

export const MarketAnalysis: React.FC<{ reportId: string }> = ({ reportId }) => {
  const { getListingsByReport, transformListingToProperty, isLoading, error } = useAirtable();
  const [properties, setProperties] = useState<Property[]>([]);
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const listings = await getListingsByReport(reportId);
      const transformedProperties = listings.map(transformListingToProperty);
      setProperties(transformedProperties);
    };

    fetchData();
  }, [reportId, getListingsByReport, transformListingToProperty]);

  useEffect(() => {
    if (properties.length === 0) return;

    // Calculate market metrics
    const prices = properties.map(p => p.listPrice);
    const daysOnMarket = properties.map(p => p.daysOnMarket || 0);
    const sqftPrices = properties.map(p => p.pricePerSqft);

    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const averageDaysOnMarket = daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length;
    const averagePricePerSqft = sqftPrices.reduce((a, b) => a + b, 0) / sqftPrices.length;

    // Generate monthly trend data
    const monthlyData = properties.reduce((acc, property) => {
      const date = new Date();
      if (property.daysOnMarket) {
        date.setDate(date.getDate() - property.daysOnMarket);
      }
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format

      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, count: 0 };
      }
      acc[monthKey].total += property.listPrice;
      acc[monthKey].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const monthlyTrend = Object.entries(monthlyData)
      .map(([date, data]) => ({
        date,
        price: data.total / data.count,
        volume: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setMetrics({
      averagePrice,
      medianPrice,
      averageDaysOnMarket,
      totalListings: properties.length,
      pricePerSqft: averagePricePerSqft,
      monthlyTrend
    });
  }, [properties]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error loading market analysis: {error.message}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        No data available for analysis
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Market Analysis</h2>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-600">Average Price</h3>
          <p className="text-2xl font-bold text-blue-900">
            ${metrics.averagePrice.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-600">Median Price</h3>
          <p className="text-2xl font-bold text-green-900">
            ${metrics.medianPrice.toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-600">Average Days on Market</h3>
          <p className="text-2xl font-bold text-purple-900">
            {Math.round(metrics.averageDaysOnMarket)} days
          </p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-indigo-600">Total Listings</h3>
          <p className="text-2xl font-bold text-indigo-900">
            {metrics.totalListings}
          </p>
        </div>
        <div className="bg-pink-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-pink-600">Price per Sq.Ft</h3>
          <p className="text-2xl font-bold text-pink-900">
            ${Math.round(metrics.pricePerSqft)}
          </p>
        </div>
      </div>

      {/* Price Trend Chart */}
      <div className="h-96 mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Price Trends</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart<TrendDataPoint> data={metrics.monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date: string) => {
                const [year, month] = date.split('-');
                return `${month}/${year.slice(2)}`;
              }}
            />
            <YAxis 
              yAxisId="price"
              orientation="left"
              tickFormatter={(value: number) => `$${(value / 1000)}k`}
            />
            <YAxis 
              yAxisId="volume"
              orientation="right"
            />
            <Tooltip<TrendDataPoint> 
              formatter={formatTooltipValue}
            />
            <Legend />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              name="Average Price"
              strokeWidth={2}
            />
            <Line
              yAxisId="volume"
              type="monotone"
              dataKey="volume"
              stroke="#16a34a"
              name="Volume"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Market Insights */}
      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Market Insights</h3>
        <ul className="space-y-3">
          {metrics.averagePrice > metrics.medianPrice && (
            <li className="text-gray-700">
              ↗️ The market shows signs of high-end properties pulling up the average price.
            </li>
          )}
          {metrics.averageDaysOnMarket > 30 && (
            <li className="text-gray-700">
              ⏳ Properties are taking longer than usual to sell, indicating a buyer's market.
            </li>
          )}
          {metrics.averageDaysOnMarket < 15 && (
            <li className="text-gray-700">
              🏃 Properties are selling quickly, indicating high market demand.
            </li>
          )}
          {metrics.monthlyTrend.length > 1 && (
            <li className="text-gray-700">
              📈 Price trend shows {
                metrics.monthlyTrend[metrics.monthlyTrend.length - 1].price >
                metrics.monthlyTrend[0].price ? 'an increase' : 'a decrease'
              } over the analyzed period.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}; 