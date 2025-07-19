// Test if the production build works
try {
  console.log('Testing production build...');
  
  // Set environment
  process.env.NODE_ENV = 'production';
  
  // Try to load the built server
  const server = await import('./dist/index.js');
  console.log('✅ Production build loads successfully');
  
  setTimeout(() => {
    console.log('✅ Server test complete');
    process.exit(0);
  }, 2000);
  
} catch (error) {
  console.error('❌ Production build failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}