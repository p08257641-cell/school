import pool from './server/db.js';

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. Create assignment_questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Created assignment_questions table (if it did not exist).');

    // 2. Add batch column to students table
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'batch') THEN
          ALTER TABLE students ADD COLUMN batch VARCHAR(50);
        END IF;
      END $$;
    `);
    console.log('Added batch column to students table (if it did not exist).');

    // Also update supabase_schema.sql by using a simple sed-like replacement in JS or we can do it with an agent tool later.

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
