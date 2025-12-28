#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 AccuFlow Setup Script');
console.log('========================\n');

// Check if Node.js version is sufficient
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js 18 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Check if backend directory exists
const backendPath = path.join(__dirname, 'backend');
if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found. Please ensure you have the complete project structure.');
  process.exit(1);
}

// Check if .env file exists in backend
const envPath = path.join(backendPath, '.env');
const envExamplePath = path.join(backendPath, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created. Please configure your environment variables.');
  } else {
    console.error('❌ env.example file not found in backend directory.');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists.');
}

// Check if package.json files exist
const frontendPackagePath = path.join(__dirname, 'package.json');
const backendPackagePath = path.join(backendPath, 'package.json');

if (!fs.existsSync(frontendPackagePath)) {
  console.error('❌ Frontend package.json not found.');
  process.exit(1);
}

if (!fs.existsSync(backendPackagePath)) {
  console.error('❌ Backend package.json not found.');
  process.exit(1);
}

console.log('✅ Package.json files found.');

// Check if node_modules exist
const frontendNodeModules = path.join(__dirname, 'node_modules');
const backendNodeModules = path.join(backendPath, 'node_modules');

if (!fs.existsSync(frontendNodeModules)) {
  console.log('📦 Installing frontend dependencies...');
  console.log('   Run: npm install');
} else {
  console.log('✅ Frontend dependencies installed.');
}

if (!fs.existsSync(backendNodeModules)) {
  console.log('📦 Installing backend dependencies...');
  console.log('   Run: cd backend && npm install');
} else {
  console.log('✅ Backend dependencies installed.');
}

console.log('\n📋 Setup Checklist:');
console.log('==================');
console.log('1. ✅ Node.js version check');
console.log('2. ✅ Project structure validation');
console.log('3. ✅ Environment file setup');
console.log('4. 📦 Install dependencies (if needed)');
console.log('5. 🗄️  Setup MySQL database');
console.log('6. 📧 Configure email settings');
console.log('7. 🚀 Start the application');

console.log('\n📖 Next Steps:');
console.log('==============');
console.log('1. Install dependencies:');
console.log('   npm install');
console.log('   cd backend && npm install');
console.log('');
console.log('2. Setup MySQL database:');
console.log('   - Start XAMPP');
console.log('   - Import backend/database/schema.sql');
console.log('');
console.log('3. Configure environment variables:');
console.log('   - Edit backend/.env');
console.log('   - Set up Gmail app password');
console.log('');
console.log('4. Start the application:');
console.log('   # Terminal 1 - Backend');
console.log('   cd backend && npm run dev');
console.log('');
console.log('   # Terminal 2 - Frontend');
console.log('   npm run dev');
console.log('');
console.log('5. Access the application:');
console.log('   - Frontend: http://localhost:5173');
console.log('   - Backend: http://localhost:5000');
console.log('   - Default admin: admin@accuflow.com / admin123');

console.log('\n📚 Documentation:');
console.log('================');
console.log('- README.md - Complete setup guide');
console.log('- backend/database/schema.sql - Database structure');
console.log('- backend/env.example - Environment variables template');

console.log('\n🎉 Setup complete! Follow the next steps above to get started.'); 