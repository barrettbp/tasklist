// Netlify function to serve VAPID public key
exports.handler = async () => {
  // Get VAPID public key from environment variables
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  
  if (!vapidPublic) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'VAPID public key not configured' })
    };
  }

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify({ publicKey: vapidPublic })
  };
};