const fetch = require('node-fetch');
const { Kafka } = require('kafkajs');
const logger = require('./logger');
const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();

async function sendWeather() {
  await producer.connect();
  setInterval(async () => {
    try {
      const res = await fetch('https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=London');
      const data = await res.json();
      await producer.send({
        topic: 'weather-topic',
        messages: [{ value: JSON.stringify(data) }],
      });
      logger.info(`Sent weather data: ${JSON.stringify(data)}`);
    } catch (err) {
      logger.error(`Error sending weather data: ${err}`);
    }
  }, 10000);
}

sendWeather();
module.exports = sendWeather;