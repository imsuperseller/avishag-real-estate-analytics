import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';
import type { ForecastData } from '@/types/property';

describe('Market Trends Analysis', () => {
  describe('Price History Display', () => {
    it('shows price history data points', () => {
      render(<PropertyAnalysis data={mockMLSData} />);

      mockMLSData.marketTrends.priceHistory.forEach(point => {
        const dataPoint = screen.getByTestId(`price-point-${point.date}`);
        expect(dataPoint).toBeInTheDocument();
        const priceText = within(dataPoint).getByText(point.price.toLocaleString());
        expect(priceText).toBeInTheDocument();
      });
    });

    it('displays volume information', () => {
      render(<PropertyAnalysis data={mockMLSData} />);

      mockMLSData.marketTrends.priceHistory.forEach(point => {
        const volumeInfo = screen.getByTestId(`volume-${point.date}`);
        expect(volumeInfo).toBeInTheDocument();
        const volumeText = within(volumeInfo).getByText(point.volume.toString());
        expect(volumeText).toBeInTheDocument();
      });
    });
  });

  describe('Forecast Display', () => {
    it('shows forecast predictions', () => {
      render(<PropertyAnalysis data={mockMLSData} />);

      const forecasts: Array<{ id: string; data: ForecastData }> = [
        { id: 'next-month', data: mockMLSData.marketTrends.forecast.nextMonth },
        { id: 'next-quarter', data: mockMLSData.marketTrends.forecast.nextQuarter },
        { id: 'next-year', data: mockMLSData.marketTrends.forecast.nextYear }
      ];

      forecasts.forEach(forecast => {
        const element = screen.getByTestId(`forecast-${forecast.id}`);
        expect(element).toBeInTheDocument();
        const forecastContent = within(element);
        expect(forecastContent.getByText(`${forecast.data.priceChange}%`)).toBeInTheDocument();
        
        const confidence = screen.getByTestId(`confidence-${forecast.id}`);
        expect(confidence).toBeInTheDocument();
        expect(confidence).toHaveTextContent(`${(forecast.data.confidence * 100).toFixed(0)}%`);
      });
    });
  });

  describe('Seasonality Analysis', () => {
    it('displays monthly trends', () => {
      render(<PropertyAnalysis data={mockMLSData} />);

      mockMLSData.marketTrends.seasonality.forEach(month => {
        const monthElement = screen.getByTestId(`month-${month.month}`);
        expect(monthElement).toBeInTheDocument();
        const monthContent = within(monthElement);
        expect(monthContent.getByText(month.averagePrice.toLocaleString())).toBeInTheDocument();
        expect(monthContent.getByText(month.salesVolume.toString())).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides keyboard navigation', async () => {
      render(<PropertyAnalysis data={mockMLSData} />);

      const chart = screen.getByTestId('price-history-chart');
      chart.focus();

      fireEvent.keyDown(chart, { key: 'ArrowRight' });
      await waitFor(() => {
        const selectedPoint = screen.getByTestId('selected-point');
        expect(selectedPoint).toBeInTheDocument();
      });

      fireEvent.keyDown(chart, { key: 'ArrowLeft' });
      await waitFor(() => {
        const selectedPoint = screen.getByTestId('selected-point');
        expect(selectedPoint).toBeInTheDocument();
      });
    });

    it('includes ARIA attributes', () => {
      render(<PropertyAnalysis data={mockMLSData} />);

      const chart = screen.getByTestId('price-history-chart');
      expect(chart).toHaveAttribute('role', 'img');
      expect(chart).toHaveAttribute('aria-label', /price history/i);

      mockMLSData.marketTrends.priceHistory.forEach(point => {
        const dataPoint = screen.getByTestId(`price-point-${point.date}`);
        expect(dataPoint).toHaveAttribute('role', 'button');
        expect(dataPoint).toHaveAttribute('aria-label', expect.stringContaining(point.date));
      });
    });
  });
}); 