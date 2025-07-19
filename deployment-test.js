// Simple deployment test to identify the exact issue
console.log('🔍 Deployment Test Starting...');

try {
  process.env.NODE_ENV = 'production';
  process.env.PORT = '5000';
  
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    HAS_OPENAI_KEY: !!process.env.OPENAI_API_KEY
  });
  
  console.log('Testing import...');
  const indexPath = './dist/index.js';
  
  // Test if file exists
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    console.log('✅ Build file exists');
    const stats = fs.statSync(indexPath);
    console.log('File size:', (stats.size / 1024).toFixed(2) + 'KB');
  } else {
    console.log('❌ Build file missing');
    process.exit(1);
  }
  
  console.log('✅ Deployment test passed');
  
} catch (error) {
  console.error('❌ Deployment test failed:', error.message);
  process.exit(1);
}