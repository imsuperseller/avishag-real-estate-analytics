import { render, screen } from '@testing-library/react';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';

describe('Chart Snapshots', () => {
  it('renders market trends chart correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const chart = screen.getByTestId('price-history-chart');
    expect(chart).toMatchSnapshot();

    mockMLSData.marketTrends.priceHistory.forEach(point => {
      const dataPoint = screen.getByTestId(`price-point-${point.date}`);
      expect(dataPoint).toMatchSnapshot();
    });
  });

  it('renders education levels correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const educationLevels = [
      { label: 'High School', value: mockMLSData.demographics.educationLevel.highSchool },
      { label: 'Bachelor\'s', value: mockMLSData.demographics.educationLevel.bachelors },
      { label: 'Graduate', value: mockMLSData.demographics.educationLevel.graduate }
    ];

    educationLevels.forEach(level => {
      const element = screen.getByText(`${level.label}:`);
      expect(element).toMatchSnapshot();
      const value = screen.getByText(`${(level.value * 100).toFixed(1)}%`);
      expect(value).toMatchSnapshot();
    });
  });

  it('renders market forecast correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const forecasts = [
      { id: 'next-month', data: mockMLSData.marketTrends.forecast.nextMonth },
      { id: 'next-quarter', data: mockMLSData.marketTrends.forecast.nextQuarter },
      { id: 'next-year', data: mockMLSData.marketTrends.forecast.nextYear }
    ];

    forecasts.forEach(forecast => {
      const element = screen.getByTestId(`forecast-${forecast.id}`);
      expect(element).toMatchSnapshot();
      const confidence = screen.getByTestId(`confidence-${forecast.id}`);
      expect(confidence).toMatchSnapshot();
    });
  });

  it('renders school district info correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    expect(screen.getByText(mockMLSData.schoolDistrict.name)).toMatchSnapshot();
    expect(screen.getByText(`Rating: ${mockMLSData.schoolDistrict.rating}/10`)).toMatchSnapshot();

    mockMLSData.schoolDistrict.schools.elementary.forEach(school => {
      expect(screen.getByText(school)).toMatchSnapshot();
    });
    mockMLSData.schoolDistrict.schools.middle.forEach(school => {
      expect(screen.getByText(school)).toMatchSnapshot();
    });
    mockMLSData.schoolDistrict.schools.high.forEach(school => {
      expect(screen.getByText(school)).toMatchSnapshot();
    });
  });

  it('renders demographic metrics correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    // Population
    expect(screen.getByText('Population')).toMatchSnapshot();
    expect(screen.getByText(mockMLSData.demographics.population.toLocaleString())).toMatchSnapshot();

    // Median Age
    expect(screen.getByText('Median Age')).toMatchSnapshot();
    expect(screen.getByText(`${mockMLSData.demographics.medianAge} years`)).toMatchSnapshot();

    // Income
    expect(screen.getByText('Income')).toMatchSnapshot();
    expect(screen.getByText(`$${mockMLSData.demographics.medianIncome.toLocaleString()}`)).toMatchSnapshot();

    // Employment Rate
    expect(screen.getByText('Employment Rate')).toMatchSnapshot();
    expect(screen.getByText(`${(mockMLSData.demographics.employmentRate * 100).toFixed(1)}%`)).toMatchSnapshot();
  });
}); 