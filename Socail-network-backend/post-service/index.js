import app from './app.js';
import { connectKafka } from './config/kafka.js';
import { initDB } from './config/db.js';

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  // 1. Connect to infrastructure first
  await initDB();
  await connectKafka();
  
  // 2. Start taking HTTP requests
  app.listen(PORT, () => {
    console.log(`🚀 Post Service running on http://localhost:${PORT}`);
  });
};

startServer();