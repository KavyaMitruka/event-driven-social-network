import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { verifyToken } from './middleware/authMiddleware.js'; 
import cors from 'cors';


dotenv.config();
const app = express();
app.use(cors()); 

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3003';
const POST_SERVICE_URL = process.env.POST_SERVICE_URL || 'http://localhost:3001';
const FEED_SERVICE_URL = process.env.FEED_SERVICE_URL || 'http://localhost:3002';

// 1. Auth Service (Public & No Stripping)
app.use('/api/auth/follow', verifyToken);
app.use('/api/auth/search', verifyToken);
app.use(createProxyMiddleware({
    pathFilter: '/api/auth',
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
}));

// 2. Post Service (Protected & No Stripping)
// We apply the bouncer to the path, then let the proxy handle the delivery
app.use('/api/posts', verifyToken); 
app.use(createProxyMiddleware({
    pathFilter: '/api/posts',
    target: POST_SERVICE_URL,
    changeOrigin: true,
}));

app.use(createProxyMiddleware({
    pathFilter: '/uploads',
    target: POST_SERVICE_URL,
    changeOrigin: true,
}));

// 3. Feed Service (Protected & No Stripping)
app.use('/api/feed', verifyToken);
app.use(createProxyMiddleware({
    pathFilter: '/api/feed',
    target: FEED_SERVICE_URL,
    changeOrigin: true,
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 API Gateway is live on http://localhost:${PORT}`);
});