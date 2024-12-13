import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';
import type { DemographicMetric } from '@/types/property';

describe('Chart Interactions', () => {
  it('shows tooltips on hover', async () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const priceHistory = screen.getByTestId('price-history');
    const firstPoint = within(priceHistory).getByTestId(
      `price-point-${mockMLSData.marketTrends.priceHistory[0].date}`
    );
    await userEvent.hover(firstPoint);

    const tooltip = await screen.findByRole('tooltip');
    const tooltipContent = within(tooltip);
    expect(tooltipContent.getByText(mockMLSData.marketTrends.priceHistory[0].price.toLocaleString())).toBeInTheDocument();
    expect(tooltipContent.getByText(mockMLSData.marketTrends.priceHistory[0].volume.toString())).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
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

  it('shows education level details', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const educationSection = screen.getByTestId('education-levels');
    const educationContent = within(educationSection);

    const formatMetric = (metric: DemographicMetric) => {
      const sign = metric.percentChange > 0 ? '+' : '';
      return `${(metric.value * 100).toFixed(1)}% (${sign}${metric.percentChange}%, ${metric.trend})`;
    };

    const { educationLevels } = mockMLSData.demographicAnalysis;
    expect(educationContent.getByText('High School:')).toBeInTheDocument();
    expect(educationContent.getByText(formatMetric(educationLevels.highSchool))).toBeInTheDocument();
    expect(educationContent.getByText('Bachelor\'s:')).toBeInTheDocument();
    expect(educationContent.getByText(formatMetric(educationLevels.bachelors))).toBeInTheDocument();
    expect(educationContent.getByText('Graduate:')).toBeInTheDocument();
    expect(educationContent.getByText(formatMetric(educationLevels.graduate))).toBeInTheDocument();
  });

  it('shows market trends forecast', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const forecastSection = screen.getByTestId('market-forecast');
    const forecastContent = within(forecastSection);

    const formatForecast = (priceChange: number, confidence: number) => {
      return `${priceChange}% (${(confidence * 100).toFixed(0)}% confidence)`;
    };

    const { forecast } = mockMLSData.marketTrends;
    expect(forecastContent.getByTestId('forecast-next-month')).toHaveTextContent(
      formatForecast(forecast.nextMonth.priceChange, forecast.nextMonth.confidence)
    );
    expect(forecastContent.getByTestId('forecast-next-quarter')).toHaveTextContent(
      formatForecast(forecast.nextQuarter.priceChange, forecast.nextQuarter.confidence)
    );
    expect(forecastContent.getByTestId('forecast-next-year')).toHaveTextContent(
      formatForecast(forecast.nextYear.priceChange, forecast.nextYear.confidence)
    );
  });
}); 