const { Redis } = require('@upstash/redis');
const fetch = require('node-fetch');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const PICQER_API_KEY = process.env.PICQER_API_KEY;
const PICQER_API_URL = process.env.PICQER_API_URL;
const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;

async function fetchParcels(order_id) {
  const response = await fetch(`${PICQER_API_URL}/orders/${order_id}/parcels`, {
    headers: { 'Authorization': `Bearer ${PICQER_API_KEY}` },
  });
  if (!response.ok) throw new Error('Failed to fetch parcels');
  return response.json();
}

async function sendKlaviyoEvent(email, order_id, parcels) {
  const tracking_codes = parcels.map(p => ({
    code: p.tracking_code,
    url: p.tracking_url,
  }));
  await fetch('https://a.klaviyo.com/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: KLAVIYO_API_KEY,
      event: 'all_tracking_codes_sent',
      customer_properties: { email },
      properties: { order_id, tracking_codes },
    }),
  });
}

module.exports = async (req, res) => {
  // Find all orders due for processing
  const now = Date.now();
  let dueOrders = [];
  try {
    dueOrders = await redis.zrangebyscore('pending_orders', 0, now);
  } catch (err) {
    console.error('Redis zrangebyscore error:', err);
    res.status(500).json({ error: 'Redis zrangebyscore error', details: err.message });
    return;
  }
  for (const orderStr of dueOrders) {
    const { order_id, customer_email } = JSON.parse(orderStr);
    try {
      const parcels = await fetchParcels(order_id);
      await sendKlaviyoEvent(customer_email, order_id, parcels);
    } catch (e) {
      // Optionally log error
    }
    await redis.zrem('pending_orders', orderStr);
  }
  res.status(200).json({ processed: dueOrders.length });
}; 