require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/schoolgo',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function check() {
  try {
    const res = await pool.query("SELECT * FROM audit_logs WHERE org_id = 'ebbf43ad-65d5-4aae-ac00-ee8fdcec097d' ORDER BY created_at DESC LIMIT 30");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
check();
