const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
const kafka = new Kafka({ brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'test-group' });
const producer = kafka.producer(); // For Dead Letter Queue (DLQ)
const logger = require('./logger');

const Message = require('./models/Message');

// Batch writing setup
let batch = [];
const BATCH_SIZE = 20;
const BATCH_INTERVAL = 2000; // 2 seconds

// Batch flush function
async function flushBatch(reason = 'interval') {
  if (batch.length > 0) {
    try {
      await Message.insertMany(batch);
      logger.info(`Batch wrote ${batch.length} messages (${reason})`);
      batch = [];
    } catch (err) {
      logger.error(`Batch write error: ${err}`);
      // Optionally send failed batch to DLQ
      for (const msg of batch) {
        await producer.send({
          topic: 'dead-letter-topic',
          messages: [{ value: JSON.stringify(msg) }],
        });
        logger.warn(`Sent batch message to dead-letter-topic: ${JSON.stringify(msg)}`);
      }
      batch = [];
    }
  }
}

// Flush batch on interval
setInterval(() => flushBatch('interval'), BATCH_INTERVAL);

async function run() {
  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        let value = message.value.toString();
        value = value.toUpperCase();

        batch.push({ value, timestamp: new Date() });

        // Flush immediately if batch size is reached
        if (batch.length >= BATCH_SIZE) {
          await flushBatch('size');
        }

        // Optionally broadcast immediately (or after batch write)
        const { broadcast } = require('./index');
        broadcast({ value, timestamp: new Date() });
      } catch (err) {
        logger.error(`Error processing message: ${err}`);

        // Send failed message to dead letter queue
        await producer.send({
          topic: 'dead-letter-topic',
          messages: [{ value: message.value.toString() }],
        });
        logger.warn(`Sent message to dead-letter-topic: ${message.value.toString()}`);
      }
    },
  });
}

run().catch(err => logger.error(`Kafka consumer failed to start: ${err}`));