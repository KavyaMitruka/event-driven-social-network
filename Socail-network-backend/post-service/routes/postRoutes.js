import express from 'express';
import multer from 'multer'; 
import path from 'path';     
import { createPost, getPost, deletePost, toggleLike , addComment, getComments} from '../controllers/postController.js';

const router = express.Router();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Saves files into an 'uploads' folder inside your post-service
  },
  filename: function (req, file, cb) {
    // Gives the file a unique name (e.g., 16987654321.jpg)
    cb(null, Date.now() + path.extname(file.originalname)) 
  }
});
const upload = multer({ storage: storage });

// Creates a post (🚨 NEW: Added upload.single('image') middleware)
router.post('/', upload.single('image'), createPost);

// Fetches a specific post 
router.get('/:id', getPost);

// Deletes a specific post
router.delete('/:id', deletePost);
router.post('/:id/like', toggleLike);
router.post('/:id/comment', addComment); 
router.get('/:id/comments', getComments); 

export default router;