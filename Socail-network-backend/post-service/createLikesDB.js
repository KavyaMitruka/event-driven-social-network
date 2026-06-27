import { pool } from './config/db.js';

const setupEngagements = async () => {
    try {
        console.log("Connecting to database...");
        
        // 1. Create Likes Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS likes (
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                username VARCHAR(255) NOT NULL,
                PRIMARY KEY (post_id, username)
            );
        `);

        // 2. Create Comments Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                username VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log("✅ Success! Both 'likes' and 'comments' tables are ready.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating tables:", error);
        process.exit(1);
    }
};

setupEngagements();