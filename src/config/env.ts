import dotenv from 'dotenv';

dotenv.config();

export const config = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  google: {
    aiStudioApiKey: process.env.GOOGLE_AI_STUDIO_API_KEY,
  },
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'OPENAI_API_KEY',
  'GOOGLE_AI_STUDIO_API_KEY',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
} 