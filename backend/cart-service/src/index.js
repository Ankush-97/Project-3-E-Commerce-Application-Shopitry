const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// In-Memory Storage for Carts (Keyed by userId or guest sessionId)
const inMemoryCarts = new Map();

// Helper to calculate totals
const computeCartTotals = (items) => {
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% estimated tax
  const shipping = subtotal > 150 ? 0 : 15.00; // Free shipping over $150
  const total = subtotal + tax + shipping;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shipping: parseFloat(shipping.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    itemCount: items.reduce((acc, item) => acc + item.quantity, 0)
  };
};

// Request Logger
app.use((req, res, next) => {
  console.log(`[CART SERVICE] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'ShopiTry Cart & Session Service',
    status: 'HEALTHY',
    activeCartSessions: inMemoryCarts.size,
    timestamp: new Date().toISOString()
  });
});

// Get Cart Session helper
const getSessionId = (req) => {
  return req.headers['x-user-id'] || req.headers['x-session-id'] || req.query.sessionId || 'guest_default_session';
};

// GET Cart
app.get('/api/cart', (req, res) => {
  const sessionId = getSessionId(req);
  let cart = inMemoryCarts.get(sessionId) || { sessionId, items: [], updatedAt: new Date().toISOString() };

  const totals = computeCartTotals(cart.items);

  res.json({
    status: 'success',
    data: {
      sessionId: cart.sessionId,
      items: cart.items,
      totals,
      updatedAt: cart.updatedAt
    }
  });
});

// POST Add Item to Cart
app.post('/api/cart/items', (req, res) => {
  const sessionId = getSessionId(req);
  const { productId, name, price, image, quantity = 1, spec } = req.body;

  if (!productId || !name || price === undefined) {
    return res.status(400).json({ error: 'productId, name, and price are required.' });
  }

  let cart = inMemoryCarts.get(sessionId) || { sessionId, items: [], updatedAt: new Date().toISOString() };

  const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += parseInt(quantity, 10);
  } else {
    cart.items.push({
      productId,
      name,
      price: parseFloat(price),
      image: image || '',
      quantity: parseInt(quantity, 10),
      spec: spec || null
    });
  }

  cart.updatedAt = new Date().toISOString();
  inMemoryCarts.set(sessionId, cart);

  const totals = computeCartTotals(cart.items);

  res.status(201).json({
    status: 'success',
    message: 'Item added to cart',
    data: {
      sessionId: cart.sessionId,
      items: cart.items,
      totals,
      updatedAt: cart.updatedAt
    }
  });
});

// PUT Update Item Quantity
app.put('/api/cart/items/:productId', (req, res) => {
  const sessionId = getSessionId(req);
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: 'Valid quantity is required.' });
  }

  let cart = inMemoryCarts.get(sessionId);
  if (!cart) {
    return res.status(404).json({ error: 'Cart session not found.' });
  }

  if (parseInt(quantity, 10) === 0) {
    cart.items = cart.items.filter(item => item.productId !== productId);
  } else {
    const item = cart.items.find(item => item.productId === productId);
    if (item) {
      item.quantity = parseInt(quantity, 10);
    } else {
      return res.status(404).json({ error: 'Item not found in cart.' });
    }
  }

  cart.updatedAt = new Date().toISOString();
  inMemoryCarts.set(sessionId, cart);

  const totals = computeCartTotals(cart.items);

  res.json({
    status: 'success',
    message: 'Cart updated',
    data: {
      sessionId: cart.sessionId,
      items: cart.items,
      totals,
      updatedAt: cart.updatedAt
    }
  });
});

// DELETE Item from Cart
app.delete('/api/cart/items/:productId', (req, res) => {
  const sessionId = getSessionId(req);
  const { productId } = req.params;

  let cart = inMemoryCarts.get(sessionId);
  if (!cart) {
    return res.status(404).json({ error: 'Cart session not found.' });
  }

  cart.items = cart.items.filter(item => item.productId !== productId);
  cart.updatedAt = new Date().toISOString();
  inMemoryCarts.set(sessionId, cart);

  const totals = computeCartTotals(cart.items);

  res.json({
    status: 'success',
    message: 'Item removed from cart',
    data: {
      sessionId: cart.sessionId,
      items: cart.items,
      totals,
      updatedAt: cart.updatedAt
    }
  });
});

// DELETE Clear Entire Cart
app.delete('/api/cart', (req, res) => {
  const sessionId = getSessionId(req);
  inMemoryCarts.set(sessionId, { sessionId, items: [], updatedAt: new Date().toISOString() });

  res.json({
    status: 'success',
    message: 'Cart cleared successfully',
    data: {
      sessionId,
      items: [],
      totals: computeCartTotals([]),
      updatedAt: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛒 AETHERCART CART SERVICE RUNNING ON PORT ${PORT}`);
  console.log(`=======================================================`);
});
