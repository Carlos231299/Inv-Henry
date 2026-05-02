import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://postgres.dhraskohdryobvvjlbei:Jjesquivel123*@aws-0-us-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

console.log('Intentando conectar a db.dhraskohdryobvvjlbei.supabase.co...');
client.connect()
  .then(() => {
    console.log('¡Conexión exitosa!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error de conexión:', err.message);
    process.exit(1);
  });
