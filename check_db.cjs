const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
});
client.connect().then(async () => {
  try {
    // Check columns
    const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'modules'`);
    console.log("Columns in modules table:");
    console.log(cols.rows.map(r => r.column_name));

    // Wait for cols output, maybe the title column is called 'name'
    const nameCol = cols.rows.find(r => r.column_name === 'name' || r.column_name === 'title');
    if (nameCol) {
      const col = nameCol.column_name;
      const res = await client.query(`SELECT ${col}, count(*) FROM modules GROUP BY ${col} HAVING count(*) > 1`);
      console.log("Duplicates:");
      console.log(res.rows);
      
      if (res.rows.length > 0) {
          console.log("Found duplicates, deleting duplicates but keeping one copy...");
          for (const row of res.rows) {
              const val = row[col];
              console.log(`Deleting duplicates for ${val}...`);
              // Delete all but the first one created
              await client.query(`
                DELETE FROM modules 
                WHERE ${col} = $1 
                AND id NOT IN (
                    SELECT id FROM modules WHERE ${col} = $1 ORDER BY created_at ASC LIMIT 1
                )
              `, [val]);
          }
          console.log("Duplicates deleted.");
      } else {
          console.log("No duplicates found.");
      }
    } else {
      console.log("Could not find a name or title column.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.end();
  }
});
