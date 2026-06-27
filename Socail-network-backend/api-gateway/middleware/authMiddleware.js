import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access Denied: Please Login First' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.headers['x-user-id'] = verified.id;
        req.headers['x-user-name'] = verified.username;
        
        next();
    } catch (error) {
        res.status(403).json({ success: false, message: 'Invalid or Expired ID Card' });
    }
};