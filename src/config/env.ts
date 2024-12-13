import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate and export environment variables
export const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
export const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY is not set in environment variables');
}

if (!AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is not set in environment variables');
}

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
} 