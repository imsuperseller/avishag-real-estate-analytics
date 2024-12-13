import {
  validateMLSReport,
  validateMarketTrends,
  validatePricePoint,
  validateSchoolInfo,
  validateDemographicMetric,
  validateProperty,
  ValidationError
} from '@/utils/market-data-validator';
import { mockMLSData } from '@/tests/test-utils';
import type { MLSReport, PricePoint, SchoolInfo, DemographicMetric, Property } from '@/types/property';

describe('Market Data Validator', () => {
  describe('validatePricePoint', () => {
    const validPoint: PricePoint = {
      date: '2024-01',
      price: 500000,
      volume: 100
    };

    it('accepts valid price point', () => {
      expect(() => validatePricePoint(validPoint)).not.toThrow();
    });

    it('rejects invalid date format', () => {
      expect(() => validatePricePoint({ ...validPoint, date: '2024' }))
        .toThrow(new ValidationError('Invalid date format. Expected YYYY-MM', 'date'));
    });

    it('rejects negative price', () => {
      expect(() => validatePricePoint({ ...validPoint, price: -100 }))
        .toThrow(new ValidationError('Invalid price. Must be a positive number', 'price'));
    });

    it('rejects negative volume', () => {
      expect(() => validatePricePoint({ ...validPoint, volume: -1 }))
        .toThrow(new ValidationError('Invalid volume. Must be a positive number', 'volume'));
    });
  });

  describe('validateMarketTrends', () => {
    it('accepts valid market trends', () => {
      expect(() => validateMarketTrends(mockMLSData.marketTrends)).not.toThrow();
    });

    it('rejects non-chronological price history', () => {
      const invalidTrends = {
        ...mockMLSData.marketTrends,
        priceHistory: [
          { date: '2024-02', price: 500000, volume: 100 },
          { date: '2024-01', price: 500000, volume: 100 }
        ]
      };
      expect(() => validateMarketTrends(invalidTrends))
        .toThrow(new ValidationError('Price history must be in chronological order', 'priceHistory[1].date'));
    });

    it('rejects invalid seasonality data', () => {
      const invalidTrends = {
        ...mockMLSData.marketTrends,
        seasonality: [{ month: 13, averagePrice: 500000, salesVolume: 100 }]
      };
      expect(() => validateMarketTrends(invalidTrends))
        .toThrow(new ValidationError('Invalid month. Must be between 1 and 12', 'seasonality[0].month'));
    });
  });

  describe('validateSchoolInfo', () => {
    const validSchool: SchoolInfo = {
      name: 'Test School',
      rating: 8,
      type: 'elementary',
      distance: 1.5,
      enrollment: 500,
      studentTeacherRatio: 15
    };

    it('accepts valid school info', () => {
      expect(() => validateSchoolInfo(validSchool)).not.toThrow();
    });

    it('rejects invalid rating', () => {
      expect(() => validateSchoolInfo({ ...validSchool, rating: 11 }))
        .toThrow(new ValidationError('Invalid school rating. Must be between 0 and 10', 'rating'));
    });

    it('rejects invalid school type', () => {
      expect(() => validateSchoolInfo({ ...validSchool, type: 'invalid' as any }))
        .toThrow(new ValidationError('Invalid school type. Must be elementary, middle, or high', 'type'));
    });

    it('rejects negative distance', () => {
      expect(() => validateSchoolInfo({ ...validSchool, distance: -1 }))
        .toThrow(new ValidationError('Invalid distance. Must be a positive number', 'distance'));
    });
  });

  describe('validateDemographicMetric', () => {
    const validMetric: DemographicMetric = {
      value: 100000,
      percentChange: 5.5,
      trend: 'increasing'
    };

    it('accepts valid demographic metric', () => {
      expect(() => validateDemographicMetric(validMetric)).not.toThrow();
    });

    it('rejects invalid trend', () => {
      expect(() => validateDemographicMetric({ ...validMetric, trend: 'invalid' as any }))
        .toThrow(new ValidationError('Invalid trend. Must be increasing, decreasing, or stable', 'trend'));
    });

    it('rejects non-numeric value', () => {
      expect(() => validateDemographicMetric({ ...validMetric, value: 'invalid' as any }))
        .toThrow(new ValidationError('Invalid demographic value. Must be a number', 'value'));
    });

    it('rejects non-numeric percent change', () => {
      expect(() => validateDemographicMetric({ ...validMetric, percentChange: 'invalid' as any }))
        .toThrow(new ValidationError('Invalid percent change. Must be a number', 'percentChange'));
    });
  });

  describe('validateProperty', () => {
    const validProperty: Property = {
      mlsNumber: 'MLS123',
      address: '123 Test St',
      city: 'Test City',
      listPrice: 500000,
      sqft: 2000,
      bedrooms: 3,
      bathrooms: '2/1/0',  // 2 full, 1 half, 0 quarter
      yearBuilt: 2000,
      garage: '2 car attached',
      pool: false,
      acres: 0.25,
      pricePerSqft: 250
    };

    it('accepts valid property', () => {
      expect(() => validateProperty(validProperty)).not.toThrow();
    });

    it('rejects negative list price', () => {
      expect(() => validateProperty({ ...validProperty, listPrice: -100000 }))
        .toThrow(new ValidationError('Invalid list price. Must be a positive number', 'listPrice'));
    });

    it('rejects negative square footage', () => {
      expect(() => validateProperty({ ...validProperty, sqft: -1000 }))
        .toThrow(new ValidationError('Invalid square footage. Must be a positive number', 'sqft'));
    });

    it('rejects missing address', () => {
      expect(() => validateProperty({ ...validProperty, address: '' }))
        .toThrow(new ValidationError('Invalid address', 'address'));
    });

    it('rejects invalid bedroom count', () => {
      expect(() => validateProperty({ ...validProperty, bedrooms: -1 }))
        .toThrow(new ValidationError('Invalid number of bedrooms. Must be a positive number', 'bedrooms'));
    });

    it('rejects invalid bathroom format', () => {
      expect(() => validateProperty({ ...validProperty, bathrooms: '2' }))
        .toThrow(new ValidationError('Invalid bathroom format. Must be in format "full/half/quarter"', 'bathrooms'));
    });
  });

  describe('validateMLSReport', () => {
    it('accepts valid MLS report', () => {
      expect(() => validateMLSReport(mockMLSData)).not.toThrow();
    });

    it('rejects invalid market trends', () => {
      const invalidReport = {
        ...mockMLSData,
        marketTrends: {
          ...mockMLSData.marketTrends,
          priceHistory: [{ date: 'invalid', price: -1, volume: -1 }]
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(ValidationError);
    });

    it('rejects invalid school districts', () => {
      const invalidReport = {
        ...mockMLSData,
        schoolDistricts: [{ ...mockMLSData.schoolDistricts[0], rating: 11 }]
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(ValidationError);
    });

    it('rejects invalid demographic analysis', () => {
      const invalidReport = {
        ...mockMLSData,
        demographicAnalysis: {
          ...mockMLSData.demographicAnalysis,
          population: { 
            ...mockMLSData.demographicAnalysis.population, 
            trend: 'unknown' as 'increasing' | 'decreasing' | 'stable'
          }
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(ValidationError);
    });

    it('validates nested education levels', () => {
      const invalidReport = {
        ...mockMLSData,
        demographicAnalysis: {
          ...mockMLSData.demographicAnalysis,
          educationLevels: {
            ...mockMLSData.demographicAnalysis.educationLevels,
            highSchool: {
              value: 'invalid' as any,
              trend: 'increasing' as const,
              percentChange: 5
            }
          }
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Invalid demographic metric for educationLevels.highSchool/);
    });

    it('rejects invalid statistics', () => {
      const invalidReport = {
        ...mockMLSData,
        statistics: {
          ...mockMLSData.statistics,
          absorptionRate: 101
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(new ValidationError('Invalid absorption rate. Must be between 0 and 100', 'statistics.absorptionRate'));
    });

    it('provides detailed error messages for nested validation failures', () => {
      const invalidReport = {
        ...mockMLSData,
        activeListings: [{
          ...mockMLSData.activeListings[0],
          listPrice: -100000
        }]
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Invalid property in activeListings at index 0: Invalid list price/);
    });

    it('validates forecast confidence ranges', () => {
      const invalidReport = {
        ...mockMLSData,
        marketTrends: {
          ...mockMLSData.marketTrends,
          forecast: {
            ...mockMLSData.marketTrends.forecast,
            nextMonth: { priceChange: 1.2, confidence: 1.5 } // Invalid confidence > 1
          }
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Invalid confidence value/);
    });

    it('validates price per square foot calculations', () => {
      const invalidReport = {
        ...mockMLSData,
        activeListings: [{
          ...mockMLSData.activeListings[0],
          listPrice: 500000,
          sqft: 2000,
          pricePerSqft: 300 // Incorrect calculation
        }]
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Invalid price per square foot/);
    });

    it('validates consistent school district references', () => {
      const invalidReport = {
        ...mockMLSData,
        schoolDistrict: {
          ...mockMLSData.schoolDistrict,
          schools: {
            ...mockMLSData.schoolDistrict.schools,
            elementary: ["NonexistentSchool"] // School not in schoolDistricts array
          }
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Referenced school not found/);
    });

    it('validates demographic trend consistency', () => {
      const invalidReport = {
        ...mockMLSData,
        demographicAnalysis: {
          ...mockMLSData.demographicAnalysis,
          educationLevels: {
            ...mockMLSData.demographicAnalysis.educationLevels,
            total: {
              value: 2.0, // Sum greater than 1.0
              trend: 'increasing' as const,
              percentChange: 5
            }
          }
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Invalid education level total/);
    });

    it('validates market statistics relationships', () => {
      const invalidReport = {
        ...mockMLSData,
        statistics: {
          ...mockMLSData.statistics,
          totalActiveListings: 100,
          totalClosedSales: 50,
          absorptionRate: 20, // Inconsistent with listings/sales ratio
          monthsOfSupply: 8   // Inconsistent with absorption rate
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Inconsistent market statistics/);
    });

    it('validates price history chronology and trends', () => {
      const invalidReport = {
        ...mockMLSData,
        marketTrends: {
          ...mockMLSData.marketTrends,
          priceHistory: [
            { date: '2024-01', price: 500000, volume: 100 },
            { date: '2024-02', price: 505000, volume: 95 },
            { date: '2024-03', price: 450000, volume: 90 }  // Unrealistic price drop
          ]
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Suspicious price trend detected/);
    });

    it('validates seasonality patterns', () => {
      const invalidReport = {
        ...mockMLSData,
        marketTrends: {
          ...mockMLSData.marketTrends,
          seasonality: [
            { month: 1, averagePrice: 500000, salesVolume: 100 },
            { month: 2, averagePrice: 1000000, salesVolume: 95 }, // Unrealistic price jump
            { month: 3, averagePrice: 505000, salesVolume: 105 }
          ]
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Invalid seasonality pattern/);
    });

    it('validates demographic metric correlations', () => {
      const invalidReport = {
        ...mockMLSData,
        demographicAnalysis: {
          ...mockMLSData.demographicAnalysis,
          population: { value: 285000, trend: 'increasing' as const, percentChange: 50 }, // Unrealistic growth
          employmentRate: { value: 0.96, trend: 'decreasing' as const, percentChange: -40 }  // Inconsistent correlation
        }
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Inconsistent demographic trends/);
    });

    it('validates school district metrics consistency', () => {
      const invalidReport = {
        ...mockMLSData,
        schoolDistricts: [
          {
            ...mockMLSData.schoolDistricts[0],
            enrollment: 5000,
            studentTeacherRatio: 5  // Unrealistic ratio for enrollment
          }
        ]
      };
      expect(() => validateMLSReport(invalidReport))
        .toThrow(/Invalid student-teacher ratio/);
    });

    describe('Cross-field Validations', () => {
      it('validates price trends across active and closed listings', () => {
        const invalidReport = {
          ...mockMLSData,
          activeListings: [{
            ...mockMLSData.activeListings[0],
            listPrice: 1000000
          }],
          statistics: {
            ...mockMLSData.statistics,
            averageListPrice: 500000  // Inconsistent with active listing price
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Inconsistent listing price statistics/);
      });

      it('validates demographic trends against market metrics', () => {
        const invalidReport = {
          ...mockMLSData,
          demographicAnalysis: {
            ...mockMLSData.demographicAnalysis,
            medianIncome: { value: 50000, trend: 'decreasing' as const, percentChange: -20 }
          },
          statistics: {
            ...mockMLSData.statistics,
            averagePrice: 1000000,  // Unrealistic price for income level
            medianPrice: 950000
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Price-to-income ratio exceeds reasonable threshold/);
      });
    });

    describe('Time Series Validations', () => {
      it('validates price volatility thresholds', () => {
        const invalidReport = {
          ...mockMLSData,
          marketTrends: {
            ...mockMLSData.marketTrends,
            priceHistory: [
              { date: '2024-01', price: 500000, volume: 100 },
              { date: '2024-02', price: 600000, volume: 95 },  // 20% increase
              { date: '2024-03', price: 450000, volume: 90 }   // 25% decrease
            ]
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Price volatility exceeds market threshold/);
      });

      it('validates seasonal volume patterns', () => {
        const invalidReport = {
          ...mockMLSData,
          marketTrends: {
            ...mockMLSData.marketTrends,
            seasonality: [
              { month: 6, averagePrice: 500000, salesVolume: 200 },  // Summer peak
              { month: 7, averagePrice: 505000, salesVolume: 50 }    // Unrealistic summer drop
            ]
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Invalid seasonal volume pattern/);
      });

      it('validates year-over-year growth rates', () => {
        const invalidReport = {
          ...mockMLSData,
          marketTrends: {
            ...mockMLSData.marketTrends,
            forecast: {
              ...mockMLSData.marketTrends.forecast,
              nextYear: { priceChange: 50, confidence: 0.9 }  // Unrealistic annual growth
            }
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Annual growth rate exceeds historical bounds/);
      });
    });

    describe('Data Integrity Validations', () => {
      it('validates listing history completeness', () => {
        const invalidReport = {
          ...mockMLSData,
          activeListings: [{
            ...mockMLSData.activeListings[0],
            daysOnMarket: 30
          }],
          statistics: {
            ...mockMLSData.statistics,
            averageDaysOnMarket: 25,
            medianDaysOnMarket: 20,
            totalActiveListings: 1
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Inconsistent days on market statistics/);
      });

      it('validates price distribution normality', () => {
        const invalidReport = {
          ...mockMLSData,
          statistics: {
            ...mockMLSData.statistics,
            averagePrice: 1000000,
            medianPrice: 500000,  // Too large deviation from average
            averageListPrice: 1100000,
            medianListPrice: 480000
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Price distribution exceeds normal bounds/);
      });

      it('validates inventory metrics consistency', () => {
        const invalidReport = {
          ...mockMLSData,
          statistics: {
            ...mockMLSData.statistics,
            totalActiveListings: 100,
            newListings: 50,
            closedListings: 30,
            pendingListings: 40,
            canceledListings: 20,
            inventoryLevel: 60  // Inconsistent with listing counts
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Inconsistent inventory metrics/);
      });
    });

    describe('Geographic Data Validations', () => {
      it('validates school district coverage', () => {
        const invalidReport = {
          ...mockMLSData,
          schoolDistricts: [
            {
              ...mockMLSData.schoolDistricts[0],
              distance: 15  // Too far for primary coverage
            }
          ]
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/School district outside reasonable distance/);
      });

      it('validates demographic data boundaries', () => {
        const invalidReport = {
          ...mockMLSData,
          demographicAnalysis: {
            ...mockMLSData.demographicAnalysis,
            population: { 
              value: 10000000, // Unrealistic for local area
              trend: 'increasing' as const,
              percentChange: 2.5
            }
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Population exceeds geographic bounds/);
      });

      it('validates price consistency within area', () => {
        const invalidReport = {
          ...mockMLSData,
          activeListings: [{
            ...mockMLSData.activeListings[0],
            listPrice: 5000000,  // Significantly above area median
            city: 'Plano'
          }],
          statistics: {
            ...mockMLSData.statistics,
            medianPrice: 400000
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Price anomaly detected for geographic area/);
      });
    });

    describe('Trend Analysis Validations', () => {
      it('validates trend consistency across metrics', () => {
        const invalidReport = {
          ...mockMLSData,
          demographicAnalysis: {
            ...mockMLSData.demographicAnalysis,
            medianIncome: { value: 95000, trend: 'increasing' as const, percentChange: 5 },
            employmentRate: { value: 0.96, trend: 'decreasing' as const, percentChange: -10 }
          },
          marketTrends: {
            ...mockMLSData.marketTrends,
            forecast: {
              ...mockMLSData.marketTrends.forecast,
              nextYear: { priceChange: 15, confidence: 0.8 }  // Inconsistent with economic indicators
            }
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Inconsistent trend indicators/);
      });

      it('validates absorption rate trends', () => {
        const invalidReport = {
          ...mockMLSData,
          statistics: {
            ...mockMLSData.statistics,
            absorptionRate: 80,        // High absorption rate
            daysOnMarket: 120,         // Contradictory DOM
            monthsOfSupply: 8          // Contradictory supply
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Contradictory market velocity indicators/);
      });

      it('validates price-to-rent ratio trends', () => {
        const invalidReport = {
          ...mockMLSData,
          statistics: {
            ...mockMLSData.statistics,
            medianPrice: 1000000,
            medianRent: 1000  // Unrealistic P/R ratio
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Price-to-rent ratio outside sustainable range/);
      });
    });

    describe('Market Condition Validations', () => {
      describe('Buyer\'s Market Indicators', () => {
        it('validates consistent buyer\'s market signals', () => {
          const invalidReport = {
            ...mockMLSData,
            statistics: {
              ...mockMLSData.statistics,
              monthsOfSupply: 8,           // Buyer's market
              absorptionRate: 80,          // Contradicts buyer's market
              listToSoldRatio: 0.98,       // Contradicts buyer's market
              daysOnMarket: 20             // Contradicts buyer's market
            }
          };
          expect(() => validateMLSReport(invalidReport))
            .toThrow(/Inconsistent market condition indicators/);
        });

        it('validates price reduction patterns', () => {
          const invalidReport = {
            ...mockMLSData,
            statistics: {
              ...mockMLSData.statistics,
              averageListPrice: 500000,
              averageSoldPrice: 450000,    // 10% reduction
              listToSoldRatio: 0.98        // Contradicts price reduction
            }
          };
          expect(() => validateMLSReport(invalidReport))
            .toThrow(/Inconsistent price reduction metrics/);
        });
      });

      describe('Seller\'s Market Indicators', () => {
        it('validates consistent seller\'s market signals', () => {
          const invalidReport = {
            ...mockMLSData,
            statistics: {
              ...mockMLSData.statistics,
              monthsOfSupply: 2,           // Seller's market
              daysOnMarket: 90,            // Contradicts seller's market
              listToSoldRatio: 0.92,       // Contradicts seller's market
              absorptionRate: 30           // Contradicts seller's market
            }
          };
          expect(() => validateMLSReport(invalidReport))
            .toThrow(/Inconsistent market condition indicators/);
        });

        it('validates multiple offer patterns', () => {
          const invalidReport = {
            ...mockMLSData,
            statistics: {
              ...mockMLSData.statistics,
              averageListPrice: 500000,
              averageSoldPrice: 520000,    // Above list price
              listToSoldRatio: 0.98        // Contradicts multiple offers
            }
          };
          expect(() => validateMLSReport(invalidReport))
            .toThrow(/Inconsistent sale-to-list metrics/);
        });
      });

      describe('Market Transition Indicators', () => {
        it('validates consistent transition signals', () => {
          const invalidReport = {
            ...mockMLSData,
            marketTrends: {
              ...mockMLSData.marketTrends,
              priceHistory: [
                { date: '2024-01', price: 500000, volume: 100 },
                { date: '2024-02', price: 495000, volume: 90 },  // Price decrease
                { date: '2024-03', price: 490000, volume: 110 }  // Volume increase contradicts
              ]
            }
          };
          expect(() => validateMLSReport(invalidReport))
            .toThrow(/Inconsistent market transition indicators/);
        });

        it('validates inventory shift patterns', () => {
          const invalidReport = {
            ...mockMLSData,
            statistics: {
              ...mockMLSData.statistics,
              inventoryLevel: 150,          // Increasing
              newListings: 20,              // Low new listings
              absorptionRate: 60            // High absorption
            }
          };
          expect(() => validateMLSReport(invalidReport))
            .toThrow(/Inconsistent inventory transition patterns/);
        });
      });
    });

    describe('Performance Benchmarks', () => {
      const generateLargeDataset = (size: number): MLSReport => ({
        ...mockMLSData,
        activeListings: Array(size).fill(mockMLSData.activeListings[0]),
        closedListings: Array(size).fill(mockMLSData.closedListings[0]),
        marketTrends: {
          ...mockMLSData.marketTrends,
          priceHistory: Array(size).fill(mockMLSData.marketTrends.priceHistory[0])
        }
      });

      it('validates small dataset (100 records) within 50ms', () => {
        const startTime = performance.now();
        const report = generateLargeDataset(100);
        validateMLSReport(report);
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(50);
      });

      it('validates medium dataset (1000 records) within 200ms', () => {
        const startTime = performance.now();
        const report = generateLargeDataset(1000);
        validateMLSReport(report);
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(200);
      });

      it('validates large dataset (5000 records) within 1000ms', () => {
        const startTime = performance.now();
        const report = generateLargeDataset(5000);
        validateMLSReport(report);
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(1000);
      });

      it('handles concurrent validations efficiently', async () => {
        const reports = Array(10).fill(null).map(() => generateLargeDataset(100));
        const startTime = performance.now();
        await Promise.all(reports.map(report => 
          new Promise(resolve => resolve(validateMLSReport(report)))
        ));
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(500);
      });
    });

    describe('Edge Case Market Conditions', () => {
      it('validates rapid market shift indicators', () => {
        const invalidReport = {
          ...mockMLSData,
          marketTrends: {
            ...mockMLSData.marketTrends,
            priceHistory: [
              { date: '2024-01', price: 500000, volume: 100 },
              { date: '2024-02', price: 450000, volume: 150 }, // Price drop but volume up
              { date: '2024-03', price: 400000, volume: 200 }  // Continued pattern
            ]
          },
          statistics: {
            ...mockMLSData.statistics,
            newListings: 100,              // High new listings
            pendingListings: 90,           // High pending
            daysOnMarket: 15               // Low DOM
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Unusual market shift pattern detected/);
      });

      it('validates seasonal anomaly patterns', () => {
        const invalidReport = {
          ...mockMLSData,
          marketTrends: {
            ...mockMLSData.marketTrends,
            seasonality: [
              { month: 12, averagePrice: 500000, salesVolume: 200 }, // December peak
              { month: 6, averagePrice: 450000, salesVolume: 50 }    // Summer low
            ]
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Abnormal seasonal pattern detected/);
      });

      it('validates micro-market divergence', () => {
        const invalidReport = {
          ...mockMLSData,
          activeListings: [
            {
              ...mockMLSData.activeListings[0],
              city: 'Plano',
              listPrice: 1000000
            },
            {
              ...mockMLSData.activeListings[0],
              city: 'Plano',
              listPrice: 200000
            }
          ],
          statistics: {
            ...mockMLSData.statistics,
            medianPrice: 500000
          }
        };
        expect(() => validateMLSReport(invalidReport))
          .toThrow(/Significant micro-market price divergence detected/);
      });
    });
  });
}); 