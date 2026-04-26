import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const dbPath = process.env.DB_PATH || './inventory.db';

export let db;

export const initDB = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.get('PRAGMA foreign_keys = ON');

  // Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'vendedor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  // Products Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price_buy REAL DEFAULT 0,
      price_sell REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      category_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // Suppliers Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      customer_id INTEGER,
      total REAL NOT NULL,
      payment_method TEXT DEFAULT 'efectivo',
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    )
  `);

  // Sale Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  // Purchases Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      supplier_id INTEGER,
      total REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    )
  `);

  // Purchase Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
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
  const admin = await db.get('SELECT * FROM users WHERE username = ?', 'admin');
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await db.run('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      'admin',
      hashedPassword,
      'Administrador Principal',
      'admin'
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
    const exists = await db.get('SELECT id FROM categories WHERE name = ?', cat.name);
    if (!exists) {
      await db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [cat.name, cat.description]);
    }
  }

  const suppliers = [
    { name: 'Tech Distribuciones', nit: '900123456-1', phone: '3001234567', address: 'Calle 10 #20-30', email: 'ventas@tech.com' },
    { name: 'Papeles del Sur', nit: '800654321-2', phone: '3109876543', address: 'Av. Sur 45-12', email: 'info@papelessur.com' }
  ];

  for (const s of suppliers) {
    const exists = await db.get('SELECT id FROM suppliers WHERE nit = ?', s.nit);
    if (!exists) {
      await db.run('INSERT INTO suppliers (name, nit, phone, address, email) VALUES (?, ?, ?, ?, ?)', 
        [s.name, s.nit, s.phone, s.address, s.email]);
    }
  }

  const products = [
    { code: 'PROD001', name: 'Mouse Inalámbrico', description: 'Mouse óptico ergonómico', price_buy: 15.00, price_sell: 25.00, stock: 50, min_stock: 10, category_id: 1 },
    { code: 'PROD002', name: 'Teclado Mecánico', description: 'Teclado RGB switch blue', price_buy: 35.00, price_sell: 60.00, stock: 20, min_stock: 5, category_id: 1 },
    { code: 'PROD003', name: 'Cuaderno Profesional', description: '100 hojas cuadriculado', price_buy: 2.50, price_sell: 4.00, stock: 100, min_stock: 20, category_id: 2 },
    { code: 'PROD004', name: 'Monitor 24" IPS', description: 'Monitor Full HD 75Hz', price_buy: 120.00, price_sell: 180.00, stock: 10, min_stock: 3, category_id: 1 },
    { code: 'PROD005', name: 'Resma Papel Bond', description: '500 hojas tamaño carta', price_buy: 12.00, price_sell: 18.00, stock: 40, min_stock: 10, category_id: 2 },
    { code: 'PROD006', name: 'Detergente Líquido', description: 'Galón 3.7L fragancia limón', price_buy: 8.00, price_sell: 14.50, stock: 25, min_stock: 5, category_id: 3 },
    { code: 'PROD007', name: 'Chorizo Henjur', description: 'Paquete x 5 unidades', price_buy: 10.00, price_sell: 16.00, stock: 30, min_stock: 5, category_id: 3 },
    { code: 'PROD008', name: 'Carne de Res Premium', description: 'Corte fino 1kg', price_buy: 18.00, price_sell: 28.00, stock: 15, min_stock: 5, category_id: 3 },
    { code: 'PROD009', name: 'Pollo Entero', description: 'Pollo fresco 2kg aprox', price_buy: 12.00, price_sell: 22.00, stock: 20, min_stock: 5, category_id: 3 },
    { code: 'PROD010', name: 'Costilla de Cerdo', description: 'Costilla carnuda 1kg', price_buy: 14.00, price_sell: 24.00, stock: 25, min_stock: 5, category_id: 3 },
    { code: 'PROD011', name: 'Lomo de Cerdo', description: 'Lomo limpio 1kg', price_buy: 16.00, price_sell: 26.00, stock: 18, min_stock: 5, category_id: 3 },
    { code: 'PROD012', name: 'Pechuga de Pollo', description: 'Pechuga sin piel 1kg', price_buy: 9.00, price_sell: 15.50, stock: 30, min_stock: 10, category_id: 3 }
  ];

  for (const p of products) {
    const exists = await db.get('SELECT id FROM products WHERE code = ?', p.code);
    if (!exists) {
      await db.run(`INSERT INTO products (code, name, description, price_buy, price_sell, stock, min_stock, category_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [p.code, p.name, p.description, p.price_buy, p.price_sell, p.stock, p.min_stock, p.category_id]);
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
    const exists = await db.get('SELECT key FROM settings WHERE key = ?', s.key);
    if (!exists) {
      await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [s.key, s.value]);
    }
  }

  console.log('Datos iniciales verificados y actualizados.');
};
