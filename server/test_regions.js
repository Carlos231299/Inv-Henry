import pg from 'pg';
const { Client } = pg;

const regions = [
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1'
];

async function testRegions() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Probando regin: ${region} (${host})...`);
    const client = new Client({
      connectionString: `postgres://postgres.dhraskohdryobvvjlbei:Jjesquivel123*@${host}:6543/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`XITO en ${region}!`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`FALLO en ${region}: ${err.message}`);
    }
  }
}

testRegions();
