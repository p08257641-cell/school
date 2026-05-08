const pg = require('pg');
const { Pool } = pg;
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');
    
    // Add columns to student_attendance if they don't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_attendance' AND column_name='clock_in') THEN
          ALTER TABLE student_attendance ADD COLUMN clock_in TIME;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_attendance' AND column_name='clock_out') THEN
          ALTER TABLE student_attendance ADD COLUMN clock_out TIME;
        END IF;
      END $$;
    `);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
