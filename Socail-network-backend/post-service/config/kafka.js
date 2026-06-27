import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'post-service',
  brokers: ['localhost:9092'] 
});

export const producer = kafka.producer();

export const connectKafka = async () => {
  try {
    await producer.connect();
    console.log('✅ Post Service connected to Kafka successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Kafka', error);
    process.exit(1); // Stop the app if Kafka fails
  }
};