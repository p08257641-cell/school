const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres' });
async function run() {
  await client.connect();
  const u = await client.query("SELECT * FROM users WHERE email='emily@gmail.com'");
  const s = await client.query("SELECT * FROM students WHERE parent_email='emily@gmail.com'");
  console.log('Users:', u.rows);
  console.log('Students:', s.rows);
  await client.end();
}
run();
