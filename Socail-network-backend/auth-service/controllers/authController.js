import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export const register = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Hash the password (never save plain text!)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Save user to database
        const newUser = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );

        res.status(201).json({ success: true, user: newUser.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error or username exists' });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Find the user
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // 2. Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // 3. Generate the JWT "Ticket"
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.status(200).json({ success: true, token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const follow = async (req, res) => {
    try {
        // 1. Get who is clicking "Follow" (from the Gateway header)
        const follower_username = req.headers['x-user-name']; 
        
        // 2. Get who they want to follow (from the JSON body)
        const { following_username } = req.body;

        if (!follower_username || !following_username) {
            return res.status(400).json({ success: false, message: "Missing users" });
        }

        if (follower_username === following_username) {
            return res.status(400).json({ success: false, message: "You cannot follow yourself" });
        }

        // 3. Save the relationship in the new table
        await pool.query(
            `INSERT INTO followers (follower_username, following_username) 
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [follower_username, following_username]
        );

        res.status(200).json({ 
            success: true, 
            message: `${follower_username} is now following ${following_username}` 
        });

    } catch (error) {
        console.error('Follow Error:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
export const searchUsers = async (req, res) => {
    const { q } = req.query; // Get the search term from URL like ?q=km

    try {
        if (!q) return res.json({ success: true, users: [] });

        // ILIKE makes it case-insensitive. % is a wildcard.
        const results = await pool.query(
            'SELECT username FROM users WHERE username ILIKE $1 AND username != $2 LIMIT 10',
            [`%${q}%`, req.headers['x-user-name']] // Don't show the current user in results
        );

        res.json({ success: true, users: results.rows });
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ success: false, message: 'Server error during search' });
    }
};
// Add this at the bottom of authController.js
export const getProfileStats = async (req, res) => {
    const { username } = req.params;

    try {
        // 1. Get people who follow this user
        const followersResult = await pool.query(
            'SELECT follower_username FROM followers WHERE following_username = $1',
            [username]
        );
        
        // 2. Get people this user is following
        const followingResult = await pool.query(
            'SELECT following_username FROM followers WHERE follower_username = $1',
            [username]
        );

        res.status(200).json({
            success: true,
            followers: followersResult.rows.map(row => row.follower_username),
            following: followingResult.rows.map(row => row.following_username)
        });

    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching stats' });
    }
};