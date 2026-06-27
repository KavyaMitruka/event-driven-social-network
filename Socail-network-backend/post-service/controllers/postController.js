import { producer } from '../config/kafka.js';
import { pool } from '../config/db.js'; 
import { Mutex } from 'async-mutex'; // 🚨 IMPORT ADDED HERE

// 🚨 INITIALIZE THE MUTEX LOCK HERE
const uploadMutex = new Mutex();

// Create a post and save it to PostgreSQL
export const createPost = async (req, res) => {
  const { content } = req.body;
  const authorId = req.headers['x-user-name'];
  
  if (!authorId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing user identity' });
  }

  // Grab the image filename from Multer (if an image was uploaded)
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // 🚨 1. ACQUIRE THE MUTEX LOCK (Thread waits here if another upload is happening)
  const release = await uploadMutex.acquire();

  try {
    // 2. Save to PostgreSQL
    const insertQuery = `
      INSERT INTO posts (author_id, content, image_url) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    const dbResult = await pool.query(insertQuery, [authorId, content, image_url]);
    const savedPost = dbResult.rows[0];

    // 3. Send the event to Kafka using the real database ID
    await producer.send({
      topic: 'post_created',
      messages: [
        { 
          value: JSON.stringify({ 
            postId: savedPost.id, 
            authorId: savedPost.author_id, 
            content: savedPost.content,
            image_url: savedPost.image_url, 
            timestamp: savedPost.created_at
          }) 
        },
      ],
    });

    res.status(201).json({ 
      success: true, 
      message: 'Post saved safely via Mutex and published to Kafka!',
      data: savedPost
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    // 🚨 4. CRITICAL: RELEASE THE MUTEX LOCK 
    // This runs no matter what, ensuring the server never permanently freezes.
    release();
  }
};

// Fetch a single post from PostgreSQL
export const getPost = async (req, res) => {
  const postId = req.params.id;

  try {
    const selectQuery = 'SELECT * FROM posts WHERE id = $1';
    const dbResult = await pool.query(selectQuery, [postId]);

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({
      success: true,
      data: dbResult.rows[0]
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Delete a post from PostgreSQL
export const deletePost = async (req, res) => {
  const postId = req.params.id;

  try {
    // 1. Delete from PostgreSQL
    const deleteQuery = 'DELETE FROM posts WHERE id = $1 RETURNING id';
    const dbResult = await pool.query(deleteQuery, [postId]);

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // 2. Broadcast the delete event to Kafka
    await producer.send({
      topic: 'post_deleted',
      messages: [
        { 
          value: JSON.stringify({ postId: postId }) 
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: `Post ${postId} permanently deleted from DB and Kafka notified!`
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Toggle a Like on a Post
export const toggleLike = async (req, res) => {
  const postId = req.params.id;
  const username = req.headers['x-user-name'];

  if (!username) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    // 1. Check if the user already liked this post
    const checkQuery = 'SELECT * FROM likes WHERE post_id = $1 AND username = $2';
    const checkResult = await pool.query(checkQuery, [postId, username]);

    if (checkResult.rows.length > 0) {
      // 2. If it exists, DELETE it (Unlike)
      await pool.query('DELETE FROM likes WHERE post_id = $1 AND username = $2', [postId, username]);
      return res.status(200).json({ success: true, action: 'unliked' });
    } else {
      // 3. If it doesn't exist, INSERT it (Like)
      await pool.query('INSERT INTO likes (post_id, username) VALUES ($1, $2)', [postId, username]);
      return res.status(200).json({ success: true, action: 'liked' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Add a new comment
export const addComment = async (req, res) => {
  const postId = req.params.id;
  const username = req.headers['x-user-name'];
  const { content } = req.body;

  if (!username || !content.trim()) return res.status(400).json({ success: false, message: 'Invalid data' });

  try {
    const insertQuery = `
      INSERT INTO comments (post_id, username, content) 
      VALUES ($1, $2, $3) RETURNING *;
    `;
    const result = await pool.query(insertQuery, [postId, username, content]);
    
    res.status(201).json({ success: true, comment: result.rows[0] });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Fetch all comments for a specific post
export const getComments = async (req, res) => {
  const postId = req.params.id;

  try {
    // Fetch comments and order them from oldest to newest
    const result = await pool.query('SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC', [postId]);
    res.status(200).json({ success: true, comments: result.rows });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};