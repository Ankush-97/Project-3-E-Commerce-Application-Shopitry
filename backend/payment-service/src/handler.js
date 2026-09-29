/**
 * AWS Lambda Event Handler - AetherCart Payment Microservice
 * Triggered by AWS API Gateway or SQS Payment Events
 */
exports.handler = async (event, context) => {
  console.log('[AWS LAMBDA - PAYMENT] Event received:', JSON.stringify(event));

  try {
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      body = event;
    }

    const { orderId, amount, currency = 'USD', paymentMethod = 'Credit Card' } = body;

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Valid payment amount is required.' })
      };
    }

    // Simulate payment transaction processing
    const transactionId = `txn_aws_lambda_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const authorizationCode = `auth_${Math.floor(100000 + Math.random() * 900000)}`;

    const responsePayload = {
      status: 'APPROVED',
      orderId: orderId || `ord_${Date.now()}`,
      amount: parseFloat(amount),
      currency,
      paymentMethod,
      transactionId,
      authorizationCode,
      gateway: 'ShopiTry Lambda Payment Engine v2.4',
      processedAt: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(responsePayload)
    };
  } catch (error) {
    console.error('[AWS LAMBDA - PAYMENT ERROR]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Payment processing failed', details: error.message })
    };
  }
};
