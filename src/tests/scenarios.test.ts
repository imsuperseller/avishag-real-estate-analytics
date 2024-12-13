import { extractMLSData } from '../utils/mls-validator';
import type { MLSReport, MarketTrends, SeasonalityData } from '@/types/property';

const sampleMLSText = `
  MLS#12345
  123 Main St, Plano
  List Price: $500,000
  4 beds, 2.5 baths
  2,500 sqft
  Built: 2010
  
  MLS#67890
  456 Oak Ave, Frisco
  List Price: $600,000
  Sold Price: $595,000
  3 beds, 2 baths
  2,000 sqft
  Built: 2015
`;

describe('Market Analysis Scenarios', () => {
  let result: MLSReport;

  beforeEach(() => {
    result = extractMLSData(sampleMLSText);
  });

  describe('Market Condition Analysis', () => {
    let marketTrends: MarketTrends;

    beforeEach(() => {
      expect(result.marketTrends).toBeDefined();
      marketTrends = result.marketTrends;
    });

    it('analyzes market forecast correctly', () => {
      const { forecast } = marketTrends;
      
      // Next Month Forecast
      expect(forecast.nextMonth.priceChange).toBeGreaterThan(-20);
      expect(forecast.nextMonth.priceChange).toBeLessThan(20);
      expect(forecast.nextMonth.confidence).toBeGreaterThan(0);
      expect(forecast.nextMonth.confidence).toBeLessThanOrEqual(1);

      // Next Quarter Forecast
      expect(forecast.nextQuarter.priceChange).toBeGreaterThan(-30);
      expect(forecast.nextQuarter.priceChange).toBeLessThan(30);
      expect(forecast.nextQuarter.confidence).toBeGreaterThan(0);
      expect(forecast.nextQuarter.confidence).toBeLessThanOrEqual(1);

      // Next Year Forecast
      expect(forecast.nextYear.priceChange).toBeGreaterThan(-50);
      expect(forecast.nextYear.priceChange).toBeLessThan(50);
      expect(forecast.nextYear.confidence).toBeGreaterThan(0);
      expect(forecast.nextYear.confidence).toBeLessThanOrEqual(1);
    });

    it('maintains forecast confidence relationship', () => {
      const { forecast } = marketTrends;
      
      // Confidence should decrease over time
      expect(forecast.nextMonth.confidence).toBeGreaterThanOrEqual(forecast.nextQuarter.confidence);
      expect(forecast.nextQuarter.confidence).toBeGreaterThanOrEqual(forecast.nextYear.confidence);
    });
  });

  describe('Seasonality Analysis', () => {
    let seasonality: SeasonalityData[];

    beforeEach(() => {
      expect(result.marketTrends.seasonality).toBeDefined();
      seasonality = result.marketTrends.seasonality;
    });

    it('analyzes monthly patterns correctly', () => {
      expect(seasonality.length).toBe(12); // Should have data for all months
      
      seasonality.forEach((month, index) => {
        expect(month.month).toBe(index + 1);
        expect(month.averagePrice).toBeGreaterThan(0);
        expect(month.salesVolume).toBeGreaterThanOrEqual(0);
      });
    });

    it('identifies peak and low seasons', () => {
      const peakMonth = seasonality.reduce((max, month) => 
        month.salesVolume > max.salesVolume ? month : max
      );

      const lowMonth = seasonality.reduce((min, month) => 
        month.salesVolume < min.salesVolume ? month : min
      );

      expect(peakMonth.salesVolume).toBeGreaterThan(lowMonth.salesVolume);
    });

    it('maintains price consistency', () => {
      const prices = seasonality.map(month => month.averagePrice);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      // Price variation should be within reasonable bounds (e.g., 30%)
      expect((maxPrice - minPrice) / minPrice).toBeLessThan(0.3);
    });
  });

  describe('Market Trends', () => {
    let marketTrends: MarketTrends;

    beforeEach(() => {
      expect(result.marketTrends).toBeDefined();
      marketTrends = result.marketTrends;
    });

    it('analyzes price history correctly', () => {
      const { priceHistory } = marketTrends;
      expect(priceHistory.length).toBeGreaterThan(0);

      priceHistory.forEach(point => {
        expect(point.date).toMatch(/^\d{4}-\d{2}$/); // YYYY-MM format
        expect(point.price).toBeGreaterThan(0);
        expect(point.volume).toBeGreaterThanOrEqual(0);
      });
    });

    it('maintains chronological order', () => {
      const { priceHistory } = marketTrends;
      
      for (let i = 1; i < priceHistory.length; i++) {
        const prevDate = new Date(priceHistory[i - 1].date);
        const currDate = new Date(priceHistory[i].date);
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
      }
    });

    it('calculates reasonable price changes', () => {
      const { priceHistory } = marketTrends;
      
      for (let i = 1; i < priceHistory.length; i++) {
        const prevPrice = priceHistory[i - 1].price;
        const currPrice = priceHistory[i].price;
        const priceChange = (currPrice - prevPrice) / prevPrice;

        // Monthly price changes should be within reasonable bounds (e.g., ±10%)
        expect(Math.abs(priceChange)).toBeLessThan(0.1);
      }
    });
  });
}); 