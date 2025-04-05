
// Script to fix Rollup issues and ensure compatibility with Vercel and other build environments
console.log("Running build fix script for Lovable app...");

// This script helps ensure compatibility between different build environments
// It detects platform-specific issues and applies fixes before the build process
try {
  // Use dynamic import for ESM compatibility
  const os = await import('os');
  const fs = await import('fs');
  const path = await import('path');
  
  console.log(`Detected platform: ${os.platform()}`);
  console.log(`Node version: ${process.version}`);
  
  // For Node.js 22+ on Vercel, handle the Rollup native dependencies issue
  if (process.versions.node.startsWith('22.')) {
    console.log('Detected Node.js 22+, applying Rollup compatibility fixes');
    
    // Set environment variables to avoid native dependencies
    process.env.ROLLUP_SKIP_NODEJS_NATIVE_ADDONS = 'true';
    process.env.ROLLUP_NATIVE_BINDINGS = 'false';
    process.env.ROLLUP_FORCE_JAVASCRIPT = 'true';
    
    // Set node options to avoid experimental warnings
    process.env.NODE_OPTIONS = '--no-warnings';
    
    // Check if we're on Vercel
    if (process.env.VERCEL) {
      console.log('Running on Vercel, applying platform-specific fixes');
      
      // Create a patch for the Rollup native.js file to force JS implementation
      const rollupNativePath = path.join(process.cwd(), 'node_modules', 'rollup', 'dist', 'native.js');
      
      if (fs.existsSync(rollupNativePath)) {
        console.log('Found Rollup native.js file, patching to force JavaScript implementation');
        
        // Read the original file
        const originalContent = fs.readFileSync(rollupNativePath, 'utf8');
        
        // Replace the content with a version that forces the JS implementation
        const patchedContent = `
// Patched by build-fix.mjs to force JavaScript implementation
exports.getDefaultRollup = function() { return null; }; // Force JS implementation
exports.isNativeRollupAvailable = function() { return false; }; // Force JS implementation
`;
        
        // Write the patched file
        fs.writeFileSync(rollupNativePath, patchedContent, 'utf8');
        console.log('Successfully patched Rollup native.js to force JavaScript implementation');
      } else {
        console.log('Rollup native.js file not found, skipping patch');
      }
    }
  }
  
  // Log environment to help debug any build issues
  console.log('Build environment preparation complete');
} catch (error) {
  console.error('Error during build preparation:', error);
  process.exit(1);
}
