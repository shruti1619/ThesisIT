const jwt = require('jsonwebtoken');
const Student = require('../modal/student'); // Adjust path as needed
const Admin = require('../modal/admin'); // Adjust path if you have admin roles
const Group = require('../modal/group'); // Import the Group model

const ensureAuthenticated = (req, res, next) => {
    const token = req.cookies.token; // Get token from cookie

    if (!token) {
        // If using flash messages:
        // req.flash('error_msg', 'Please log in to view this resource');
        // return res.redirect('/student/signin'); // Or appropriate login page

        // If responding with JSON:
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add decoded payload (e.g., { username, studentId }) to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        // If using flash messages:
        // req.flash('error_msg', 'Invalid or expired token. Please log in again.');
        // res.clearCookie('token'); // Clear the invalid token cookie
        // return res.redirect('/student/signin');

        // If responding with JSON:
        res.clearCookie('token');
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
// Assuming this file already has ensureAuthenticated

// Middleware to check if the authenticated user is a Project Guide
const isProjectGuide = (req, res, next) => {
    // First, ensure the user is authenticated (req.user should be populated by ensureAuthenticated)
    if (!req.user) {
        req.flash('error_msg', 'Please log in to view this resource.');
        return res.redirect('/guide/signin'); // Redirect to guide login page
    }

    // Check if the user's role is 'guide' (adjust 'role' property if needed based on your JWT payload/session)
    if (req.user.role === 'guide') {
        // User is authenticated and is a guide, proceed to the next middleware/route handler
        next();
    } else {
        // User is authenticated but not a guide
        req.flash('error_msg', 'You do not have permission to access this page.');
        // Redirect to a general dashboard or login page, or send a 403 Forbidden status
        // res.status(403).send('Forbidden: Access denied.');
        res.redirect('/'); // Or perhaps a student/admin dashboard if applicable
    }
};
// Middleware to check if the authenticated user is specifically a Student
const isStudent = async (req, res, next) => {
    // ensureAuthenticated should run before this, so req.user should exist
    if (!req.user || !req.user.studentId) {
        // This case might indicate a non-student JWT or an issue with ensureAuthenticated
        return res.status(403).json({ error: 'Access denied. Student role required.' });
    }

    try {
        // Optionally, you can fetch the student from DB to ensure they still exist
        const student = await Student.findById(req.user.studentId);
        if (!student) {
            res.clearCookie('token');
            return res.status(403).json({ error: 'Student profile not found.' });
        }
        req.user.role = 'student'; // Explicitly set role if needed elsewhere
        next();
    } catch (error) {
        console.error("Error in isStudent middleware:", error);
        return res.status(500).json({ error: 'Error verifying user role.' });
    }
};

// Middleware to check if the authenticated student is the leader of their group
const isGroupLeader = async (req, res, next) => {
    if (!req.user || !req.user.studentId) {
        return res.status(403).json({ error: 'Access denied. Student role required.' });
    }

    try {
        const student = await Student.findById(req.user.studentId).populate('groupId');
        if (!student || !student.groupId) {
            return res.status(403).json({ error: 'You are not part of a group.' });
        }

        // Ensure the group has a leader and check if the student is the leader
        if (!student.groupId.leader || !student.groupId.leader.equals(student._id)) {
            return res.status(403).json({ error: 'Access denied. Group leader role required.' });
        }

        // Attach the group to the request object for later use
        req.group = student.groupId;
        next();
    } catch (error) {
        console.error("Error in isGroupLeader middleware:", error);
        return res.status(500).json({ error: 'Error verifying group leader role.' });
    }
};


// Example middleware for other roles (if needed)
const isAdmin = (req, res, next) => {
    if (req.user && req.user.adminId) { // Check for adminId in JWT payload
        req.user.role = 'admin';
        return next();
    }
    // req.flash('error_msg', 'Access denied. Admin role required.');
    // return res.redirect('/');
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
};

module.exports = {
    ensureAuthenticated,
    isStudent,
    isAdmin,
    isGroupLeader,
    isProjectGuide // Export the new middleware
    // Export other role checks like isGuide if you create them
};