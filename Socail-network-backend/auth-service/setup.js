import { pool } from './config/db.js';

const createUsersTable = async () => {
    try {
        console.log("⏳ Knocking on the database door...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Users table created successfully!");
    } catch (error) {
        console.error("❌ Error creating table:", error);
    } finally {
        pool.end(); // Closes the connection so the script finishes
    }
};

createUsersTable();