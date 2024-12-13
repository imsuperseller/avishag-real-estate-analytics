import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';
import type { MLSReport, Property, SchoolInfo, DemographicAnalysis, DemographicMetric } from '@/types/property';

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, mlsData } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!mlsData) {
    return res.status(400).json({ error: 'MLS data is required' });
  }

  try {
    // Prepare market context for the AI
    const marketContext = prepareMarketContext(mlsData);

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a knowledgeable real estate assistant. Analyze the market data and provide insights.',
        },
        {
          role: 'user',
          content: `Here is the current market data:\n${marketContext}\n\nUser question: ${message}`,
        },
      ],
    });

    const aiResponse = completion.data.choices[0]?.message?.content;

    if (!aiResponse) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    return res.status(200).json({ message: aiResponse });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
}

function isDemographicMetric(metric: any): metric is DemographicMetric {
  return (
    typeof metric === 'object' &&
    'value' in metric &&
    'trend' in metric &&
    'percentChange' in metric
  );
}

function prepareMarketContext(mlsData: MLSReport): string {
  const {
    statistics,
    marketTrends,
    schoolDistrict,
    schoolDistricts,
    demographicAnalysis,
    activeListings,
    closedListings
  } = mlsData;

  const formatListings = (listings: Property[]): string => {
    return listings.map(listing => 
      `- ${listing.address}: $${listing.listPrice.toLocaleString()} (${listing.bedrooms} beds, ${listing.bathrooms} baths, ${listing.sqft.toLocaleString()} sqft)`
    ).join('\n');
  };

  const formatSchoolDistricts = (districts: SchoolInfo[]): string => {
    return districts.map(district => 
      `- ${district.name}: Rating ${district.rating}/10, Type: ${district.type}, Distance: ${district.distance} miles`
    ).join('\n');
  };

  const formatDemographicMetric = (metric: DemographicMetric | { [key: string]: DemographicMetric }): string => {
    if (isDemographicMetric(metric)) {
      return `${metric.value.toLocaleString()} (${metric.trend}, ${metric.percentChange > 0 ? '+' : ''}${metric.percentChange}%)`;
    }
    return Object.entries(metric)
      .map(([key, value]) => `${key}: ${formatDemographicMetric(value)}`)
      .join(', ');
  };

  return `
Market Statistics:
- Average List Price: $${statistics.averageListPrice.toLocaleString()}
- Median List Price: $${statistics.medianListPrice.toLocaleString()}
- Average Sold Price: $${statistics.averageSoldPrice.toLocaleString()}
- Median Sold Price: $${statistics.medianSoldPrice.toLocaleString()}
- Median Days on Market: ${statistics.medianDaysOnMarket}
- Total Active Listings: ${statistics.totalActiveListings}
- Total Closed Sales: ${statistics.totalClosedSales}

Market Trends:
- Next Month Forecast: ${marketTrends.forecast.nextMonth.priceChange}% (${marketTrends.forecast.nextMonth.confidence * 100}% confidence)
- Next Quarter Forecast: ${marketTrends.forecast.nextQuarter.priceChange}% (${marketTrends.forecast.nextQuarter.confidence * 100}% confidence)
- Next Year Forecast: ${marketTrends.forecast.nextYear.priceChange}% (${marketTrends.forecast.nextYear.confidence * 100}% confidence)

Price History:
${marketTrends.priceHistory.map(point => 
  `- ${point.date}: $${point.price.toLocaleString()} (${point.volume} sales)`
).join('\n')}

Active Listings:
${formatListings(activeListings)}

Recently Closed:
${formatListings(closedListings)}

School Districts:
${formatSchoolDistricts(schoolDistricts)}

Demographics:
- Population: ${formatDemographicMetric(demographicAnalysis.population)}
- Median Age: ${formatDemographicMetric(demographicAnalysis.medianAge)}
- Median Income: ${formatDemographicMetric(demographicAnalysis.medianIncome)}
- Employment Rate: ${formatDemographicMetric(demographicAnalysis.employmentRate)}
- Education:
  - High School: ${formatDemographicMetric(demographicAnalysis.educationLevels.highSchool)}
  - Bachelor's: ${formatDemographicMetric(demographicAnalysis.educationLevels.bachelors)}
  - Graduate: ${formatDemographicMetric(demographicAnalysis.educationLevels.graduate)}
`;
} 