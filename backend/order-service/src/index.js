const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:5002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005';

app.use(cors());
app.use(express.json());

// In-Memory Orders Store with Initial Seed Data
const inMemoryOrders = [
  {
    id: 'ord_1001',
    userId: 'usr_customer_01',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@example.com',
    items: [
      {
        productId: 'prod_01',
        name: 'Aether Studio Pro Noise-Canceling Headphones',
        price: 349.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
      }
    ],
    shippingAddress: {
      street: '742 Evergreen Terrace',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94107',
      country: 'USA'
    },
    totals: {
      subtotal: 349.99,
      tax: 28.00,
      shipping: 0.00,
      total: 377.99
    },
    paymentStatus: 'PAID',
    orderStatus: 'DELIVERED',
    paymentMethod: 'Credit Card (**** 4242)',
    transactionId: 'txn_mock_994821',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'ord_1002',
    userId: 'usr_customer_01',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@example.com',
    items: [
      {
        productId: 'prod_03',
        name: 'NeuralKey Pro Custom Mechanical Keyboard',
        price: 189.50,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'
      },
      {
        productId: 'prod_05',
        name: 'Titanium Flux MagSafe Power Bank 20000mAh',
        price: 89.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1609592424074-b52b57b9c3f1?auto=format&fit=crop&w=800&q=80'
      }
    ],
    shippingAddress: {
      street: '742 Evergreen Terrace',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94107',
      country: 'USA'
    },
    totals: {
      subtotal: 279.49,
      tax: 22.36,
      shipping: 0.00,
      total: 301.85
    },
    paymentStatus: 'PAID',
    orderStatus: 'PROCESSING',
    paymentMethod: 'Apple Pay',
    transactionId: 'txn_mock_881923',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

// Request Logger
app.use((req, res, next) => {
  console.log(`[ORDER SERVICE] ${req.method} ${req.originalUrl}`);
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    service: 'ShopiTry Order Management Service',
    status: 'HEALTHY',
    totalOrders: inMemoryOrders.length,
    timestamp: new Date().toISOString()
  });
});

// GET All Orders (Admin gets all, Customer gets theirs)
app.get('/api/orders', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  let result = [...inMemoryOrders];

  if (userRole !== 'admin') {
    result = result.filter(o => o.userId === userId || o.customerEmail === req.headers['x-user-email']);
  }

  // Sort by newest first
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    status: 'success',
    count: result.length,
    data: result
  });
});

// GET Order by ID
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = inMemoryOrders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  res.json({ status: 'success', data: order });
});

// POST Process Checkout & Create Order
app.post('/api/orders/checkout', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'usr_guest_01';
    const userEmail = req.headers['x-user-email'] || req.body.customerEmail || 'guest@aethercart.io';
    const userName = req.headers['x-user-name'] || req.body.customerName || 'Valued Customer';

    const { items, shippingAddress, paymentMethod = 'Credit Card' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Checkout requires at least one item.' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ error: 'Valid shipping address is required.' });
    }

    // 1. Calculate Totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 150 ? 0 : 15.00;
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));

    const orderId = `ord_${Date.now().toString().slice(-6)}`;

    // 2. Invoke Payment Microservice (AWS Lambda primitive)
    let transactionId = `txn_sim_${Date.now()}`;
    let paymentSuccess = true;

    try {
      console.log(`[ORDER SERVICE] Calling Payment Service at ${PAYMENT_SERVICE_URL}/api/payments/process`);
      const paymentRes = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/process`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: total,
          currency: 'USD',
          paymentMethod
        })
      });

      if (paymentRes.ok) {
        const payData = await paymentRes.json();
        transactionId = payData.transactionId || transactionId;
      }
    } catch (payErr) {
      console.warn(`[ORDER SERVICE] Payment Service call warning: ${payErr.message}. Proceeding with fallback approval.`);
    }

    // 3. Assemble New Order Object
    const newOrder = {
      id: orderId,
      userId,
      customerName: userName,
      customerEmail: userEmail,
      items,
      shippingAddress,
      totals: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        total
      },
      paymentStatus: paymentSuccess ? 'PAID' : 'PENDING',
      orderStatus: 'PROCESSING',
      paymentMethod,
      transactionId,
      createdAt: new Date().toISOString()
    };

    inMemoryOrders.unshift(newOrder);

    // 4. Trigger Notification Service (AWS Lambda primitive)
    try {
      console.log(`[ORDER SERVICE] Triggering Notification Service at ${NOTIFICATION_SERVICE_URL}/api/notifications/send`);
      fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'ORDER_CONFIRMATION',
          recipientEmail: userEmail,
          recipientName: userName,
          orderId: newOrder.id,
          totalAmount: newOrder.totals.total
        })
      }).catch(err => console.warn('Notification async trigger non-blocking error:', err.message));
    } catch (notifErr) {
      console.warn(`[ORDER SERVICE] Notification Service trigger skipped: ${notifErr.message}`);
    }

    // 5. Clear Customer Cart Service Session
    try {
      fetch(`${CART_SERVICE_URL}/api/cart`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      }).catch(() => {});
    } catch (cartErr) {
      // Non-critical
    }

    res.status(201).json({
      status: 'success',
      message: 'Order created and processed successfully!',
      data: newOrder
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process order checkout', details: error.message });
  }
});

// PUT Update Order Status (Admin pipeline control)
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus } = req.body;

  const orderIndex = inMemoryOrders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (orderStatus) inMemoryOrders[orderIndex].orderStatus = orderStatus;
  if (paymentStatus) inMemoryOrders[orderIndex].paymentStatus = paymentStatus;
  inMemoryOrders[orderIndex].updatedAt = new Date().toISOString();

  // Send status update notification
  try {
    fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'ORDER_STATUS_UPDATE',
        recipientEmail: inMemoryOrders[orderIndex].customerEmail,
        recipientName: inMemoryOrders[orderIndex].customerName,
        orderId: id,
        newStatus: orderStatus
      })
    }).catch(() => {});
  } catch (e) {}

  res.json({
    status: 'success',
    message: `Order ${id} status updated to ${orderStatus || paymentStatus}`,
    data: inMemoryOrders[orderIndex]
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`📦 AETHERCART ORDER SERVICE RUNNING ON PORT ${PORT}`);
  console.log(`=======================================================`);
});
