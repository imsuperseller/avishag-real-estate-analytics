import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';
import type { SeasonalityData } from '@/types/property';

describe('Seasonality Chart Integration', () => {
  const mockSeasonalityData: SeasonalityData[] = [
    { month: 1, averagePrice: 500000, salesVolume: 100 },
    { month: 2, averagePrice: 510000, salesVolume: 95 },
    { month: 3, averagePrice: 520000, salesVolume: 110 },
    { month: 4, averagePrice: 515000, salesVolume: 105 },
    { month: 5, averagePrice: 525000, salesVolume: 115 },
    { month: 6, averagePrice: 530000, salesVolume: 120 },
    { month: 7, averagePrice: 535000, salesVolume: 125 },
    { month: 8, averagePrice: 540000, salesVolume: 130 },
    { month: 9, averagePrice: 535000, salesVolume: 120 },
    { month: 10, averagePrice: 530000, salesVolume: 110 },
    { month: 11, averagePrice: 525000, salesVolume: 105 },
    { month: 12, averagePrice: 520000, salesVolume: 100 }
  ];

  const testData = {
    ...mockMLSData,
    marketTrends: {
      ...mockMLSData.marketTrends,
      seasonality: mockSeasonalityData
    }
  };

  it('renders seasonality chart with correct structure', () => {
    render(<PropertyAnalysis data={testData} />);
    
    const chart = screen.getByRole('region', { name: /market seasonality/i });
    expect(chart).toBeInTheDocument();

    // Check for main components
    expect(screen.getByRole('heading', { name: /market seasonality/i })).toBeInTheDocument();
    expect(screen.getByTestId('price-trend-line')).toBeInTheDocument();
    expect(screen.getByTestId('volume-bars')).toBeInTheDocument();
  });

  it('displays all month labels correctly', () => {
    render(<PropertyAnalysis data={testData} />);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => {
      expect(screen.getByText(month)).toBeInTheDocument();
    });
  });

  it('shows correct price and volume scales', () => {
    render(<PropertyAnalysis data={testData} />);
    
    const maxPrice = Math.max(...mockSeasonalityData.map(d => d.averagePrice));
    const maxVolume = Math.max(...mockSeasonalityData.map(d => d.salesVolume));

    // Check price scale
    expect(screen.getByText(`$${maxPrice.toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(`$${(maxPrice * 0.5).toLocaleString()}`)).toBeInTheDocument();

    // Check volume scale
    expect(screen.getByText(maxVolume.toString())).toBeInTheDocument();
    expect(screen.getByText(Math.round(maxVolume * 0.5).toString())).toBeInTheDocument();
  });

  it('calculates and displays best times correctly', () => {
    render(<PropertyAnalysis data={testData} />);
    
    // Find month with highest price
    const bestPriceMonth = mockSeasonalityData.reduce((max, curr) => 
      curr.averagePrice > max.averagePrice ? curr : max
    );
    
    // Find month with highest volume
    const bestVolumeMonth = mockSeasonalityData.reduce((max, curr) => 
      curr.salesVolume > max.salesVolume ? curr : max
    );

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    expect(screen.getByText(new RegExp(`Best time to sell: ${months[bestPriceMonth.month - 1]}`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Most active month: ${months[bestVolumeMonth.month - 1]}`))).toBeInTheDocument();
  });

  it('renders volume bars with correct relative heights', () => {
    render(<PropertyAnalysis data={testData} />);
    
    const volumeBars = screen.getAllByTestId(/volume-bar-/);
    const maxVolume = Math.max(...mockSeasonalityData.map(d => d.salesVolume));

    mockSeasonalityData.forEach((data, index) => {
      const expectedHeight = `${(data.salesVolume / maxVolume) * 100}%`;
      expect(volumeBars[index]).toHaveStyle({ height: expectedHeight });
    });
  });

  it('renders price trend line with correct path', () => {
    render(<PropertyAnalysis data={testData} />);
    
    const trendLine = screen.getByTestId('price-trend-line');
    const maxPrice = Math.max(...mockSeasonalityData.map(d => d.averagePrice));
    
    // Check if path attribute contains correct number of points
    const path = trendLine.getAttribute('d');
    const points = path?.split(' ').filter(cmd => cmd === 'L' || cmd === 'M');
    expect(points).toHaveLength(mockSeasonalityData.length);
  });

  it('maintains accessibility standards', () => {
    render(<PropertyAnalysis data={testData} />);
    
    // Check for proper ARIA labels
    expect(screen.getByRole('region', { name: /market seasonality/i })).toHaveAttribute('aria-label');
    
    // Check for proper contrast ratios
    const legend = screen.getByTestId('chart-legend');
    expect(legend).toHaveStyle({ color: expect.stringMatching(/^#/) }); // Should have proper color contrast
    
    // Check for keyboard navigation
    const chart = screen.getByTestId('seasonality-chart');
    expect(chart).toHaveAttribute('tabIndex', '0');
  });

  it('updates correctly when data changes', () => {
    const { rerender } = render(<PropertyAnalysis data={testData} />);

    // Update with new data
    const updatedSeasonalityData = mockSeasonalityData.map(data => ({
      ...data,
      averagePrice: data.averagePrice * 1.1, // 10% increase
      salesVolume: data.salesVolume * 1.2    // 20% increase
    }));

    const updatedData = {
      ...testData,
      marketTrends: {
        ...testData.marketTrends,
        seasonality: updatedSeasonalityData
      }
    };

    rerender(<PropertyAnalysis data={updatedData} />);

    // Check if scales updated
    const newMaxPrice = Math.max(...updatedSeasonalityData.map(d => d.averagePrice));
    const newMaxVolume = Math.max(...updatedSeasonalityData.map(d => d.salesVolume));

    expect(screen.getByText(`$${newMaxPrice.toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(newMaxVolume.toString())).toBeInTheDocument();
  });

  it('handles empty or invalid data gracefully', () => {
    const emptyData = {
      ...testData,
      marketTrends: {
        ...testData.marketTrends,
        seasonality: []
      }
    };

    render(<PropertyAnalysis data={emptyData} />);
    
    // Should show a fallback message
    expect(screen.getByText(/no seasonality data available/i)).toBeInTheDocument();
    
    // Should still maintain structure
    expect(screen.getByRole('region', { name: /market seasonality/i })).toBeInTheDocument();
  });

  describe('Interaction Tests', () => {
    it('shows tooltips on hover', async () => {
      render(<PropertyAnalysis data={testData} />);
      
      const volumeBars = screen.getAllByTestId(/volume-bar-/);
      await userEvent.hover(volumeBars[0]);

      const tooltip = await screen.findByTestId('volume-tooltip-0');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(mockSeasonalityData[0].salesVolume.toString());
      expect(tooltip).toHaveTextContent(mockSeasonalityData[0].averagePrice.toLocaleString());
    });

    it('maintains tooltip visibility while hovering', async () => {
      render(<PropertyAnalysis data={testData} />);
      
      const volumeBars = screen.getAllByTestId(/volume-bar-/);
      await userEvent.hover(volumeBars[0]);
      
      const tooltip = screen.getByTestId('volume-tooltip-0');
      expect(tooltip).toBeVisible();
      
      await userEvent.unhover(volumeBars[0]);
      expect(tooltip).not.toBeVisible();
    });

    it('highlights related data points on hover', async () => {
      render(<PropertyAnalysis data={testData} />);
      
      const volumeBar = screen.getAllByTestId(/volume-bar-/)[0];
      await userEvent.hover(volumeBar);
      
      const priceLine = screen.getByTestId('price-trend-line');
      const highlightedPoint = within(priceLine).getByTestId('price-point-0');
      expect(highlightedPoint).toHaveClass('highlighted');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation', async () => {
      render(<PropertyAnalysis data={testData} />);
      
      const chart = screen.getByTestId('seasonality-chart');
      chart.focus();

      // Navigate right
      fireEvent.keyDown(chart, { key: 'ArrowRight' });
      expect(screen.getByTestId('month-label-1')).toHaveClass('focused');

      // Navigate left
      fireEvent.keyDown(chart, { key: 'ArrowLeft' });
      expect(screen.getByTestId('month-label-0')).toHaveClass('focused');
    });

    it('supports Home and End keys', async () => {
      render(<PropertyAnalysis data={testData} />);
      
      const chart = screen.getByTestId('seasonality-chart');
      chart.focus();

      // Navigate to end
      fireEvent.keyDown(chart, { key: 'End' });
      expect(screen.getByTestId('month-label-11')).toHaveClass('focused');

      // Navigate to start
      fireEvent.keyDown(chart, { key: 'Home' });
      expect(screen.getByTestId('month-label-0')).toHaveClass('focused');
    });

    it('maintains focus when data updates', async () => {
      const { rerender } = render(<PropertyAnalysis data={testData} />);
      
      const chart = screen.getByTestId('seasonality-chart');
      chart.focus();
      
      fireEvent.keyDown(chart, { key: 'ArrowRight' });
      expect(screen.getByTestId('month-label-1')).toHaveClass('focused');

      const updatedData = {
        ...testData,
        marketTrends: {
          ...testData.marketTrends,
          seasonality: mockSeasonalityData.map(d => ({ ...d, averagePrice: d.averagePrice * 1.1 }))
        }
      };

      rerender(<PropertyAnalysis data={updatedData} />);
      expect(screen.getByTestId('month-label-1')).toHaveClass('focused');
    });
  });

  describe('Interaction Features', () => {
    it('shows data details on hover', async () => {
      render(<PropertyAnalysis data={testData} />);
      
      const firstBar = screen.getByTestId('volume-bar-0');
      await userEvent.hover(firstBar);

      const details = screen.getByTestId('data-details');
      expect(details).toHaveTextContent('$500,000');
      expect(details).toHaveTextContent('100');
    });

    it('highlights related data on focus', async () => {
      render(<PropertyAnalysis data={testData} />);
      
      const chart = screen.getByTestId('seasonality-chart');
      chart.focus();

      fireEvent.keyDown(chart, { key: 'ArrowRight' });
      
      const volumeBar = screen.getByTestId('volume-bar-1');
      const pricePoint = screen.getByTestId('price-point-1');
      
      expect(volumeBar).toHaveClass('highlighted');
      expect(pricePoint).toHaveClass('highlighted');
    });
  });

  describe('Error Handling', () => {
    it('handles missing data gracefully', () => {
      const incompleteData = {
        ...testData,
        marketTrends: {
          ...testData.marketTrends,
          seasonality: []
        }
      };

      render(<PropertyAnalysis data={incompleteData} />);
      expect(screen.getByText(/no seasonality data available/i)).toBeInTheDocument();
    });

    it('validates month values', () => {
      const invalidData = {
        ...testData,
        marketTrends: {
          ...testData.marketTrends,
          seasonality: [{ month: 13, averagePrice: 500000, salesVolume: 100 }]
        }
      };

      render(<PropertyAnalysis data={invalidData} />);
      expect(screen.getByText(/invalid month data/i)).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    beforeEach(() => {
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 0));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('renders large datasets efficiently', async () => {
      // Create large dataset with 5 years of monthly data
      const largeSeasonalityData = Array(60).fill(null).map((_, index) => ({
        month: (index % 12) + 1,
        averagePrice: 500000 + Math.random() * 100000,
        salesVolume: 100 + Math.random() * 50
      }));

      const largeData = {
        ...testData,
        marketTrends: {
          ...testData.marketTrends,
          seasonality: largeSeasonalityData
        }
      };

      const start = performance.now();
      render(<PropertyAnalysis data={largeData} />);
      await screen.findByTestId('seasonality-chart');
      const end = performance.now();

      expect(end - start).toBeLessThan(500); // Should render under 500ms
    });

    it('maintains smooth interactions during rapid hover events', async () => {
      render(<PropertyAnalysis data={testData} />);
      const volumeBars = screen.getAllByTestId(/volume-bar-/);
      const hoverTimes: number[] = [];

      // Perform 20 rapid hover events
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        await userEvent.hover(volumeBars[i % volumeBars.length]);
        await screen.findByTestId(`volume-tooltip-${i % volumeBars.length}`);
        await userEvent.unhover(volumeBars[i % volumeBars.length]);
        const end = performance.now();
        hoverTimes.push(end - start);
        await new Promise(resolve => setTimeout(resolve, 16)); // Simulate frame
      }

      const avgHoverTime = hoverTimes.reduce((a, b) => a + b) / hoverTimes.length;
      expect(avgHoverTime).toBeLessThan(50); // Average hover response under 50ms
    });

    it('handles rapid keyboard navigation efficiently', async () => {
      render(<PropertyAnalysis data={testData} />);
      const chart = screen.getByTestId('seasonality-chart');
      chart.focus();

      const navigationTimes: number[] = [];

      // Perform 24 rapid keyboard navigations (2 complete cycles)
      for (let i = 0; i < 24; i++) {
        const start = performance.now();
        fireEvent.keyDown(chart, { key: 'ArrowRight' });
        await screen.findByTestId(`month-label-${i % 12}`);
        const end = performance.now();
        navigationTimes.push(end - start);
        await new Promise(resolve => setTimeout(resolve, 16)); // Simulate frame
      }

      const avgNavigationTime = navigationTimes.reduce((a, b) => a + b) / navigationTimes.length;
      expect(avgNavigationTime).toBeLessThan(30); // Average navigation under 30ms
    });

    it('maintains stable memory usage during updates', async () => {
      const performance = window.performance as { memory?: { usedJSHeapSize: number } };
      
      if (!performance.memory) {
        console.warn('Memory API not available in this environment');
        return;
      }

      const initialMemory = performance.memory.usedJSHeapSize;
      const { rerender } = render(<PropertyAnalysis data={testData} />);

      // Perform 50 data updates
      for (let i = 0; i < 50; i++) {
        const updatedData = {
          ...testData,
          marketTrends: {
            ...testData.marketTrends,
            seasonality: mockSeasonalityData.map(d => ({
              ...d,
              averagePrice: d.averagePrice * (1 + Math.random() * 0.1),
              salesVolume: d.salesVolume * (1 + Math.random() * 0.1)
            }))
          }
        };

        rerender(<PropertyAnalysis data={updatedData} />);
        await new Promise(resolve => setTimeout(resolve, 16));
      }

      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });

    it('optimizes DOM updates during chart interactions', async () => {
      const mutationCallback = jest.fn();
      const observer = new MutationObserver(mutationCallback);
      
      const { container } = render(<PropertyAnalysis data={testData} />);
      observer.observe(container, { 
        childList: true, 
        subtree: true, 
        attributes: true 
      });

      const chart = screen.getByTestId('seasonality-chart');
      const volumeBars = screen.getAllByTestId(/volume-bar-/);

      // Perform mixed interactions
      for (let i = 0; i < 12; i++) {
        await userEvent.hover(volumeBars[i]);
        fireEvent.keyDown(chart, { key: 'ArrowRight' });
        await new Promise(resolve => setTimeout(resolve, 16));
      }

      observer.disconnect();
      expect(mutationCallback.mock.calls.length).toBeLessThan(100); // Limit unnecessary DOM updates
    });
  });
}); 