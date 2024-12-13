import { render, screen, within, fireEvent } from '@testing-library/react';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';
import type { DemographicMetric } from '@/types/property';

describe('Demographic Analysis', () => {
  const formatMetric = (metric: DemographicMetric) => {
    const sign = metric.percentChange > 0 ? '+' : '';
    return `${metric.value.toLocaleString()} (${sign}${metric.percentChange}%)`;
  };

  it('displays demographic metrics correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const demographicInfo = screen.getByTestId('demographic-info');
    const demoContent = within(demographicInfo);

    const { demographicAnalysis } = mockMLSData;
    const metrics = [
      { label: 'Population', metric: demographicAnalysis.population },
      { label: 'Median Age', metric: demographicAnalysis.medianAge },
      { label: 'Median Income', metric: demographicAnalysis.medianIncome },
      { label: 'Employment Rate', metric: demographicAnalysis.employmentRate }
    ];

    metrics.forEach(({ label, metric }) => {
      const metricElement = demoContent.getByTestId(`metric-${label.toLowerCase().replace(' ', '-')}`);
      expect(metricElement).toHaveTextContent(label);
      expect(metricElement).toHaveTextContent(metric.value.toLocaleString());
      expect(metricElement).toHaveTextContent(`${metric.percentChange > 0 ? '+' : ''}${metric.percentChange}%`);
    });
  });

  it('displays education levels correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const educationSection = screen.getByTestId('education-levels');
    const educationContent = within(educationSection);

    const { educationLevels } = mockMLSData.demographicAnalysis;
    const levels = [
      { label: 'High School', metric: educationLevels.highSchool },
      { label: 'Bachelor\'s', metric: educationLevels.bachelors },
      { label: 'Graduate', metric: educationLevels.graduate }
    ];

    levels.forEach(({ label, metric }) => {
      const levelElement = educationContent.getByTestId(`education-${label.toLowerCase().replace(/['\s]/g, '-')}`);
      expect(levelElement).toHaveTextContent(label);
      expect(levelElement).toHaveTextContent(metric.value.toLocaleString());
      expect(levelElement).toHaveTextContent(`${metric.percentChange > 0 ? '+' : ''}${metric.percentChange}%`);
    });
  });

  it('applies correct trend colors', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const { demographicAnalysis } = mockMLSData;
    const metrics = [
      { label: 'population', metric: demographicAnalysis.population },
      { label: 'median-age', metric: demographicAnalysis.medianAge },
      { label: 'median-income', metric: demographicAnalysis.medianIncome },
      { label: 'employment-rate', metric: demographicAnalysis.employmentRate },
      { label: 'education-high-school', metric: demographicAnalysis.educationLevels.highSchool },
      { label: 'education-bachelors', metric: demographicAnalysis.educationLevels.bachelors },
      { label: 'education-graduate', metric: demographicAnalysis.educationLevels.graduate }
    ];

    metrics.forEach(({ label, metric }) => {
      const trendElement = screen.getByTestId(`trend-${label}`);
      const trendColor = metric.trend === 'increasing' ? 'text-green-600' : 
                        metric.trend === 'decreasing' ? 'text-red-600' : 
                        'text-gray-600';
      expect(trendElement).toHaveClass(trendColor);
      expect(trendElement).toHaveTextContent(`${metric.percentChange > 0 ? '+' : ''}${metric.percentChange}%`);
    });
  });

  it('displays trend indicators correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const { demographicAnalysis } = mockMLSData;
    const metrics = [
      { label: 'population', metric: demographicAnalysis.population },
      { label: 'median-age', metric: demographicAnalysis.medianAge },
      { label: 'median-income', metric: demographicAnalysis.medianIncome },
      { label: 'employment-rate', metric: demographicAnalysis.employmentRate }
    ];

    metrics.forEach(({ label, metric }) => {
      const trendElement = screen.getByTestId(`trend-${label}`);
      const trendIcon = within(trendElement).getByTestId('trend-icon');
      
      if (metric.trend === 'increasing') {
        expect(trendIcon).toHaveClass('transform rotate-0');
      } else if (metric.trend === 'decreasing') {
        expect(trendIcon).toHaveClass('transform rotate-180');
      } else {
        expect(trendIcon).toHaveClass('transform rotate-90');
      }
    });
  });

  it('displays tooltips with detailed information', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const { demographicAnalysis } = mockMLSData;
    const metrics = [
      { label: 'population', metric: demographicAnalysis.population },
      { label: 'median-age', metric: demographicAnalysis.medianAge },
      { label: 'median-income', metric: demographicAnalysis.medianIncome },
      { label: 'employment-rate', metric: demographicAnalysis.employmentRate }
    ];

    metrics.forEach(({ label, metric }) => {
      const tooltipTrigger = screen.getByTestId(`tooltip-${label}`);
      expect(tooltipTrigger).toHaveAttribute('aria-label', expect.stringContaining(metric.value.toLocaleString()));
      expect(tooltipTrigger).toHaveAttribute('aria-label', expect.stringContaining(metric.trend));
      expect(tooltipTrigger).toHaveAttribute('aria-label', expect.stringContaining(`${metric.percentChange}%`));
    });
  });
});

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 0));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders large demographic datasets efficiently', async () => {
    // Create large dataset with historical trends
    const largeData = {
      ...mockMLSData,
      demographicAnalysis: {
        ...mockMLSData.demographicAnalysis,
        historicalTrends: Array(120).fill(null).map((_, index) => ({
          date: new Date(2015, 0, 1 + index * 30).toISOString(),
          population: 350000 + Math.random() * 50000,
          medianAge: 35 + Math.random() * 5,
          medianIncome: 75000 + Math.random() * 10000,
          employmentRate: 95 + Math.random() * 5
        }))
      }
    };

    const start = performance.now();
    render(<PropertyAnalysis data={largeData} />);
    await screen.findByTestId('demographic-info');
    const end = performance.now();

    expect(end - start).toBeLessThan(300); // Should render under 300ms
  });

  it('maintains smooth tooltip interactions', async () => {
    const { container } = render(<PropertyAnalysis data={mockMLSData} />);
    const tooltipTriggers = screen.getAllByTestId(/^tooltip-/);
    const interactionTimes: number[] = [];

    // Perform rapid tooltip interactions
    for (let i = 0; i < tooltipTriggers.length * 3; i++) {
      const start = performance.now();
      const trigger = tooltipTriggers[i % tooltipTriggers.length];
      
      // Simulate hover
      fireEvent.mouseEnter(trigger);
      await screen.findByRole('tooltip');
      fireEvent.mouseLeave(trigger);
      
      const end = performance.now();
      interactionTimes.push(end - start);
      await new Promise(resolve => setTimeout(resolve, 16)); // Simulate frame
    }

    const avgInteractionTime = interactionTimes.reduce((a, b) => a + b) / interactionTimes.length;
    expect(avgInteractionTime).toBeLessThan(50); // Average interaction under 50ms
  });

  it('handles rapid data updates efficiently', async () => {
    const { rerender } = render(<PropertyAnalysis data={mockMLSData} />);
    const updateTimes: number[] = [];

    // Perform 50 rapid data updates
    for (let i = 0; i < 50; i++) {
      const updatedData = {
        ...mockMLSData,
        demographicAnalysis: {
          ...mockMLSData.demographicAnalysis,
          population: {
            ...mockMLSData.demographicAnalysis.population,
            value: 350000 + Math.random() * 50000,
            percentChange: -5 + Math.random() * 10
          },
          medianIncome: {
            ...mockMLSData.demographicAnalysis.medianIncome,
            value: 75000 + Math.random() * 10000,
            percentChange: -3 + Math.random() * 6
          }
        }
      };

      const start = performance.now();
      rerender(<PropertyAnalysis data={updatedData} />);
      await screen.findByTestId('demographic-info');
      const end = performance.now();
      
      updateTimes.push(end - start);
      await new Promise(resolve => setTimeout(resolve, 16)); // Simulate frame
    }

    const avgUpdateTime = updateTimes.reduce((a, b) => a + b) / updateTimes.length;
    expect(avgUpdateTime).toBeLessThan(100); // Average update under 100ms
  });

  it('maintains stable memory usage during interactions', async () => {
    const performance = window.performance as { memory?: { usedJSHeapSize: number } };
    
    if (!performance.memory) {
      console.warn('Memory API not available in this environment');
      return;
    }

    const initialMemory = performance.memory.usedJSHeapSize;
    render(<PropertyAnalysis data={mockMLSData} />);

    const tooltipTriggers = screen.getAllByTestId(/^tooltip-/);
    
    // Perform multiple interactions
    for (let i = 0; i < 100; i++) {
      const trigger = tooltipTriggers[i % tooltipTriggers.length];
      fireEvent.mouseEnter(trigger);
      await screen.findByRole('tooltip');
      fireEvent.mouseLeave(trigger);
      await new Promise(resolve => setTimeout(resolve, 16));
    }

    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024); // Less than 2MB increase
  });

  it('optimizes DOM updates during trend changes', async () => {
    const mutationCallback = jest.fn();
    const observer = new MutationObserver(mutationCallback);
    
    const { container, rerender } = render(<PropertyAnalysis data={mockMLSData} />);
    observer.observe(container, { 
      childList: true, 
      subtree: true, 
      attributes: true 
    });

    // Perform multiple trend updates
    for (let i = 0; i < 10; i++) {
      const updatedData = {
        ...mockMLSData,
        demographicAnalysis: {
          ...mockMLSData.demographicAnalysis,
          population: {
            ...mockMLSData.demographicAnalysis.population,
            trend: i % 2 === 0 ? 'increasing' as const : 'decreasing' as const
          },
          medianIncome: {
            ...mockMLSData.demographicAnalysis.medianIncome,
            trend: i % 2 === 0 ? 'decreasing' as const : 'increasing' as const
          }
        }
      };

      rerender(<PropertyAnalysis data={updatedData} />);
      await new Promise(resolve => setTimeout(resolve, 16));
    }

    observer.disconnect();
    expect(mutationCallback.mock.calls.length).toBeLessThan(50); // Limit unnecessary DOM updates
  });
}); 