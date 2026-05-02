import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = {
  get: async (sql, params) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const finalParams = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
    const res = await pool.query(pgSql, finalParams);
    return res.rows[0];
  },
  all: async (sql, params) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const finalParams = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
    const res = await pool.query(pgSql, finalParams);
    return res.rows;
  },
  run: async (sql, params) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const finalParams = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
    const res = await pool.query(pgSql, finalParams);
    return { lastID: res.rows[0]?.id || null, changes: res.rowCount };
  },
  exec: async (sql) => {
    await pool.query(sql);
  }
};

export const initDB = async () => {
  // Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'vendedor',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  // Products Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price_buy DECIMAL(12,2) DEFAULT 0,
      price_sell DECIMAL(12,2) NOT NULL,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      category_id INTEGER REFERENCES categories(id)
    )
  `);

  // Suppliers Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      nit TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      email TEXT
    )
  `);

  // Customers Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      document TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      email TEXT
    )
  `);

  // Sales Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER REFERENCES users(id),
      customer_id INTEGER REFERENCES customers(id),
      total DECIMAL(12,2) NOT NULL,
      payment_method TEXT DEFAULT 'efectivo',
      cash_received DECIMAL(12,2),
      change_given DECIMAL(12,2),
      invoice_number TEXT
    )
  `);

  // Sale Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER REFERENCES sales(id),
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price DECIMAL(12,2) NOT NULL
    )
  `);

  // Purchases Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER REFERENCES users(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      total DECIMAL(12,2) NOT NULL,
      status TEXT DEFAULT 'completed'
    )
  `);

  // Purchase Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id SERIAL PRIMARY KEY,
      purchase_id INTEGER REFERENCES purchases(id),
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price DECIMAL(12,2) NOT NULL
    )
  `);

  // Settings Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Create default admin user if not exists
  const admin = await db.get('SELECT * FROM users WHERE username = $1', ['admin']);
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await db.run('INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)',
      ['admin', hashedPassword, 'Administrador Principal', 'admin']
    );
    console.log('Usuario administrador creado por defecto.');
  }

  await seedData();
};

const seedData = async () => {
  const categories = [
    { name: 'Electrónica', description: 'Dispositivos y gadgets' },
    { name: 'Papelería', description: 'Útiles de oficina' },
    { name: 'Carnicería', description: 'Productos cárnicos' },
    { name: 'Aseo', description: 'Productos de limpieza' }
  ];

  for (const cat of categories) {
    const exists = await db.get('SELECT id FROM categories WHERE name = $1', [cat.name]);
    if (!exists) {
      await db.run('INSERT INTO categories (name, description) VALUES ($1, $2)', [cat.name, cat.description]);
    }
  }

  const suppliers = [
    { name: 'Tech Distribuciones', nit: '900123456-1', phone: '3001234567', address: 'Calle 10 #20-30', email: 'ventas@tech.com' },
    { name: 'Papeles del Sur', nit: '800654321-2', phone: '3109876543', address: 'Av. Sur 45-12', email: 'info@papelessur.com' }
  ];

  for (const s of suppliers) {
    const exists = await db.get('SELECT id FROM suppliers WHERE nit = $1', [s.nit]);
    if (!exists) {
      await db.run('INSERT INTO suppliers (name, nit, phone, address, email) VALUES ($1, $2, $3, $4, $5)',
        [s.name, s.nit, s.phone, s.address, s.email]);
    }
  }

  const products = [
    { code: 'PROD001', name: 'Mouse Inalámbrico', description: 'Mouse óptico ergonómico', price_buy: 15000, price_sell: 25000, stock: 50, min_stock: 10, category_id: 1 },
    { code: 'PROD002', name: 'Teclado Mecánico', description: 'Teclado RGB switch blue', price_buy: 35000, price_sell: 60000, stock: 20, min_stock: 5, category_id: 1 },
    { code: 'PROD003', name: 'Cuaderno Profesional', description: '100 hojas cuadriculado', price_buy: 2500, price_sell: 4500, stock: 100, min_stock: 20, category_id: 2 },
    { code: 'PROD004', name: 'Monitor 24" IPS', description: 'Monitor Full HD 75Hz', price_buy: 120000, price_sell: 480000, stock: 10, min_stock: 3, category_id: 1 },
    { code: 'PROD005', name: 'Resma Papel Bond', description: '500 hojas tamaño carta', price_buy: 12000, price_sell: 18000, stock: 40, min_stock: 10, category_id: 2 },
    { code: 'PROD006', name: 'Detergente Líquido', description: 'Galón 3.7L fragancia limón', price_buy: 8000, price_sell: 14500, stock: 25, min_stock: 5, category_id: 3 },
    { code: 'PROD007', name: 'Chorizo Henjur', description: 'Paquete x 5 unidades', price_buy: 10000, price_sell: 16000, stock: 30, min_stock: 5, category_id: 3 },
    { code: 'PROD008', name: 'Carne de Res Premium', description: 'Corte fino 1kg', price_buy: 18000, price_sell: 28000, stock: 15, min_stock: 5, category_id: 3 },
    { code: 'PROD009', name: 'Pollo Entero', description: 'Pollo fresco 2kg aprox', price_buy: 12000, price_sell: 22000, stock: 20, min_stock: 5, category_id: 3 },
    { code: 'PROD010', name: 'Costilla de Cerdo', description: 'Costilla carnuda 1kg', price_buy: 14000, price_sell: 24000, stock: 25, min_stock: 5, category_id: 3 },
    { code: 'PROD011', name: 'Lomo de Cerdo', description: 'Lomo limpio 1kg', price_buy: 16000, price_sell: 26000, stock: 18, min_stock: 5, category_id: 3 },
    { code: 'PROD012', name: 'Pechuga de Pollo', description: 'Pechuga sin piel 1kg', price_buy: 9000, price_sell: 15500, stock: 30, min_stock: 10, category_id: 3 }
  ];

  for (const p of products) {
    const exists = await db.get('SELECT id FROM products WHERE code = $1', [p.code]);
    if (!exists) {
      await db.run(`INSERT INTO products (code, name, description, price_buy, price_sell, stock, min_stock, category_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [p.code, p.name, p.description, p.price_buy, p.price_sell, p.stock, p.min_stock, p.category_id]);
    } else {
      // Update prices for existing items if they are too low (meaning they were seeded with dollar values)
      await db.run('UPDATE products SET price_buy = ?, price_sell = ? WHERE code = ? AND price_sell < 1000', [p.price_buy, p.price_sell, p.code]);
    }
  }

  const defaultSettings = [
    { key: 'business_name', value: 'Henry SAS' },
    { key: 'nit', value: '901.234.567-8' },
    { key: 'currency', value: 'COP' },
    { key: 'currency_locale', value: 'es-CO' },
    { key: 'address', value: 'Calle 123 #45-67, Bogotá' },
    { key: 'phone', value: '300 123 4567' },
    { key: 'low_stock_alert', value: '5' },
    { key: 'daily_summary_email', value: 'admin@henrysas.com' }
  ];

  for (const s of defaultSettings) {
    const exists = await db.get('SELECT key FROM settings WHERE key = $1', [s.key]);
    if (!exists) {
      await db.run('INSERT INTO settings (key, value) VALUES ($1, $2)', [s.key, s.value]);
    }
  }

  console.log('Datos iniciales verificados y actualizados.');
};
