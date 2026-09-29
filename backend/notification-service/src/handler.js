/**
 * AWS Lambda Event Handler - AetherCart Notification Microservice
 * Triggered by SNS / SES / EventBridge / HTTP API Gateway
 */
exports.handler = async (event, context) => {
  console.log('[AWS LAMBDA - NOTIFICATION] Event received:', JSON.stringify(event));

  try {
    let body = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      body = event;
    }

    const { type = 'ORDER_CONFIRMATION', recipientEmail, recipientName, orderId, totalAmount, newStatus } = body;

    let subject = '';
    let message = '';

    if (type === 'ORDER_CONFIRMATION') {
      subject = `[ShopiTry] Order Confirmation #${orderId}`;
      message = `Hello ${recipientName || 'Customer'},\n\nThank you for your order #${orderId} totaling $${totalAmount}! Your order is currently being processed.`;
    } else if (type === 'ORDER_STATUS_UPDATE') {
      subject = `[ShopiTry] Status Update for Order #${orderId}`;
      message = `Hello ${recipientName || 'Customer'},\n\nYour order #${orderId} has been updated to status: ${newStatus}.`;
    } else {
      subject = `[ShopiTry] Notification Alert`;
      message = `Generic notification for ${recipientEmail}.`;
    }

    console.log(`✉️ [SIMULATED EMAIL DISPATCH] To: ${recipientEmail} | Subject: "${subject}"`);
    console.log(`Content:\n${message}\n---`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'DISPATCHED',
        notificationId: `notif_${Date.now()}`,
        recipientEmail,
        type,
        subject,
        sentAt: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('[AWS LAMBDA - NOTIFICATION ERROR]', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Notification dispatch failed', details: error.message })
    };
  }
};
