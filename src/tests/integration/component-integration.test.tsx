import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import MonthlyPaymentCalculator from '@/components/MonthlyPaymentCalculator';
import { mockMLSData } from '@/tests/test-utils';
import type { DemographicMetric } from '@/types/property';

describe('Component Integration', () => {
  it('integrates PropertyAnalysis with MonthlyPaymentCalculator', async () => {
    render(
      <>
        <PropertyAnalysis data={mockMLSData} />
        <MonthlyPaymentCalculator
          listPrice={mockMLSData.listPrice}
          isOpen={true}
          onClose={() => {}}
        />
      </>
    );

    const priceHistory = screen.getByTestId('price-history');
    mockMLSData.marketTrends.priceHistory.forEach(point => {
      const dataPoint = within(priceHistory).getByTestId(`price-point-${point.date}`);
      expect(dataPoint).toBeInTheDocument();
    });

    const calculator = screen.getByTestId('payment-calculator');
    const listPriceElement = within(calculator).getByTestId('list-price');
    expect(listPriceElement).toHaveTextContent(mockMLSData.listPrice.toLocaleString());
  });

  it('updates calculator when price point is selected', async () => {
    const onPriceSelect = jest.fn();
    render(
      <>
        <PropertyAnalysis
          data={mockMLSData}
          onPriceSelect={onPriceSelect}
        />
        <MonthlyPaymentCalculator
          listPrice={mockMLSData.listPrice}
          isOpen={true}
          onClose={() => {}}
        />
      </>
    );

    const priceHistory = screen.getByTestId('price-history');
    const firstPoint = within(priceHistory).getByTestId(
      `price-point-${mockMLSData.marketTrends.priceHistory[0].date}`
    );
    await userEvent.click(firstPoint);

    expect(onPriceSelect).toHaveBeenCalledWith(
      mockMLSData.marketTrends.priceHistory[0].price
    );
  });

  it('shows school district info when price point is selected', async () => {
    render(
      <PropertyAnalysis data={mockMLSData} />
    );

    const priceHistory = screen.getByTestId('price-history');
    const firstPoint = within(priceHistory).getByTestId(
      `price-point-${mockMLSData.marketTrends.priceHistory[0].date}`
    );
    await userEvent.click(firstPoint);

    const schoolInfo = screen.getByTestId('school-district-info');
    const schoolContent = within(schoolInfo);
    expect(schoolContent.getByText(mockMLSData.schoolDistrict.name)).toBeInTheDocument();
    expect(schoolContent.getByText(`Rating: ${mockMLSData.schoolDistrict.rating}/10`)).toBeInTheDocument();
  });

  it('updates demographic info when price point is selected', async () => {
    render(
      <PropertyAnalysis data={mockMLSData} />
    );

    const priceHistory = screen.getByTestId('price-history');
    const firstPoint = within(priceHistory).getByTestId(
      `price-point-${mockMLSData.marketTrends.priceHistory[0].date}`
    );
    await userEvent.click(firstPoint);

    const demographicInfo = screen.getByTestId('demographic-info');
    const demoContent = within(demographicInfo);

    const formatMetric = (metric: DemographicMetric) => {
      const sign = metric.percentChange > 0 ? '+' : '';
      return `${metric.value.toLocaleString()} (${sign}${metric.percentChange}%, ${metric.trend})`;
    };

    expect(demoContent.getByText(formatMetric(mockMLSData.demographicAnalysis.population))).toBeInTheDocument();
    expect(demoContent.getByText(formatMetric(mockMLSData.demographicAnalysis.medianAge))).toBeInTheDocument();
    expect(demoContent.getByText(formatMetric(mockMLSData.demographicAnalysis.medianIncome))).toBeInTheDocument();
  });
}); 