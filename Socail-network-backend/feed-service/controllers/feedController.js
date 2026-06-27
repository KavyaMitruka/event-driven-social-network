import { redis } from '../config/redis.js';
import { pool } from '../config/db.js'; 

export const getFeed = async (req, res) => {
    const loggedInUser = req.headers['x-user-name']; 

    if (!loggedInUser) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        // 1. Get the lightning-fast snapshot feed from Redis
        const feed = await redis.lrange(`feed:${loggedInUser}`, 0, -1);
        const parsedFeed = feed.map(post => JSON.parse(post));
        
        if (parsedFeed.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 2. Extract all the Post IDs currently in the feed
        const postIds = parsedFeed.map(post => post.postId || post.id);

        // 3. HYDRATION: Query Postgres to get the live engagement counts for these specific posts
       // 3. HYDRATION: Added a check to see if the CURRENT user liked the post
        const countsQuery = `
            SELECT 
                p.id,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
                EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.username = $2) as has_liked
            FROM posts p
            WHERE p.id = ANY($1::int[]);
        `;
        // 🚨 IMPORTANT: Notice we are passing loggedInUser as the $2 parameter now!
        const result = await pool.query(countsQuery, [postIds, loggedInUser]); 

        const liveCounts = {};
        result.rows.forEach(row => {
            liveCounts[row.id] = {
                likes: parseInt(row.likes_count) || 0,
                comments: parseInt(row.comments_count) || 0,
                hasLiked: row.has_liked // 🚨 NEW: Save the true/false boolean
            };
        });

        const hydratedFeed = parsedFeed.map(post => {
            const id = post.postId || post.id;
            return {
                ...post,
                likes_count: liveCounts[id]?.likes || 0,
                comments_count: liveCounts[id]?.comments || 0,
                has_liked: liveCounts[id]?.hasLiked || false // 🚨 NEW: Attach to the post!
            };
        });
        
        // 6. Send the perfectly hydrated feed to the frontend!
        res.status(200).json({ success: true, data: hydratedFeed });

    } catch (error) {
        console.error("Error fetching feed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ... keep your updateFeedCache function exactly as it is below this! ...
// Logic for when Kafka receives a message
export const updateFeedCache = async (postData) => {
    // Check if your Kafka event uses authorId or author_id
    const authorId = postData.author_id || postData.authorId; 
    const postString = JSON.stringify(postData);

    try {
        // 1. Save to the author's own feed (Your original logic)
        await redis.lpush(`feed:${authorId}`, postString);
        await redis.ltrim(`feed:${authorId}`, 0, 19); 
        console.log(`✅ Author feed updated: ${authorId}`);

        // 2. 🚨 THE FAN-OUT: Get all followers from PostgreSQL
        const result = await pool.query(
            'SELECT follower_username FROM followers WHERE following_username = $1',
            [authorId]
        );
        const followers = result.rows;

        // 3. Loop through every follower and push the post to their feed!
        for (const row of followers) {
            const follower = row.follower_username;
            
            await redis.lpush(`feed:${follower}`, postString);
            await redis.ltrim(`feed:${follower}`, 0, 19); // Keep their feed tidy too
            
            console.log(`🚀 Fan-Out: Pushed post to follower -> ${follower}`);
        }

    } catch (error) {
        console.error("❌ Error processing fan-out:", error);
    }
};