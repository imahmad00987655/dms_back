import { verifyToken } from '../utils/authUtils.js';
import { executeQuery } from '../config/database.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = verifyToken(token);
    
    // Check if user still exists and is active
    const users = await executeQuery(
      'SELECT id, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    req.user = {
      id: users[0].id,
      userId: users[0].id, // Add this for compatibility
      email: users[0].email,
      role: users[0].role
    };

    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Middleware to check if user has required role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Middleware to check if user is verified
export const requireVerification = async (req, res, next) => {
  try {
    const users = await executeQuery(
      'SELECT is_verified FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0 || !users[0].is_verified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Email verification required' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      
      const users = await executeQuery(
        'SELECT id, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
        [decoded.userId]
      );

      if (users.length > 0) {
        req.user = {
          id: users[0].id,
          email: users[0].email,
          role: users[0].role
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting middleware
export const rateLimit = (windowMs, maxRequests) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many requests, please try again later' 
      });
    }

    userRequests.push(now);
    next();
  };
}; 