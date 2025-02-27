// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Please log in to continue' });
    }
    next();
};

module.exports = requireAuth; 