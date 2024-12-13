import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/process-pdf';
import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';
import { validateMLSReport, extractMLSData } from '@/utils/mls-validator';

// Mock dependencies
jest.mock('formidable');
jest.mock('fs');
jest.mock('pdf-parse');
jest.mock('@/utils/mls-validator');

describe('/api/process-pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: 'Method not allowed',
      })
    );
  });

  it('handles successful PDF upload and processing', async () => {
    const mockFile = {
      filepath: '/tmp/test.pdf',
      type: 'application/pdf',
      size: 1024,
    };

    const mockMLSData = {
      activeListings: [
        {
          mlsNumber: 'TEST123',
          address: '123 Test St',
          listPrice: 500000,
        },
      ],
      closedListings: [],
      statistics: {
        averageListPrice: 500000,
        averageDaysOnMarket: 30,
      },
    };

    // Mock form parsing
    (formidable as jest.Mocked<any>).mockImplementation(() => ({
      parse: jest.fn().mockResolvedValue([{}, { file: [mockFile] }]),
    }));

    // Mock file reading
    (fs.promises.readFile as jest.Mock).mockResolvedValue(Buffer.from('test'));

    // Mock PDF parsing
    (pdf as jest.Mock).mockResolvedValue({ text: 'Sample MLS Report' });

    // Mock MLS data extraction
    (extractMLSData as jest.Mock).mockReturnValue(mockMLSData);
    (validateMLSReport as jest.Mock).mockReturnValue([]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        mlsData: mockMLSData,
        message: expect.stringContaining('analyzed the MLS report'),
      })
    );
  });

  it('handles missing file upload', async () => {
    // Mock form parsing with no file
    (formidable as jest.Mocked<any>).mockImplementation(() => ({
      parse: jest.fn().mockResolvedValue([{}, { file: [] }]),
    }));

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: 'No file uploaded',
      })
    );
  });

  it('handles validation errors', async () => {
    const mockFile = {
      filepath: '/tmp/test.pdf',
      type: 'application/pdf',
      size: 1024,
    };

    // Mock form parsing
    (formidable as jest.Mocked<any>).mockImplementation(() => ({
      parse: jest.fn().mockResolvedValue([{}, { file: [mockFile] }]),
    }));

    // Mock file reading
    (fs.promises.readFile as jest.Mock).mockResolvedValue(Buffer.from('test'));

    // Mock PDF parsing
    (pdf as jest.Mock).mockResolvedValue({ text: 'Sample MLS Report' });

    // Mock validation error
    (validateMLSReport as jest.Mock).mockReturnValue(['Invalid data format']);

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('Data validation failed'),
      })
    );
  });

  it('handles PDF parsing errors', async () => {
    const mockFile = {
      filepath: '/tmp/test.pdf',
      type: 'application/pdf',
      size: 1024,
    };

    // Mock form parsing
    (formidable as jest.Mocked<any>).mockImplementation(() => ({
      parse: jest.fn().mockResolvedValue([{}, { file: [mockFile] }]),
    }));

    // Mock file reading
    (fs.promises.readFile as jest.Mock).mockResolvedValue(Buffer.from('test'));

    // Mock PDF parsing error
    (pdf as jest.Mock).mockRejectedValue(new Error('Failed to parse PDF'));

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: 'Failed to parse PDF',
      })
    );
  });

  it('handles file system errors', async () => {
    const mockFile = {
      filepath: '/tmp/test.pdf',
      type: 'application/pdf',
      size: 1024,
    };

    // Mock form parsing
    (formidable as jest.Mocked<any>).mockImplementation(() => ({
      parse: jest.fn().mockResolvedValue([{}, { file: [mockFile] }]),
    }));

    // Mock file reading error
    (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error('File system error'));

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('File system error'),
      })
    );
  });
}); 