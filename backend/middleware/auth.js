const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  const token = req.cookies?.crm_token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('tokenVersion role');
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    if (decoded.tv !== undefined && decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ success: false, error: 'Session expired, please log in again' });
    }
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expired, please log in again' });
    }
    return res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
}

module.exports = requireAuth;
