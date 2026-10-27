import { pool } from '../config/db.js';

const companies = [
  'Stripe', 'Cloudflare', 'Airbnb', 'Databricks', 'Palantir', 'OpenAI', 'Notion', 'Visa',
  'Nvidia', 'Salesforce', 'Adobe', 'Walmart', 'Intel', 'Amazon', 'Apple', 'Google',
  'Microsoft', 'Netflix', 'Meta', 'Oracle', 'JPMorgan Chase', 'SAP', 'Siemens', 'Keysight',
  'TCS', 'Infosys', 'Wipro', 'HCLTech', 'Tech Mahindra', 'Accenture', 'Deloitte', 'PwC India',
  'Uber', 'Goldman Sachs', 'Tesla', 'IBM', 'Capgemini', 'Cognizant', 'Nestle', 'Bosch',
  'McKinsey', 'BCG', 'EY', 'USAJobs', 'Flipkart', 'Zomato', 'ICICI Bank', 'HDFC Bank',
  'Transport for London', 'Novo Holdings', 'Chick fil A', 'IAEA', 'Point5Star',
  'Ewing Outdoor Supply', 'Spotify', 'Commonwealth Fusion Systems', 'Hock Safety', 'Circle.so',
  'Oura', 'Razorpay', 'Freshworks', 'NaNLABS', 'Better Collective', 'LIQUI MOLY', 'Embraer',
  'Openprise', 'SKIMS', 'Kaltura', 'IFTT Medical Staffing', 'Egnyte', 'HSBC', 'Vodafone',
  'Zalando', 'Volkswagen Group', "L'Oréal", 'Banco Santander', 'Rakuten', 'Saudi Aramco'
];

async function seed() {
  console.log(`Seeding ${companies.length} test companies from developer instructions...`);

  // Rule #5 compliance: ensure Indeed/LinkedIn/Naukri are blocked if present
  await pool.query(`
    UPDATE scraped_companies 
    SET access_status = 'RESTRICTED'
    WHERE LOWER(name) IN ('indeed', 'linkedin', 'naukri')
  `);

  for (const name of companies) {
    const cleanName = name.trim();
    const existing = await pool.query('SELECT id FROM scraped_companies WHERE LOWER(name) = LOWER($1)', [cleanName]);
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO scraped_companies (name, website, career_url, ats_provider, access_status, verification_status)
        VALUES ($1, '', '', 'Auto-detect', 'ALLOWED', 'Needs review')
      `, [cleanName]);
      console.log(`+ Added ${cleanName}`);
    } else {
      console.log(`- ${cleanName} already present`);
    }
  }

  const total = await pool.query('SELECT count(*) FROM scraped_companies');
  console.log(`Done! Total companies in database: ${total.rows[0].count}`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
