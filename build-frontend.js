// Frontend-only build script for Render/Vercel
// This skips TypeScript compilation to avoid Hardhat dependencies

const { execSync } = require('child_process');
const path = require('path');

try {
  // Use npx vite to ensure we're using the local vite installation
  execSync('npx vite build', { 
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}
