const express = require('express');
const cors = require('cors');
const { handler } = require('./handler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[NOTIFICATION LAMBDA LOCAL] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'ShopiTry Notification Service (AWS Lambda)',
    status: 'HEALTHY',
    runtime: 'Node.js 20.x Lambda Environment',
    timestamp: new Date().toISOString()
  });
});

// Adapter routing to Lambda handler
app.post('/api/notifications/send', async (req, res) => {
  const lambdaEvent = {
    body: req.body,
    headers: req.headers,
    httpMethod: 'POST',
    path: '/api/notifications/send'
  };

  const lambdaResult = await handler(lambdaEvent, {});
  res.status(lambdaResult.statusCode).json(JSON.parse(lambdaResult.body));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🔔 AETHERCART NOTIFICATION SERVICE (LAMBDA 2) ON PORT ${PORT}`);
  console.log(`=======================================================`);
});
