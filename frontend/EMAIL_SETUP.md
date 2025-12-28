# 📧 Email Configuration Setup

## Your Email: imahmadkhan1029@gmail.com

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/
2. Click "Security"
3. Enable "2-Step Verification"

### Step 2: Generate App Password
1. In Security section, find "App passwords"
2. Click "App passwords"
3. Select:
   - App: "Mail"
   - Device: "Other (Custom name)"
   - Name: "AccuFlow"
4. Click "Generate"
5. **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)

### Step 3: Create .env File
Create file: `backend/.env`

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=fluent_financial_flow
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=imahmadkhan1029@gmail.com
EMAIL_PASS=YOUR_APP_PASSWORD_HERE
EMAIL_FROM=imahmadkhan1029@gmail.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Step 4: Replace YOUR_APP_PASSWORD_HERE
Replace `YOUR_APP_PASSWORD_HERE` with the 16-character app password you generated.

### Step 5: Test Email Configuration
1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Check the console output - you should see:
   ```
   ✅ Email service configured successfully
   ```

### Troubleshooting
- If you see "❌ Email service configuration failed", double-check your app password
- Make sure 2FA is enabled on your Gmail account
- The app password should be exactly 16 characters

### How OTP Works
1. User registers with email: `imahmadkhan1029@gmail.com`
2. System generates 6-digit OTP
3. Email is sent to the user's email address
4. User enters OTP to verify account
5. Account is activated

### Default Admin Account
- Email: `admin@accuflow.com`
- Password: `admin123`

This account is already in the database and doesn't need email verification. 