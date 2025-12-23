import express from 'express';
import { body, validationResult } from 'express-validator';
import { executeQuery } from '../config/database.js';
import { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  generateOTP, 
  generateResetToken,
  hashToken,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  createAuditLog
} from '../utils/authUtils.js';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/emailService.js';
import { authenticateToken, rateLimit } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting
const loginRateLimit = rateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
const signupRateLimit = rateLimit(60 * 60 * 1000, 3); // 3 attempts per hour
const otpRateLimit = rateLimit(5 * 60 * 1000, 3); // 3 attempts per 5 minutes

// Login route
router.post('/login', 
  loginRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 1 }).withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const sanitizedEmail = sanitizeInput(email);

      // Check if user exists
      const users = await executeQuery(
        'SELECT id, email, password_hash, role, is_active, is_verified, first_name, last_name FROM users WHERE email = ?',
        [sanitizedEmail]
      );

      if (users.length === 0) {
        await createAuditLog(executeQuery, null, 'LOGIN_FAILED', `Failed login attempt for email: ${sanitizedEmail}`, req.ip, req.get('User-Agent'));
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = users[0];

      if (!user.is_active) {
        await createAuditLog(executeQuery, user.id, 'LOGIN_FAILED', 'Account is deactivated', req.ip, req.get('User-Agent'));
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        await createAuditLog(executeQuery, user.id, 'LOGIN_FAILED', 'Invalid password', req.ip, req.get('User-Agent'));
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate token
      const token = generateToken(user.id, user.email, user.role);

      // Store session
      await executeQuery(
        'INSERT INTO user_sessions (user_id, token_hash, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
        [user.id, hashToken(token), req.get('User-Agent'), req.ip]
      );

      // Create audit log
      await createAuditLog(executeQuery, user.id, 'LOGIN_SUCCESS', 'User logged in successfully', req.ip, req.get('User-Agent'));

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            isVerified: user.is_verified
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Signup route
router.post('/signup',
  signupRateLimit,
  [
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('company').trim().isLength({ min: 1 }).withMessage('Company name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { firstName, lastName, email, company, password } = req.body;
      
      // Sanitize inputs
      const sanitizedData = {
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        email: sanitizeInput(email),
        company: sanitizeInput(company)
      };

      // Validate email format
      if (!isValidEmail(sanitizedData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
      }

      // Check if email already exists
      const existingUsers = await executeQuery(
        'SELECT id FROM users WHERE email = ?',
        [sanitizedData.email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await executeQuery(
        'INSERT INTO users (first_name, last_name, email, password_hash, company) VALUES (?, ?, ?, ?, ?)',
        [sanitizedData.firstName, sanitizedData.lastName, sanitizedData.email, passwordHash, sanitizedData.company]
      );

      const userId = result.insertId;

      // Generate and send OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await executeQuery(
        'INSERT INTO otps (email, otp_code, type, expires_at) VALUES (?, ?, ?, ?)',
        [sanitizedData.email, otp, 'email_verification', expiresAt]
      );

      // Send OTP email
      await sendOTPEmail(sanitizedData.email, otp, 'email_verification');

      // Create audit log
      await createAuditLog(executeQuery, userId, 'SIGNUP_SUCCESS', 'User registered successfully', req.ip, req.get('User-Agent'));

      res.json({
        success: true,
        message: 'Registration successful. Please check your email for verification code.'
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Verify OTP route
router.post('/verify-otp',
  otpRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, otp } = req.body;
      const sanitizedEmail = sanitizeInput(email);

      // Find valid OTP
      const otps = await executeQuery(
        'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND type = ? AND expires_at > NOW() AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [sanitizedEmail, otp, 'email_verification']
      );

      if (otps.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Mark OTP as used
      await executeQuery(
        'UPDATE otps SET is_used = TRUE WHERE id = ?',
        [otps[0].id]
      );

      // Verify user email
      await executeQuery(
        'UPDATE users SET is_verified = TRUE WHERE email = ?',
        [sanitizedEmail]
      );

      // Get user details
      const users = await executeQuery(
        'SELECT id, first_name, email, role FROM users WHERE email = ?',
        [sanitizedEmail]
      );

      if (users.length > 0) {
        // Send welcome email
        await sendWelcomeEmail(sanitizedEmail, users[0].first_name);

        // Create audit log
        await createAuditLog(executeQuery, users[0].id, 'EMAIL_VERIFIED', 'Email verified successfully', req.ip, req.get('User-Agent'));
      }

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Forgot password route
router.post('/forgot-password',
  otpRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const sanitizedEmail = sanitizeInput(email);

      // Check if user exists
      const users = await executeQuery(
        'SELECT id FROM users WHERE email = ? AND is_active = TRUE',
        [sanitizedEmail]
      );

      if (users.length === 0) {
        // Don't reveal if email exists or not
        return res.json({
          success: true,
          message: 'If the email exists, a reset code has been sent'
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing OTPs for this email
      await executeQuery(
        'DELETE FROM otps WHERE email = ? AND type = ?',
        [sanitizedEmail, 'password_reset']
      );

      // Insert new OTP
      await executeQuery(
        'INSERT INTO otps (email, otp_code, type, expires_at) VALUES (?, ?, ?, ?)',
        [sanitizedEmail, otp, 'password_reset', expiresAt]
      );

      // Send OTP email
      await sendOTPEmail(sanitizedEmail, otp, 'password_reset');

      // Create audit log
      await createAuditLog(executeQuery, users[0].id, 'PASSWORD_RESET_REQUESTED', 'Password reset requested', req.ip, req.get('User-Agent'));

      res.json({
        success: true,
        message: 'If the email exists, a reset code has been sent'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Reset password route
router.post('/reset-password',
  otpRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, otp, newPassword } = req.body;
      const sanitizedEmail = sanitizeInput(email);

      // Validate password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
      }

      // Find valid OTP
      const otps = await executeQuery(
        'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND type = ? AND expires_at > NOW() AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
        [sanitizedEmail, otp, 'password_reset']
      );

      if (otps.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Mark OTP as used
      await executeQuery(
        'UPDATE otps SET is_used = TRUE WHERE id = ?',
        [otps[0].id]
      );

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      await executeQuery(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [passwordHash, sanitizedEmail]
      );

      // Get user for audit log
      const users = await executeQuery(
        'SELECT id FROM users WHERE email = ?',
        [sanitizedEmail]
      );

      if (users.length > 0) {
        // Create audit log
        await createAuditLog(executeQuery, users[0].id, 'PASSWORD_RESET_SUCCESS', 'Password reset successfully', req.ip, req.get('User-Agent'));
      }

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Logout route
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Remove session
      await executeQuery(
        'DELETE FROM user_sessions WHERE token_hash = ?',
        [hashToken(token)]
      );
    }

    // Create audit log
    await createAuditLog(executeQuery, req.user.id, 'LOGOUT_SUCCESS', 'User logged out successfully', req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get current user route
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await executeQuery(
      'SELECT id, first_name, last_name, email, role, company, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        company: user.company,
        isVerified: user.is_verified,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router; 