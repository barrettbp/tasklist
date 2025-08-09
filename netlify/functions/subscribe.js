// Netlify function to handle push subscription
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the subscription data from the request body
    const subscription = JSON.parse(event.body);
    
    // Validate subscription data
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid subscription data' })
      };
    }

    // In a real app, you'd store this subscription in a database
    // For now, we'll just log it and return success
    console.log('Push subscription received:', {
      endpoint: subscription.endpoint,
      keys: subscription.keys
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Subscription saved' })
    };
  } catch (error) {
    console.error('Error processing subscription:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};