import type { NextApiRequest, NextApiResponse } from 'next';
import { processPDF } from '@/utils/pdf-processor';
import type { MLSReport, DemographicMetric } from '@/types/property';

function isDemographicMetric(metric: any): metric is DemographicMetric {
  return (
    typeof metric === 'object' &&
    'value' in metric &&
    'trend' in metric &&
    'percentChange' in metric
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pdfBuffer = Buffer.from(req.body.pdf, 'base64');
    const result = await processPDF(pdfBuffer);

    if (!result.success || !result.data) {
      return res.status(400).json({ error: result.error || 'Failed to process PDF' });
    }

    const formatDemographicMetric = (metric: DemographicMetric | { [key: string]: DemographicMetric }): string => {
      if (isDemographicMetric(metric)) {
        return `${metric.value.toLocaleString()} (${metric.trend}, ${metric.percentChange > 0 ? '+' : ''}${metric.percentChange}%)`;
      }
      return Object.entries(metric)
        .map(([key, value]) => `${key}: ${formatDemographicMetric(value)}`)
        .join(', ');
    };

    // Format the response data
    const formattedData = {
      ...result.data,
      summary: {
        listPrice: `$${result.data.listPrice.toLocaleString()}`,
        propertyType: result.data.propertyType,
        location: `${result.data.address.city}, ${result.data.address.state}`,
        demographics: {
          population: formatDemographicMetric(result.data.demographicAnalysis.population),
          medianIncome: formatDemographicMetric(result.data.demographicAnalysis.medianIncome),
          education: formatDemographicMetric(result.data.demographicAnalysis.educationLevels)
        }
      }
    };

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 