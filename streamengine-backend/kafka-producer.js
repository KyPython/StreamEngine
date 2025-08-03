const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();
const logger = require('./logger');

async function sendMockData() {
  await producer.connect();
  setInterval(async () => {
    const value = `Sensor reading: ${Math.random()}`;
    await producer.send({
      topic: 'test-topic',
      messages: [{ value }],
    });
    logger.info(`Sent: ${value}`);
  }, 2000); // every 2 seconds
}

sendMockData();
module.exports = sendMockData;