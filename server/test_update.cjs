require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/schoolgo',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function run() {
  try {
    console.log('Resetting bestpoint background_images to empty array...');
    
    const queryStr = `UPDATE organizations SET background_images = $1 WHERE custom_domain = $2 RETURNING *`;
    const values = [JSON.stringify([]), 'bestpoint'];
    console.log('Query:', queryStr);
    
    const result = await pool.query(queryStr, values);
    console.log('Success! Reset row:');
    console.log(JSON.stringify({
      id: result.rows[0].id,
      name: result.rows[0].name,
      background_images: result.rows[0].background_images
    }, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}
run();

