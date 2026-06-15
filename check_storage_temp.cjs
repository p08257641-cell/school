const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT id, name, bucket_id, created_at FROM storage.objects WHERE bucket_id = 'portfolio'")
  .then(r => {
    console.log(JSON.stringify(r.rows, null, 2));
  })
  .catch(console.error)
  .finally(() => {
    pool.end();
  });
