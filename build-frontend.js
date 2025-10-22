// Frontend-only build script for Vercel
// This skips TypeScript compilation to avoid Hardhat dependencies

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Building frontend for Vercel...');

try {
  // Only run Vite build, skip TypeScript compilation
  execSync('vite build', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Frontend build completed successfully!');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}
