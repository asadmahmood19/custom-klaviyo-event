# Custom Klaviyo Event from Picqer (Vercel)

## Overview
This app receives Picqer fulfillment webhooks, waits 20 minutes, fetches all parcels (T&T codes and URLs) for the order, and sends a custom event to Klaviyo with all T&T codes and URLs. Built for Vercel using Upstash Redis for reliable delayed job handling.

## Setup

### 1. Environment Variables
Create a `.env` file (or set these in Vercel dashboard):

```
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
PICQER_API_KEY=your_picqer_api_key
PICQER_API_URL=https://your-picqer-domain/api/v1
KLAVIYO_API_KEY=your_klaviyo_private_api_key
```

### 2. Deploy to Vercel
- Push this project to GitHub.
- Import the repo in Vercel.
- Set the environment variables in Vercel dashboard.
- Deploy!

### 3. Configure Picqer Webhook
- Set the webhook URL in Picqer to `https://your-vercel-domain/api/webhook`.
- The webhook should send `order_id` and `customer_email` in the JSON body.

### 4. Schedule Processing
- Set up a Vercel cron job (or external scheduler) to call `https://your-vercel-domain/api/processOrder` every few minutes.

## How it Works
- On fulfillment, Picqer calls `/api/webhook`.
- The order is stored in Redis with a 20-minute delay.
- The cron job calls `/api/processOrder`, which checks for due orders, fetches all parcels, and sends a custom event to Klaviyo.

## Notes
- This setup supports multiple T&T codes per order.
- Make sure your Picqer API user has permission to fetch orders and parcels.
- Klaviyo event: `all_tracking_codes_sent` with all codes and URLs. 