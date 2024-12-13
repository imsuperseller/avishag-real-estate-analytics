import { render, screen, within } from '@testing-library/react';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';

describe('Market Analysis Integration', () => {
  it('displays market trends correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const marketTrends = screen.getByTestId('market-forecast');
    const trendsContent = within(marketTrends);

    const { forecast } = mockMLSData.marketTrends;
    expect(trendsContent.getByTestId('forecast-next-month')).toHaveTextContent(
      `${forecast.nextMonth.priceChange}%`
    );
    expect(trendsContent.getByTestId('forecast-next-quarter')).toHaveTextContent(
      `${forecast.nextQuarter.priceChange}%`
    );
    expect(trendsContent.getByTestId('forecast-next-year')).toHaveTextContent(
      `${forecast.nextYear.priceChange}%`
    );
  });

  it('displays seasonality data correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const seasonality = screen.getByTestId('seasonality-chart');
    const seasonalityContent = within(seasonality);

    mockMLSData.marketTrends.seasonality.forEach(month => {
      const monthElement = seasonalityContent.getByTestId(`month-${month.month}`);
      expect(monthElement).toBeInTheDocument();
      expect(monthElement).toHaveTextContent(month.averagePrice.toLocaleString());
      expect(monthElement).toHaveTextContent(month.salesVolume.toString());
    });
  });

  it('displays price history correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const priceHistory = screen.getByTestId('price-history');
    const historyContent = within(priceHistory);

    mockMLSData.marketTrends.priceHistory.forEach(point => {
      const pointElement = historyContent.getByTestId(`price-point-${point.date}`);
      expect(pointElement).toBeInTheDocument();
      expect(pointElement).toHaveTextContent(point.price.toLocaleString());
      expect(pointElement).toHaveTextContent(point.volume.toString());
    });
  });

  it('displays market statistics correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const stats = screen.getByTestId('market-statistics');
    const statsContent = within(stats);

    const { statistics } = mockMLSData;
    expect(statsContent.getByText(`$${statistics.averagePrice.toLocaleString()}`)).toBeInTheDocument();
    expect(statsContent.getByText(`$${statistics.medianPrice.toLocaleString()}`)).toBeInTheDocument();
    expect(statsContent.getByText(statistics.totalActiveListings.toString())).toBeInTheDocument();
    expect(statsContent.getByText(statistics.totalClosedSales.toString())).toBeInTheDocument();
  });
}); 