import express from 'express';
import feedRoutes from './routes/feedRoutes.js';

const app = express();

// Middleware: Allows your app to understand JSON sent in requests
app.use(express.json());

// Routes: Any request starting with /api/feed goes to feedRoutes
app.use('/api/feed', feedRoutes);

// Health Check: A standard way to see if the service is "alive"
app.get('/health', (req, res) => {
    res.status(200).send('Feed Service is healthy');
});

export default app;