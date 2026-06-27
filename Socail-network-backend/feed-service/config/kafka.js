import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'feed-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

export const consumer = kafka.consumer({ groupId: 'feed-group' });

export const connectKafka = async (onMessageReceived) => {
  try {
    await consumer.connect();
    console.log('✅ Feed Service connected to Kafka');

    // Subscribe to the same topic the Post Service is shouting into
    await consumer.subscribe({ topic: 'post_created', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const rawValue = message.value.toString();
        const postData = JSON.parse(rawValue);
        
        // Pass the data to our callback function (which will save it to Redis)
        await onMessageReceived(postData);
      },
    });
  } catch (error) {
    console.error('❌ Kafka Consumer Error:', error);
  }
};