const request = require('supertest');
const app = require('./index');

describe('Express API', () => {
  it('GET / should return API running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/StreamEngine API running/);
  });

  it('GET /messages should return an array', async () => {
    const res = await request(app).get('/messages');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /messages should use Redis cache if available', async () => {
    // Set a fake cache value
    const redis = require('redis');
    const redisClient = redis.createClient();
    await redisClient.connect();
    await redisClient.set('messages', JSON.stringify([{ value: 'cached', timestamp: new Date() }]), { EX: 30 });

    const res = await request(app).get('/messages');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].value).toBe('cached');
    await redisClient.quit();
  });
});