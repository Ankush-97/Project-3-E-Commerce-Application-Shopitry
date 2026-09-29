const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'shopitry_super_secret_jwt_key_2026';

// Service routes configuration
const SERVICES = {
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:5001',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:5002',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:5003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005',
};

// In-memory User Database for Gateway Auth Engine
const users = [
  {
    id: 'usr_admin_01',
    name: 'ShopiTry Platform Admin',
    email: 'admin@shopitry.com',
    password: 'adminpassword123',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_customer_01',
    name: 'Elena Rostova',
    email: 'elena@example.com',
    password: 'customerpassword123',
    role: 'customer',
    createdAt: new Date().toISOString()
  }
];

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { status: 'error', message: 'Too many requests from this IP, please try again later.' }
});

app.use(cors());
app.use(limiter);
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[GATEWAY] ${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'ShopiTry API Gateway',
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    downstreamServices: SERVICES
  });
});

// Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'customer',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Authentication successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// Authentication verification helper
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Generic Reverse Proxy Dispatcher
const proxyRequest = async (targetServiceUrl, targetPath, req, res) => {
  const user = verifyToken(req);

  const url = `${targetServiceUrl}${targetPath}`;
  console.log(`[PROXY] Forwarding ${req.method} -> ${url}`);

  const headers = { ...req.headers };
  delete headers.host;
  delete headers['content-length'];

  if (user) {
    headers['x-user-id'] = user.id;
    headers['x-user-email'] = user.email;
    headers['x-user-role'] = user.role;
    headers['x-user-name'] = user.name;
  }

  try {
    const options = {
      method: req.method,
      headers: headers
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
    }

    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');

    res.status(response.status);
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (error) {
    console.error(`[PROXY ERROR] Failed to forward to ${url}:`, error.message);
    res.status(503).json({
      error: 'Downstream Service Unavailable',
      message: `Failed to connect to service at ${targetServiceUrl}`,
      details: error.message
    });
  }
};

// Route mapping to microservices (stripping prefix or forwarding clean path)
app.use('/api/catalog', (req, res) => proxyRequest(SERVICES.catalog, req.url, req, res));
app.use('/api/cart', (req, res) => proxyRequest(SERVICES.cart, req.url, req, res));
app.use('/api/orders', (req, res) => proxyRequest(SERVICES.order, req.url, req, res));
app.use('/api/payments', (req, res) => proxyRequest(SERVICES.payment, req.url, req, res));
app.use('/api/notifications', (req, res) => proxyRequest(SERVICES.notification, req.url, req, res));

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SHOPITRY API GATEWAY RUNNING ON PORT ${PORT}`);
  console.log(`🔗 Catalog Service:      ${SERVICES.catalog}`);
  console.log(`🔗 Cart Service:         ${SERVICES.cart}`);
  console.log(`🔗 Order Service:        ${SERVICES.order}`);
  console.log(`🔗 Payment Service:      ${SERVICES.payment}`);
  console.log(`🔗 Notification Service: ${SERVICES.notification}`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
  } else {
    console.error('Server error:', err);
  }
});
