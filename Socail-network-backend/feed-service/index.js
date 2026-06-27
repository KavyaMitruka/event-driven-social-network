import app from './app.js';
import dotenv from 'dotenv';
import { connectKafka } from './config/kafka.js';
import { updateFeedCache } from './controllers/feedController.js';

dotenv.config();

const PORT = process.env.PORT || 3002;

const startServer = async () => {
    try {
        // 1. Establish the Network Connections first
        // We pass the controller logic (updateFeedCache) to the listener
        await connectKafka(updateFeedCache);
        console.log('🔗 Kafka Consumer integrated with Controller');

        // 2. Once networking is ready, start listening for HTTP traffic
        app.listen(PORT, () => {
            console.log(`🚀 Feed Service running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start Feed Service:', error);
        process.exit(1); // Stop the process if we can't connect to infrastructure
    }
};

startServer();