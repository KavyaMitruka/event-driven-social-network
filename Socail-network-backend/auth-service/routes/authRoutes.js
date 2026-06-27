import express from 'express';
import { login, register, follow, searchUsers, getProfileStats } from '../controllers/authController.js'; // Adjust path if needed

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/follow', follow);
router.get('/search', searchUsers);
router.get('/stats/:username', getProfileStats);

export default router;