require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/schoolgo',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function check() {
  try {
    const res = await pool.query("SELECT id, name, custom_domain, background_image, background_images FROM organizations WHERE custom_domain = 'bestpoint'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
check();
