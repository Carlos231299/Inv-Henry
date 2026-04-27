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

app.get('/api/products/:id/price-history', authenticateToken, async (req, res) => {
  try {
    const history = await db.all(`
      SELECT 
        p.date,
        s.name as supplier_name,
        pi.price,
        pi.quantity
      FROM purchase_items pi
      JOIN purchases p ON pi.purchase_id = p.id
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE pi.product_id = ?
      ORDER BY p.date DESC
    `, req.params.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de precios' });
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

app.get('/api/sales/:id', authenticateToken, async (req, res) => {
  try {
    const sale = await db.get(`
      SELECT s.*, c.name as customer_name, u.name as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, req.params.id);

    if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });

    const items = await db.all(`
      SELECT si.*, p.name
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, req.params.id);

    res.json({ ...sale, items });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener detalles de la venta' });
  }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
  const { items, total, payment_method, customer_id, cash_received, change_given, invoice_number } = req.body;
  const user_id = req.user.id;

  try {
    const saleResult = await db.run(`
      INSERT INTO sales (user_id, customer_id, total, payment_method, cash_received, change_given, invoice_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [user_id, customer_id || null, total, payment_method, cash_received, change_given, invoice_number]);

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

app.get('/api/purchases/:id', authenticateToken, async (req, res) => {
  try {
    const purchase = await db.get(`
      SELECT p.*, s.name as supplier_name, u.name as user_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, req.params.id);

    if (!purchase) return res.status(404).json({ message: 'Compra no encontrada' });

    const items = await db.all(`
      SELECT pi.*, pr.name
      FROM purchase_items pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.purchase_id = ?
    `, req.params.id);

    res.json({ ...purchase, items });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener detalles de la compra' });
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
      // Get current product state for weighted average calculation
      const currentProduct = await db.get('SELECT stock, price_buy FROM products WHERE id = ?', [item.id]);
      
      const currentStock = currentProduct.stock || 0;
      const currentCost = currentProduct.price_buy || 0;
      const newQty = item.quantity;
      const newPrice = item.unit_cost; // Using unit_cost from frontend

      // Calculate Weighted Average Cost (Costo Promedio Ponderado)
      // Formula: ((Stock Actual * Costo Actual) + (Cantidad Nueva * Precio Nuevo)) / (Stock Actual + Cantidad Nueva)
      const totalStock = currentStock + newQty;
      const weightedAverageCost = totalStock > 0 
        ? ((currentStock * currentCost) + (newQty * newPrice)) / totalStock
        : newPrice;

      await db.run(`
        INSERT INTO purchase_items (purchase_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [purchaseId, item.id, newQty, newPrice]);
      
      await db.run(`
        UPDATE products 
        SET stock = stock + ?, 
            price_buy = ? 
        WHERE id = ?
      `, [newQty, weightedAverageCost, item.id]);
    }

    res.json({ id: purchaseId, message: 'Compra registrada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la compra' });
  }
});

// Reports
// Reports
app.get('/api/reports/stats', authenticateToken, async (req, res) => {
  const { range = 'month', startDate, endDate } = req.query;
  
  const getFilter = (colName = 'date') => {
    if (range === 'day') {
      return `date(${colName}) = date('now')`;
    } else if (range === 'week') {
      return `${colName} >= date('now', '-6 days')`;
    } else if (range === 'month') {
      return `${colName} >= date('now', 'start of month')`;
    } else if (range === 'custom' && startDate && endDate) {
      return `date(${colName}) BETWEEN '${startDate}' AND '${endDate}'`;
    }
    return '1=1';
  };

  const selectPeriod = range === 'all' 
    ? "strftime('%Y-%m', date)" 
    : "date(date)";

  try {
    const dateFilter = getFilter('date');
    const joinedFilter = getFilter('s.date');

    const stats = await db.get(`
      SELECT SUM(total) as totalRevenue, COUNT(*) as totalSales 
      FROM sales WHERE ${dateFilter}
    `);

    const profitData = await db.get(`
      SELECT SUM((si.price - p.price_buy) * si.quantity) as totalProfit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE ${joinedFilter}
    `);

    const salesByPeriodRaw = await db.all(`
      SELECT ${selectPeriod} as period, SUM(total) as value
      FROM sales WHERE ${dateFilter}
      GROUP BY period ORDER BY period ASC
    `);

    const topProducts = await db.all(`
      SELECT p.name, SUM(si.quantity) as sales
      FROM sale_items si JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE ${joinedFilter} GROUP BY p.id ORDER BY sales DESC LIMIT 5
    `);

    res.json({
      totalRevenue: stats.totalRevenue || 0,
      totalProfit: profitData.totalProfit || 0,
      totalSales: stats.totalSales || 0,
      salesByPeriod: salesByPeriodRaw,
      topProducts
    });
  } catch (error) {
    console.error('Error en reportes:', error);
    res.status(500).json({ message: 'Error al generar estadísticas' });
  }
});

app.post('/api/purchases/:id/void', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('BEGIN TRANSACTION');

    const purchase = await db.get('SELECT status FROM purchases WHERE id = ?', [id]);
    if (!purchase) {
      await db.run('ROLLBACK');
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    if (purchase.status === 'voided') {
      await db.run('ROLLBACK');
      return res.status(400).json({ message: 'Esta compra ya ha sido anulada' });
    }

    const items = await db.all('SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?', [id]);

    // Validation: Check if we have enough stock to revert
    for (const item of items) {
      const product = await db.get('SELECT name, stock FROM products WHERE id = ?', [item.product_id]);
      if (product.stock < item.quantity) {
        await db.run('ROLLBACK');
        return res.status(400).json({ 
          message: `No se puede anular: El stock actual de "${product.name}" (${product.stock}) es menor a la cantidad que intentas restar (${item.quantity}).` 
        });
      }
    }

    // Revert stock
    for (const item of items) {
      await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    // Update status
    await db.run("UPDATE purchases SET status = 'voided' WHERE id = ?", [id]);

    await db.run('COMMIT');
    res.json({ message: 'Compra anulada con éxito' });
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(500).json({ message: 'Error al anular la compra' });
  }
});

app.get('/api/reports/inventory', authenticateToken, async (req, res) => {
  try {
    const inventory = await db.all(`
      SELECT 
        p.id,
        p.name,
        p.code,
        p.stock,
        p.min_stock,
        p.price_buy,
        p.price_sell,
        c.name as category_name,
        (p.stock * p.price_buy) as total_investment,
        (p.stock * p.price_sell) as potential_revenue,
        (p.stock * (p.price_sell - p.price_buy)) as potential_profit
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.stock ASC
    `);

    res.json(inventory);
  } catch (error) {
    console.error('Error en reporte de inventario:', error);
    res.status(500).json({ message: 'Error al generar reporte de inventario' });
  }
});

app.get('/api/reports/detailed', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateFilter = "1=1";
  if (startDate && endDate) {
    dateFilter = `date(s.date) BETWEEN '${startDate}' AND '${endDate}'`;
  }

  try {
    const detailedSales = await db.all(`
      SELECT 
        s.id as sale_id,
        s.date,
        s.total,
        s.payment_method,
        si.quantity,
        si.price as sold_price,
        p.name as product_name,
        p.price_buy as buying_price,
        (si.price - p.price_buy) * si.quantity as profit,
        c.name as customer_name
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE ${dateFilter}
      ORDER BY s.date DESC
    `);

    res.json(detailedSales);
  } catch (error) {
    console.error('Error en reporte detallado:', error);
    res.status(500).json({ message: 'Error al generar reporte detallado' });
  }
});

// Settings Routes
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.all('SELECT * FROM settings');
    const settingsMap = {};
    settings.forEach(s => settingsMap[s.key] = s.value);
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener configuraciones' });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  const settings = req.body;
  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value.toString()]);
    }
    res.json({ message: 'Configuraciones actualizadas' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar configuraciones' });
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
