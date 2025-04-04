
// Script to fix Rollup issues and ensure compatibility with Vercel and other build environments
console.log("Running build fix script for Lovable app...");

// This script helps ensure compatibility between different build environments
// It detects platform-specific issues and applies fixes before the build process
try {
  const os = require('os');
  
  console.log(`Detected platform: ${os.platform()}`);
  console.log(`Node version: ${process.version}`);
  
  // For Node.js 22+ on Vercel, handle the Rollup native dependencies issue
  if (process.versions.node.startsWith('22.')) {
    console.log('Detected Node.js 22+, applying Rollup compatibility fixes');
    
    // Set environment variable to avoid native dependencies
    process.env.ROLLUP_SKIP_NODEJS_NATIVE_ADDONS = 'true';
    
    // Set node options to avoid experimental warnings
    process.env.NODE_OPTIONS = '--no-warnings';
  }
  
  // Log environment to help debug any build issues
  console.log('Build environment preparation complete');
} catch (error) {
  console.error('Error during build preparation:', error);
  process.exit(1);
}
