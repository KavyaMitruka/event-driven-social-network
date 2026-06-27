import express from 'express';
import postRoutes from './routes/postRoutes.js';

const app = express();

// Middleware
app.use(express.json());

// Mount Routes
app.use('/api/posts', postRoutes);
app.use('/uploads', express.static('uploads'));

export default app;