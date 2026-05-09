const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name, table_name FROM information_schema.columns WHERE column_name IN ('fcm_token', 'parent_fcm_token');");
  console.log(res.rows);
  await client.end();
}

run();
