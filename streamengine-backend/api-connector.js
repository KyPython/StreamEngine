const fetch = require('node-fetch');
const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();

async function fetchAndSend() {
  await producer.connect();
  setInterval(async () => {
    // Fetch messages from your backend API
    const res = await fetch('http://localhost:4000/messages');
    const data = await res.json();
    await producer.send({
      topic: 'test-topic',
      messages: [{ value: JSON.stringify(data) }],
    });
    console.log('Sent API data:', data);
  }, 5000); // every 5 seconds
}

fetchAndSend();