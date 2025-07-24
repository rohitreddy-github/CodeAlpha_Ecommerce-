const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-here';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data files
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize data files
const initializeDataFiles = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    const initialProducts = [
      {
        id: '1',
        name: 'Laptop',
        price: 999.99,
        description: 'High-performance laptop for work and gaming',
        image: '/images/laptop.jpg',
        stock: 10
      },
      {
        id: '2',
        name: 'Smartphone',
        price: 699.99,
        description: 'Latest smartphone with advanced features',
        image: '/images/phone.jpg',
        stock: 15
      },
      {
        id: '3',
        name: 'Headphones',
        price: 199.99,
        description: 'Wireless noise-canceling headphones',
        image: '/images/headphones.jpg',
        stock: 20
      }
    ];
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(initialProducts));
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
  }
};

// Helper functions
const readFile = (filename) => {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (error) {
    return [];
  }
};

const writeFile = (filename, data) => {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const users = readFile(USERS_FILE);

    // Check if user already exists
    if (users.find(user => user.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeFile(USERS_FILE, users);

    // Generate token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readFile(USERS_FILE);

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all products
app.get('/api/products', (req, res) => {
  const products = readFile(PRODUCTS_FILE);
  res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const products = readFile(PRODUCTS_FILE);
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

// Create order
app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    const { items, total } = req.body;
    const orders = readFile(ORDERS_FILE);
    const products = readFile(PRODUCTS_FILE);

    // Verify stock and calculate total
    let calculatedTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product?.name || 'product'}` });
      }
      
      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;
      
      orderItems.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });

      // Update stock
      product.stock -= item.quantity;
    }

    // Create order
    const newOrder = {
      id: uuidv4(),
      userId: req.user.id,
      items: orderItems,
      total: calculatedTotal,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    writeFile(ORDERS_FILE, orders);
    writeFile(PRODUCTS_FILE, products);

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user orders
app.get('/api/orders', authenticateToken, (req, res) => {
  const orders = readFile(ORDERS_FILE);
  const userOrders = orders.filter(order => order.userId === req.user.id);
  res.json(userOrders);
});

// Initialize data and start server
initializeDataFiles();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});