const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { order_id, customer_email } = req.body;
  if (!order_id || !customer_email) {
    res.status(400).json({ error: 'Missing order_id or customer_email' });
    return;
  }

  // Store order info in Redis with a 20-minute delay
  const processAt = Date.now() + 20 * 60 * 1000;
  await redis.zadd('pending_orders', { score: processAt, member: JSON.stringify({ order_id, customer_email }) });

  res.status(200).json({ success: true });
}; 