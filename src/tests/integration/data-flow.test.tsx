import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';
import type { MLSReport } from '@/types/property';

describe('Data Flow Integration', () => {
  const testMLSData: MLSReport = mockMLSData;

  it('updates UI when price point is selected', async () => {
    render(<PropertyAnalysis data={testMLSData} />);

    const priceHistory = screen.getByTestId('price-history');
    const firstPoint = within(priceHistory).getByTestId(
      `price-point-${testMLSData.marketTrends.priceHistory[0].date}`
    );
    await userEvent.click(firstPoint);

    // Check demographic info updates
    const demographicInfo = screen.getByTestId('demographic-info');
    const demoContent = within(demographicInfo);
    expect(demoContent.getByTestId('metric-population')).toHaveTextContent(
      testMLSData.demographicAnalysis.population.value.toLocaleString()
    );

    // Check education levels update
    const educationSection = screen.getByTestId('education-levels');
    const educationContent = within(educationSection);
    expect(educationContent.getByTestId('education-high-school')).toHaveTextContent(
      testMLSData.demographicAnalysis.educationLevels.highSchool.value.toLocaleString()
    );
  });

  it('updates trend indicators when data changes', async () => {
    const { rerender } = render(<PropertyAnalysis data={testMLSData} />);

    const updatedData: MLSReport = {
      ...testMLSData,
      marketTrends: {
        ...testMLSData.marketTrends,
        forecast: {
          ...testMLSData.marketTrends.forecast,
          nextMonth: { priceChange: 2.5, confidence: 0.9 }
        }
      }
    };

    rerender(<PropertyAnalysis data={updatedData} />);

    const marketTrends = screen.getByTestId('market-forecast');
    const trendsContent = within(marketTrends);
    expect(trendsContent.getByTestId('forecast-next-month')).toHaveTextContent('2.5%');
  });
}); 