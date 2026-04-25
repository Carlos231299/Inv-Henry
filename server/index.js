import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, initDB } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Middlewares
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Generic CRUD Factory
const createCRUDRoutes = (tableName, routeName) => {
  app.get(`/api/${routeName}`, authenticateToken, async (req, res) => {
    try {
      const items = await db.all(`SELECT * FROM ${tableName}`);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: `Error al obtener ${routeName}` });
    }
  });

  app.delete(`/api/${routeName}/:id`, authenticateToken, async (req, res) => {
    try {
      await db.run(`DELETE FROM ${tableName} WHERE id = ?`, req.params.id);
      res.json({ message: 'Eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ message: `Error al eliminar ${routeName}` });
    }
  });
};

createCRUDRoutes('categories', 'categories');
createCRUDRoutes('suppliers', 'suppliers');
createCRUDRoutes('customers', 'customers');

// Suppliers POST/PUT
app.post('/api/suppliers', authenticateToken, async (req, res) => {
  const { name, nit, phone, address, email } = req.body;
  try {
    const result = await db.run(`
      INSERT INTO suppliers (name, nit, phone, address, email)
      VALUES (?, ?, ?, ?, ?)
    `, [name, nit, phone, address, email]);
    res.json({ id: result.lastID, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
});

app.put('/api/suppliers/:id', authenticateToken, async (req, res) => {
  const { name, nit, phone, address, email } = req.body;
  try {
    await db.run(`
      UPDATE suppliers SET name = ?, nit = ?, phone = ?, address = ?, email = ?
      WHERE id = ?
    `, [name, nit, phone, address, email, req.params.id]);
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar proveedor' });
  }
});

// Customers POST/PUT
app.post('/api/customers', authenticateToken, async (req, res) => {
  const { name, document, phone, address, email } = req.body;
  try {
    const result = await db.run(`
      INSERT INTO customers (name, document, phone, address, email)
      VALUES (?, ?, ?, ?, ?)
    `, [name, document, phone, address, email]);
    res.json({ id: result.lastID, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear cliente' });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  const { name, document, phone, address, email } = req.body;
  try {
    await db.run(`
      UPDATE customers SET name = ?, document = ?, phone = ?, address = ?, email = ?
      WHERE id = ?
    `, [name, document, phone, address, email, req.params.id]);
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
});

// Products PUT
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const { code, name, description, price_buy, price_sell, stock, min_stock, category_id } = req.body;
  try {
    await db.run(`
      UPDATE products SET code = ?, name = ?, description = ?, price_buy = ?, price_sell = ?, stock = ?, min_stock = ?, category_id = ?
      WHERE id = ?
    `, [code, name, description, price_buy, price_sell, stock, min_stock, category_id, req.params.id]);
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await db.all(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  const { code, name, description, price_buy, price_sell, stock, min_stock, category_id } = req.body;
  try {
    const result = await db.run(`
      INSERT INTO products (code, name, description, price_buy, price_sell, stock, min_stock, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, name, description, price_buy, price_sell, stock, min_stock, category_id]);
    res.json({ id: result.lastID, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
    res.json({ id: result.lastID, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear categoría' });
  }
});

// Sales
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const sales = await db.all(`
      SELECT s.*, c.name as customer_name, u.name as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.date DESC
    `);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
  const { items, total, payment_method, customer_id } = req.body;
  const user_id = req.user.id;

  try {
    const saleResult = await db.run(`
      INSERT INTO sales (user_id, customer_id, total, payment_method)
      VALUES (?, ?, ?, ?)
    `, [user_id, customer_id || null, total, payment_method]);

    const saleId = saleResult.lastID;

    for (const item of items) {
      await db.run(`
        INSERT INTO sale_items (sale_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [saleId, item.id, item.quantity, item.price_sell]);
      
      await db.run(`
        UPDATE products SET stock = stock - ? WHERE id = ?
      `, [item.quantity, item.id]);
    }

    res.json({ id: saleId, message: 'Venta registrada con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar la venta' });
  }
});

// Purchases
app.get('/api/purchases', authenticateToken, async (req, res) => {
  try {
    const purchases = await db.all(`
      SELECT p.*, s.name as supplier_name, u.name as user_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.date DESC
    `);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener compras' });
  }
});

app.post('/api/purchases', authenticateToken, async (req, res) => {
  const { items, total, supplier_id } = req.body;
  const user_id = req.user.id;

  try {
    const purchaseResult = await db.run(`
      INSERT INTO purchases (user_id, supplier_id, total)
      VALUES (?, ?, ?)
    `, [user_id, supplier_id, total]);

    const purchaseId = purchaseResult.lastID;

    for (const item of items) {
      await db.run(`
        INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [purchaseId, item.id, item.quantity, item.price_buy]);
      
      await db.run(`
        UPDATE products SET stock = stock + ? WHERE id = ?
      `, [item.quantity, item.id]);
    }

    res.json({ id: purchaseId, message: 'Compra registrada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la compra' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'Henry SAS API is running', database: 'connected' });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor de Henry SAS corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
});
