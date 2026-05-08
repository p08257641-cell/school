import pool from '../server/db.ts';

async function migrate() {
    try {
        console.log('Adding fcm_token column to users table...');
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS fcm_token TEXT;
            
            ALTER TABLE students
            ADD COLUMN IF NOT EXISTS fcm_token TEXT;
        `);
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
