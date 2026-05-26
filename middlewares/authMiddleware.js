const jwt = require('jsonwebtoken');
const Student = require('../modal/student');

const isLoggedIn = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: "Please login first" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await Student.findById(decoded.userid).select('-password');
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Add user info to request
        req.user = decoded;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired" });
        }
        return res.status(500).json({ error: "Authentication error" });
    }
};

module.exports = { isLoggedIn };