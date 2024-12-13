import { createMocks } from 'node-mocks-http';
import chatHandler from '@/pages/api/chat';
import type { MLSReport } from '@/types/property';
import { mockMLSData } from '@/tests/test-utils';

jest.mock('openai', () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn(() => ({
    createChatCompletion: jest.fn().mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: 'Test response'
            }
          }
        ]
      }
    })
  }))
}));

describe('Chat API', () => {
  const testMLSData: MLSReport = {
    ...mockMLSData,
    statistics: {
      averageDaysOnMarket: 25,
      medianDaysOnMarket: 20,
      totalActiveListings: 150,
      totalClosedSales: 45,
      averagePrice: 485000,
      medianPrice: 475000,
      pricePerSquareFoot: 194,
      inventoryLevel: 2.5,
      daysOfInventory: 75,
      absorptionRate: 30,
      newListings: 65,
      closedListings: 45,
      pendingListings: 35,
      canceledListings: 5,
      averageListPrice: 495000,
      medianListPrice: 485000,
      averageSoldPrice: 490000,
      medianSoldPrice: 480000,
      listToSoldRatio: 0.98,
      monthsOfSupply: 3.2
    }
  };

  it('handles chat messages correctly', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: 'What is the average list price?',
        mlsData: testMLSData
      }
    });

    await chatHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('message');
    expect(typeof data.message).toBe('string');
  });

  it('handles missing message', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        mlsData: testMLSData
      }
    });

    await chatHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Message is required');
  });

  it('handles missing MLS data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: 'What is the average list price?'
      }
    });

    await chatHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('MLS data is required');
  });

  it('handles invalid HTTP method', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await chatHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Method not allowed');
  });
}); 