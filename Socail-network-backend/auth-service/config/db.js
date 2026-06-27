import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

export const initDB = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    const createFollowersTableQuery = `
       CREATE TABLE IF NOT EXISTS followers (
                follower_username VARCHAR(255) REFERENCES users(username) ON DELETE CASCADE,
                following_username VARCHAR(255) REFERENCES users(username) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (follower_username, following_username)
            );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('✅ "users" table is ready in PostgreSQL');
        await pool.query(createFollowersTableQuery);
        console.log('✅ "followers" table is ready in PostgreSQL');
    } catch (error) {
        console.error('❌ Error creating users or followers table:', error);
    }


};

pool.on('connect', () => {
    console.log('✅ Auth Service connected to PostgreSQL');
});