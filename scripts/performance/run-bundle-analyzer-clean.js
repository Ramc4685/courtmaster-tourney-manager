#!/usr/bin/env node

/**
 * Bundle Analyzer Runner
 * 
 * Runs bundle analysis on the Vite-built application using the generated stats.html
 * and provides additional analysis tools.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const STATS_HTML = path.join(process.cwd(), 'dist', 'stats.html');
const DIST_DIR = path.join(process.cwd(), 'dist');

/**
 * Check if the build directory and stats file exist
 */
function validateBuildFiles() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  if (!fs.existsSync(STATS_HTML)) {
    console.error('❌ Bundle stats not found. Please run "npm run build:analyze" first.');
    console.log('💡 This will generate the required stats.html file for analysis.');
    console.log('💡 Run: npm run build:analyze');
    process.exit(1);
  }

  console.log('✅ Build files found, proceeding with analysis...');
}

/**
 * Analyze bundle sizes from dist directory
 */
function analyzeBundleSizes() {
  console.log('📊 Analyzing bundle sizes...');
  
  const chunks = [];
  const assets = [];
  
  // Read all files in dist directory
  function readDirRecursive(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const relativePath = path.join(prefix, file);
      
      if (stat.isDirectory()) {
        readDirRecursive(filePath, relativePath);
      } else {
        const size = stat.size;
        const sizeKB = (size / 1024).toFixed(2);
        
        if (file.endsWith('.js')) {
          chunks.push({ name: relativePath, size: sizeKB, bytes: size });
        } else {
          assets.push({ name: relativePath, size: sizeKB, bytes: size });
        }
      }
    });
  }
  
  readDirRecursive(DIST_DIR);
  
  // Sort by size (largest first)
  chunks.sort((a, b) => b.bytes - a.bytes);
  assets.sort((a, b) => b.bytes - a.bytes);
  
  console.log('\n📦 JavaScript Chunks:');
  console.log('─'.repeat(60));
  chunks.forEach(chunk => {
    const indicator = chunk.bytes > 200 * 1024 ? '⚠️ ' : chunk.bytes > 100 * 1024 ? '⚡' : '✅';
    console.log(`${indicator} ${chunk.name.padEnd(40)} ${chunk.size.padStart(8)} KB`);
  });
  
  console.log('\n🎨 Assets:');
  console.log('─'.repeat(60));
  assets.slice(0, 10).forEach(asset => {
    console.log(`📄 ${asset.name.padEnd(40)} ${asset.size.padStart(8)} KB`);
  });
  
  const totalSize = [...chunks, ...assets].reduce((sum, item) => sum + item.bytes, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  
  console.log('\n📈 Bundle Summary:');
  console.log('─'.repeat(60));
  console.log(`Total JavaScript: ${(chunks.reduce((sum, c) => sum + c.bytes, 0) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total Assets: ${(assets.reduce((sum, a) => sum + a.bytes, 0) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total Bundle Size: ${totalSizeMB} MB (${totalSizeKB} KB)`);
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  console.log('─'.repeat(60));
  
  const largeChunks = chunks.filter(c => c.bytes > 200 * 1024);
  if (largeChunks.length > 0) {
    console.log('⚠️  Large chunks detected (>200KB):');
    largeChunks.forEach(chunk => {
      console.log(`   - Consider code splitting for: ${chunk.name}`);
    });
  }
  
  if (totalSize > 2 * 1024 * 1024) {
    console.log('⚠️  Bundle size is large (>2MB). Consider:');
    console.log('   - Dynamic imports for non-critical features');
    console.log('   - Tree shaking optimization');
    console.log('   - Removing unused dependencies');
  } else {
    console.log('✅ Bundle size is within recommended limits');
  }
}

/**
 * Start a simple HTTP server to serve the stats.html file
 */
function startStatsServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/stats.html') {
      fs.readFile(STATS_HTML, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Stats file not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  const port = 8888;
  server.listen(port, () => {
    console.log(`🌐 Bundle analyzer server running at http://localhost:${port}`);
    console.log('📊 Opening bundle analyzer in your browser...');
    console.log('💡 Please open http://localhost:8888 in your browser');
  });
  
  return server;
}

/**
 * Run the bundle analyzer
 */
async function runBundleAnalyzer() {
  try {
    console.log('🔍 Starting Vite bundle analysis...');
    
    // Validate required files exist
    validateBuildFiles();
    
    // Analyze bundle sizes
    analyzeBundleSizes();
    
    // Start stats server
    const server = startStatsServer();
    
    console.log('\n✅ Bundle analysis completed!');
    console.log('🔍 Interactive visualization available in your browser');
    console.log('📊 Press Ctrl+C to stop the server');
    
    // Keep the server running
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down bundle analyzer server...');
      server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to run bundle analyzer:', error.message);
    process.exit(1);
  }
}

// Handle command line usage
if (require.main === module) {
  runBundleAnalyzer().catch(error => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = { runBundleAnalyzer };
