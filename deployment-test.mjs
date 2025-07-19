// ESM deployment test
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

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
  
  console.log('Testing build file...');
  const indexPath = './dist/index.js';
  
  try {
    const stats = await fs.stat(indexPath);
    console.log('✅ Build file exists');
    console.log('File size:', (stats.size / 1024).toFixed(2) + 'KB');
  } catch (error) {
    console.log('❌ Build file missing');
    process.exit(1);
  }
  
  console.log('✅ Deployment test passed - Ready for deployment');
  
} catch (error) {
  console.error('❌ Deployment test failed:', error.message);
  process.exit(1);
}