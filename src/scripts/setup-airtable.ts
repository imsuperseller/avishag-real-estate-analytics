import Airtable from 'airtable';
import * as dotenv from 'dotenv';

dotenv.config();

const airtableBase = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID || '');

console.log('Please create the following tables in your Airtable base first:');
console.log('1. Property Analysis');
console.log('2. Market Trends');
console.log('3. Listings');
console.log('4. Transactions');
console.log('\nMake sure to include these fields in each table:');
console.log('\nProperty Analysis:');
console.log('- Name (Single line text)');
console.log('- Report Date (Date)');
console.log('- Active Listings (Number)');
console.log('- Closed Sales (Number)');
console.log('- Average List Price (Currency)');
console.log('- Average Days on Market (Number)');
console.log('- Initial Analysis (Long text)');
console.log('- Market Condition (Single select: Hot, Moderate, Steady)');
console.log('- Active Listings Details (Long text)');
console.log('- Recent Sales (Long text)');

console.log('\nMarket Trends:');
console.log('- Name (Single line text)');
console.log('- Date (Date)');
console.log('- Average Price (Currency)');
console.log('- Median Price (Currency)');
console.log('- Total Listings (Number)');
console.log('- Days on Market (Number)');
console.log('- Price per Sqft (Currency)');
console.log('- Notes (Long text)');

console.log('\nListings:');
console.log('- Name (Single line text)');
console.log('- MLS Number (Single line text)');
console.log('- Address (Single line text)');
console.log('- List Price (Currency)');
console.log('- Bedrooms (Number)');
console.log('- Bathrooms (Number)');
console.log('- Sqft (Number)');
console.log('- Status (Single select: Active, Pending, Sold, Expired)');
console.log('- List Date (Date)');
console.log('- Last Update (Date)');
console.log('- Notes (Long text)');

console.log('\nTransactions:');
console.log('- Name (Single line text)');
console.log('- MLS Number (Single line text)');
console.log('- Address (Single line text)');
console.log('- Sold Price (Currency)');
console.log('- List Price (Currency)');
console.log('- Sale Date (Date)');
console.log('- Days on Market (Number)');
console.log('- Price per Sqft (Currency)');
console.log('- Notes (Long text)');

console.log('\nAfter creating these tables, you can:');
console.log('1. Delete the old table with ID: tblTU0WDMsmt8lCBN');
console.log('2. Set up views and filters for each table as needed');
console.log('3. Run the application to start collecting data'); 