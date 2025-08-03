console.log('Backend starting...');

const redis = require('redis');
const express = require('express');
const app = express();
const logger = require('./logger');
const statusMonitor = require('express-status-monitor');


app.use(express.json());
app.use(statusMonitor());
app.get('/', (req, res) => res.send('StreamEngine API running'));

const http = require('http');
const WebSocket = require('ws');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/streamengine');
const redis = require('redis');
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get('/messages', async (req, res) => {
  const start = Date.now();
  logger.info('GET /messages called');
  try {
    // Try cache first
    const cached = await redisClient.get('messages');
    if (cached) {
      logger.info('Serving /messages from Redis cache');
      logger.info(`GET /messages completed in ${Date.now() - start}ms`);
      return res.json(JSON.parse(cached));
    }
    // If not cached, fetch from DB
    const messages = await Message.find().sort({ timestamp: -1 }).limit(100);
    await redisClient.set('messages', JSON.stringify(messages), { EX: 30 }); // cache for 30 seconds
    logger.info(`GET /messages completed in ${Date.now() - start}ms`);
    res.json(messages);
  } catch (err) {
    logger.error(`Error in /messages: ${err}`);
    logger.info(`GET /messages failed in ${Date.now() - start}ms`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function broadcast(data) {
  logger.info(`Broadcasting message: ${JSON.stringify(data)}`);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', () => {
  logger.info('WebSocket client connected');
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

module.exports = app;
module.exports.broadcast = broadcast;

// REMOVE this line if present:
// server.listen(4000, () => logger.info('Backend on port 4000'));

if (require.main === module) {
  // Send a test message to all WebSocket clients every 3 seconds
  setInterval(() => {
    broadcast({
      value: `Test message: ${Math.random()}`,
      timestamp: new Date().toISOString()
    });
  }, 3000);

  server.listen(4000, () => {
    logger.info('Server listening on port 4000');
  });
}