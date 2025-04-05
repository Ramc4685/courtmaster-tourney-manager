
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
        
        // Replace the content with a version that forces the JS implementation
        // Using a proper ES module export to avoid the named export issue
        const patchedContent = `
// Patched by build-fix.mjs to force JavaScript implementation
// Export as both ES Module and CommonJS to avoid import/require conflicts
export function getDefaultRollup() { return null; } // Force JS implementation
export function isNativeRollupAvailable() { return false; } // Force JS implementation
export const parse = (code, options) => null; // Mock parse function
export const parseAsync = async (code, options) => null; // Mock parseAsync function

// For CommonJS compatibility
exports.getDefaultRollup = getDefaultRollup;
exports.isNativeRollupAvailable = isNativeRollupAvailable;
exports.parse = parse;
exports.parseAsync = parseAsync;
`;
        
        // Write the patched file
        fs.writeFileSync(rollupNativePath, patchedContent, 'utf8');
        console.log('Successfully patched Rollup native.js to force JavaScript implementation');
        
        // Also patch the parseAst.js file to handle the proper imports
        const parseAstPath = path.join(process.cwd(), 'node_modules', 'rollup', 'dist', 'es', 'shared', 'parseAst.js');
        if (fs.existsSync(parseAstPath)) {
          console.log('Patching parseAst.js to fix ES/CommonJS module compatibility');
          const originalAstContent = fs.readFileSync(parseAstPath, 'utf8');
          
          // Replace the problematic import with a compatible one
          const patchedAstContent = originalAstContent.replace(
            "import { parse, parseAsync } from '../../native.js';",
            `import * as nativeModule from '../../native.js';
const { parse, parseAsync } = nativeModule;`
          );
          
          fs.writeFileSync(parseAstPath, patchedAstContent, 'utf8');
          console.log('Successfully patched parseAst.js for module compatibility');
        }
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
