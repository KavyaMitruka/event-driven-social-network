import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { Pool } = pg;

// 🚨 THIS IS WHAT WAS MISSING: The actual database connection!
export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// The automated table creator
export const initDB = async () => {
  try {
    // 1. Create Posts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        author_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Patch existing posts table
    await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);`);

    // 3. Create Likes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        PRIMARY KEY (post_id, username)
      );
    `);

    // 4. Create Comments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ PostgreSQL connected and ALL tables are ready!');
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL or create tables:', error);
    process.exit(1);
  }
};