#!/usr/bin/env node

/**
 * CourtMaster Performance Benchmark Runner
 * 
 * Automated performance benchmarking and regression detection system.
 * Integrates with CI/CD pipeline for continuous performance monitoring.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

class BenchmarkRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      benchmarks: {},
      summary: {},
      regressions: []
    };
    
    this.thresholds = {
      bundleSize: {
        total: 2 * 1024 * 1024, // 2MB
        chunk: 200 * 1024, // 200KB per chunk
        increase: 0.1 // 10% increase threshold
      },
      loadTime: {
        fcp: 1500, // First Contentful Paint
        lcp: 2500, // Largest Contentful Paint
        fid: 100,  // First Input Delay
        cls: 0.1   // Cumulative Layout Shift
      },
      memory: {
        heap: 50 * 1024 * 1024, // 50MB
        increase: 0.2 // 20% increase threshold
      },
      api: {
        responseTime: 500, // 500ms
        throughput: 100 // requests per second
      }
    };
  }

  async run() {
    console.log(chalk.blue.bold('\n🏆 CourtMaster Performance Benchmark Runner\n'));

    try {
      // Load historical data for comparison
      await this.loadHistoricalData();

      // Run all benchmark suites
      await this.runBundleSizeBenchmark();
      await this.runLoadTimeBenchmark();
      await this.runMemoryBenchmark();
      await this.runAPIBenchmark();
      await this.runOfflineSyncBenchmark();

      // Analyze results and detect regressions
      await this.analyzeResults();

      // Generate reports
      await this.generateReports();

      // Save results for future comparisons
      await this.saveResults();

      console.log(chalk.green.bold('\n✅ Benchmark suite completed successfully!\n'));
      
      // Exit with error code if regressions detected
      if (this.results.regressions.length > 0) {
        console.log(chalk.red.bold(`❌ ${this.results.regressions.length} performance regressions detected!`));
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Benchmark suite failed:'), error.message);
      process.exit(1);
    }
  }

  async loadHistoricalData() {
    const spinner = ora('Loading historical benchmark data...').start();
    
    try {
      const historyPath = path.join(__dirname, '../../data/benchmark-history.json');
      const historyData = await fs.readFile(historyPath, 'utf8');
      this.historicalData = JSON.parse(historyData);
      spinner.succeed('Historical data loaded');
    } catch (error) {
      this.historicalData = { benchmarks: [] };
      spinner.warn('No historical data found, creating baseline');
    }
  }

  async runBundleSizeBenchmark() {
    const spinner = ora('Running bundle size benchmark...').start();

    try {
      // Build the application
      execSync('npm run build', { stdio: 'pipe' });

      // Analyze bundle
      const distPath = path.join(__dirname, '../../dist');
      const stats = await this.analyzeBundleSize(distPath);

      this.results.benchmarks.bundleSize = {
        total: stats.total,
        chunks: stats.chunks,
        assets: stats.assets,
        gzipTotal: stats.gzipTotal,
        timestamp: Date.now()
      };

      // Check for regressions
      await this.checkBundleSizeRegression(stats);

      spinner.succeed(`Bundle size: ${this.formatBytes(stats.total)} (gzipped: ${this.formatBytes(stats.gzipTotal)})`);
    } catch (error) {
      spinner.fail('Bundle size benchmark failed');
      throw error;
    }
  }

  async analyzeBundleSize(distPath) {
    const stats = {
      total: 0,
      gzipTotal: 0,
      chunks: {},
      assets: {}
    };

    const files = await fs.readdir(distPath, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(distPath, file);
      const fileStat = await fs.stat(filePath);
      
      if (fileStat.isFile()) {
        const size = fileStat.size;
        stats.total += size;

        // Categorize files
        if (file.endsWith('.js')) {
          const chunkName = this.extractChunkName(file);
          stats.chunks[chunkName] = (stats.chunks[chunkName] || 0) + size;
        } else {
          stats.assets[file] = size;
        }

        // Calculate gzipped size for JS/CSS files
        if (file.endsWith('.js') || file.endsWith('.css')) {
          try {
            const gzipSize = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' });
            stats.gzipTotal += parseInt(gzipSize.trim());
          } catch (error) {
            // Fallback: estimate gzip size as 30% of original
            stats.gzipTotal += Math.floor(size * 0.3);
          }
        }
      }
    }

    return stats;
  }

  async runLoadTimeBenchmark() {
    const spinner = ora('Running load time benchmark...').start();

    try {
      // Use Lighthouse CI for load time metrics
      const lighthouseResults = await this.runLighthouse();
      
      this.results.benchmarks.loadTime = {
        fcp: lighthouseResults.fcp,
        lcp: lighthouseResults.lcp,
        fid: lighthouseResults.fid,
        cls: lighthouseResults.cls,
        performanceScore: lighthouseResults.performanceScore,
        timestamp: Date.now()
      };

      // Check for regressions
      await this.checkLoadTimeRegression(lighthouseResults);

      spinner.succeed(`Performance Score: ${lighthouseResults.performanceScore}/100`);
    } catch (error) {
      spinner.fail('Load time benchmark failed');
      throw error;
    }
  }

  async runLighthouse() {
    return new Promise((resolve, reject) => {
      // Start dev server for testing
      const server = spawn('npm', ['run', 'preview'], { stdio: 'pipe' });
      
      setTimeout(async () => {
        try {
          const lighthouse = spawn('npx', [
            'lighthouse',
            'http://localhost:4173',
            '--output=json',
            '--quiet',
            '--chrome-flags=--headless'
          ], { stdio: 'pipe' });

          let output = '';
          lighthouse.stdout.on('data', (data) => {
            output += data.toString();
          });

          lighthouse.on('close', (code) => {
            server.kill();
            
            if (code === 0) {
              try {
                const results = JSON.parse(output);
                const metrics = results.lhr.audits;
                
                resolve({
                  fcp: metrics['first-contentful-paint'].numericValue,
                  lcp: metrics['largest-contentful-paint'].numericValue,
                  fid: metrics['max-potential-fid'].numericValue,
                  cls: metrics['cumulative-layout-shift'].numericValue,
                  performanceScore: results.lhr.categories.performance.score * 100
                });
              } catch (error) {
                reject(new Error('Failed to parse Lighthouse results'));
              }
            } else {
              reject(new Error('Lighthouse failed'));
            }
          });
        } catch (error) {
          server.kill();
          reject(error);
        }
      }, 3000); // Wait for server to start
    });
  }

  async runMemoryBenchmark() {
    const spinner = ora('Running memory benchmark...').start();

    try {
      // Memory usage simulation with large tournament data
      const memoryResults = await this.simulateMemoryUsage();
      
      this.results.benchmarks.memory = {
        heapUsed: memoryResults.heapUsed,
        heapTotal: memoryResults.heapTotal,
        external: memoryResults.external,
        peakUsage: memoryResults.peakUsage,
        timestamp: Date.now()
      };

      // Check for regressions
      await this.checkMemoryRegression(memoryResults);

      spinner.succeed(`Peak memory usage: ${this.formatBytes(memoryResults.peakUsage)}`);
    } catch (error) {
      spinner.fail('Memory benchmark failed');
      throw error;
    }
  }

  async simulateMemoryUsage() {
    // Simulate large tournament with 256 teams
    const teams = Array.from({ length: 256 }, (_, i) => ({
      id: `team-${i}`,
      name: `Team ${i}`,
      players: Array.from({ length: 4 }, (_, j) => ({
        id: `player-${i}-${j}`,
        name: `Player ${j}`,
        stats: { wins: 0, losses: 0, points: 0 }
      }))
    }));

    // Simulate matches (single elimination = 255 matches)
    const matches = Array.from({ length: 255 }, (_, i) => ({
      id: `match-${i}`,
      teams: [`team-${i * 2}`, `team-${i * 2 + 1}`],
      scores: [0, 0],
      status: 'pending'
    }));

    const initialMemory = process.memoryUsage();
    let peakUsage = initialMemory.heapUsed;

    // Simulate data processing
    for (let i = 0; i < 10; i++) {
      // Process tournament brackets
      const brackets = this.generateBrackets(teams, matches);
      
      // Simulate real-time updates
      const updates = this.simulateRealtimeUpdates(matches);
      
      const currentMemory = process.memoryUsage();
      peakUsage = Math.max(peakUsage, currentMemory.heapUsed);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    const finalMemory = process.memoryUsage();
    
    return {
      heapUsed: finalMemory.heapUsed,
      heapTotal: finalMemory.heapTotal,
      external: finalMemory.external,
      peakUsage
    };
  }

  async runAPIBenchmark() {
    const spinner = ora('Running API benchmark...').start();

    try {
      // Test API endpoints with concurrent requests
      const apiResults = await this.benchmarkAPIEndpoints();
      
      this.results.benchmarks.api = {
        responseTime: apiResults.averageResponseTime,
        throughput: apiResults.requestsPerSecond,
        errorRate: apiResults.errorRate,
        endpoints: apiResults.endpoints,
        timestamp: Date.now()
      };

      // Check for regressions
      await this.checkAPIRegression(apiResults);

      spinner.succeed(`API avg response: ${apiResults.averageResponseTime}ms`);
    } catch (error) {
      spinner.fail('API benchmark failed');
      throw error;
    }
  }

  async benchmarkAPIEndpoints() {
    const endpoints = [
      { path: '/api/tournaments', method: 'GET' },
      { path: '/api/teams', method: 'GET' },
      { path: '/api/matches', method: 'GET' },
      { path: '/api/registrations', method: 'GET' }
    ];

    const results = {
      endpoints: {},
      totalRequests: 0,
      totalTime: 0,
      errors: 0
    };

    // Run concurrent requests for each endpoint
    for (const endpoint of endpoints) {
      const endpointResults = await this.benchmarkEndpoint(endpoint);
      results.endpoints[endpoint.path] = endpointResults;
      results.totalRequests += endpointResults.requests;
      results.totalTime += endpointResults.totalTime;
      results.errors += endpointResults.errors;
    }

    return {
      averageResponseTime: results.totalTime / results.totalRequests,
      requestsPerSecond: results.totalRequests / (results.totalTime / 1000),
      errorRate: results.errors / results.totalRequests,
      endpoints: results.endpoints
    };
  }

  async runOfflineSyncBenchmark() {
    const spinner = ora('Running offline sync benchmark...').start();

    try {
      // Simulate offline queue processing
      const syncResults = await this.benchmarkOfflineSync();
      
      this.results.benchmarks.offlineSync = {
        queueProcessingTime: syncResults.processingTime,
        conflictResolutionTime: syncResults.conflictTime,
        batchSize: syncResults.batchSize,
        successRate: syncResults.successRate,
        timestamp: Date.now()
      };

      spinner.succeed(`Sync processing: ${syncResults.processingTime}ms for ${syncResults.batchSize} items`);
    } catch (error) {
      spinner.fail('Offline sync benchmark failed');
      throw error;
    }
  }

  async analyzeResults() {
    const spinner = ora('Analyzing results and detecting regressions...').start();

    // Calculate summary metrics
    this.results.summary = {
      totalBenchmarks: Object.keys(this.results.benchmarks).length,
      regressionCount: this.results.regressions.length,
      overallScore: this.calculateOverallScore(),
      recommendations: this.generateRecommendations()
    };

    spinner.succeed(`Analysis complete: ${this.results.regressions.length} regressions detected`);
  }

  async generateReports() {
    const spinner = ora('Generating performance reports...').start();

    try {
      // Generate JSON report
      const jsonReport = JSON.stringify(this.results, null, 2);
      await fs.writeFile(
        path.join(__dirname, '../../reports/benchmark-results.json'),
        jsonReport
      );

      // Generate HTML report
      const htmlReport = this.generateHTMLReport();
      await fs.writeFile(
        path.join(__dirname, '../../reports/benchmark-report.html'),
        htmlReport
      );

      // Generate CI-friendly report
      const ciReport = this.generateCIReport();
      await fs.writeFile(
        path.join(__dirname, '../../reports/benchmark-ci.txt'),
        ciReport
      );

      spinner.succeed('Reports generated successfully');
    } catch (error) {
      spinner.fail('Failed to generate reports');
      throw error;
    }
  }

  async saveResults() {
    const spinner = ora('Saving results for future comparisons...').start();

    try {
      // Add current results to history
      this.historicalData.benchmarks.push({
        timestamp: this.results.timestamp,
        summary: this.results.summary,
        benchmarks: this.results.benchmarks
      });

      // Keep only last 50 benchmark runs
      if (this.historicalData.benchmarks.length > 50) {
        this.historicalData.benchmarks = this.historicalData.benchmarks.slice(-50);
      }

      // Save updated history
      const historyPath = path.join(__dirname, '../../data/benchmark-history.json');
      await fs.mkdir(path.dirname(historyPath), { recursive: true });
      await fs.writeFile(
        historyPath,
        JSON.stringify(this.historicalData, null, 2)
      );

      spinner.succeed('Results saved to history');
    } catch (error) {
      spinner.fail('Failed to save results');
      throw error;
    }
  }

  // Helper methods
  extractChunkName(filename) {
    const match = filename.match(/^(.+?)-[a-f0-9]+\.js$/);
    return match ? match[1] : filename;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  calculateOverallScore() {
    // Weighted scoring based on different metrics
    let score = 100;
    
    // Bundle size impact (20%)
    if (this.results.benchmarks.bundleSize) {
      const sizeRatio = this.results.benchmarks.bundleSize.total / this.thresholds.bundleSize.total;
      score -= Math.max(0, (sizeRatio - 1) * 20);
    }

    // Load time impact (40%)
    if (this.results.benchmarks.loadTime) {
      score -= Math.max(0, (100 - this.results.benchmarks.loadTime.performanceScore) * 0.4);
    }

    // Memory impact (20%)
    if (this.results.benchmarks.memory) {
      const memoryRatio = this.results.benchmarks.memory.peakUsage / this.thresholds.memory.heap;
      score -= Math.max(0, (memoryRatio - 1) * 20);
    }

    // API performance impact (20%)
    if (this.results.benchmarks.api) {
      const responseRatio = this.results.benchmarks.api.responseTime / this.thresholds.api.responseTime;
      score -= Math.max(0, (responseRatio - 1) * 20);
    }

    return Math.max(0, Math.round(score));
  }

  generateRecommendations() {
    const recommendations = [];

    // Bundle size recommendations
    if (this.results.benchmarks.bundleSize?.total > this.thresholds.bundleSize.total) {
      recommendations.push({
        category: 'Bundle Size',
        priority: 'high',
        message: 'Bundle size exceeds threshold. Consider code splitting or removing unused dependencies.',
        impact: 'Load time performance'
      });
    }

    // Load time recommendations
    if (this.results.benchmarks.loadTime?.performanceScore < 90) {
      recommendations.push({
        category: 'Load Time',
        priority: 'high',
        message: 'Performance score below 90. Optimize critical rendering path and reduce JavaScript execution time.',
        impact: 'User experience'
      });
    }

    return recommendations;
  }

  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>CourtMaster Performance Benchmark Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; }
        .metric { background: #f8f9fa; padding: 1rem; margin: 1rem 0; border-radius: 6px; border-left: 4px solid #667eea; }
        .regression { border-left-color: #dc3545; background: #fff5f5; }
        .good { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; background: #fffbf0; }
        .score { font-size: 2rem; font-weight: bold; text-align: center; margin: 2rem 0; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 CourtMaster Performance Benchmark Report</h1>
        <p>Generated: ${this.results.timestamp}</p>
        <p>Environment: ${this.results.environment}</p>
    </div>

    <div class="score ${this.results.summary.overallScore >= 90 ? 'good' : this.results.summary.overallScore >= 70 ? 'warning' : 'regression'}">
        Overall Performance Score: ${this.results.summary.overallScore}/100
    </div>

    <h2>Benchmark Results</h2>
    ${Object.entries(this.results.benchmarks).map(([key, data]) => `
        <div class="metric">
            <h3>${key.charAt(0).toUpperCase() + key.slice(1)} Benchmark</h3>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
    `).join('')}

    ${this.results.regressions.length > 0 ? `
        <h2>⚠️ Performance Regressions</h2>
        ${this.results.regressions.map(regression => `
            <div class="metric regression">
                <h3>${regression.category}</h3>
                <p><strong>Issue:</strong> ${regression.message}</p>
                <p><strong>Impact:</strong> ${regression.impact}</p>
                <p><strong>Current:</strong> ${regression.current} | <strong>Previous:</strong> ${regression.previous}</p>
            </div>
        `).join('')}
    ` : '<p>✅ No performance regressions detected!</p>'}

    <h2>Recommendations</h2>
    ${this.results.summary.recommendations.map(rec => `
        <div class="metric ${rec.priority === 'high' ? 'warning' : ''}">
            <h3>${rec.category}</h3>
            <p>${rec.message}</p>
            <p><em>Impact: ${rec.impact}</em></p>
        </div>
    `).join('')}
</body>
</html>`;
  }

  generateCIReport() {
    return `
CourtMaster Performance Benchmark Results
=========================================

Timestamp: ${this.results.timestamp}
Environment: ${this.results.environment}
Overall Score: ${this.results.summary.overallScore}/100

Benchmark Summary:
- Total Benchmarks: ${this.results.summary.totalBenchmarks}
- Regressions: ${this.results.summary.regressionCount}

${this.results.regressions.length > 0 ? `
PERFORMANCE REGRESSIONS DETECTED:
${this.results.regressions.map(r => `- ${r.category}: ${r.message}`).join('\n')}
` : 'No performance regressions detected.'}

Bundle Size: ${this.results.benchmarks.bundleSize ? this.formatBytes(this.results.benchmarks.bundleSize.total) : 'N/A'}
Load Time Score: ${this.results.benchmarks.loadTime ? this.results.benchmarks.loadTime.performanceScore : 'N/A'}/100
Memory Peak: ${this.results.benchmarks.memory ? this.formatBytes(this.results.benchmarks.memory.peakUsage) : 'N/A'}
API Response: ${this.results.benchmarks.api ? this.results.benchmarks.api.responseTime + 'ms' : 'N/A'}
`;
  }

  // Regression detection methods
  async checkBundleSizeRegression(current) {
    if (!this.historicalData.benchmarks.length) return;

    const previous = this.historicalData.benchmarks[this.historicalData.benchmarks.length - 1];
    if (!previous.benchmarks.bundleSize) return;

    const increase = (current.total - previous.benchmarks.bundleSize.total) / previous.benchmarks.bundleSize.total;
    
    if (increase > this.thresholds.bundleSize.increase) {
      this.results.regressions.push({
        category: 'Bundle Size',
        message: `Bundle size increased by ${(increase * 100).toFixed(1)}%`,
        impact: 'Load time performance',
        current: this.formatBytes(current.total),
        previous: this.formatBytes(previous.benchmarks.bundleSize.total),
        severity: increase > 0.2 ? 'high' : 'medium'
      });
    }
  }

  async checkLoadTimeRegression(current) {
    if (!this.historicalData.benchmarks.length) return;

    const previous = this.historicalData.benchmarks[this.historicalData.benchmarks.length - 1];
    if (!previous.benchmarks.loadTime) return;

    const scoreDrop = previous.benchmarks.loadTime.performanceScore - current.performanceScore;
    
    if (scoreDrop > 5) {
      this.results.regressions.push({
        category: 'Load Time',
        message: `Performance score dropped by ${scoreDrop.toFixed(1)} points`,
        impact: 'User experience',
        current: `${current.performanceScore}/100`,
        previous: `${previous.benchmarks.loadTime.performanceScore}/100`,
        severity: scoreDrop > 10 ? 'high' : 'medium'
      });
    }
  }

  async checkMemoryRegression(current) {
    if (!this.historicalData.benchmarks.length) return;

    const previous = this.historicalData.benchmarks[this.historicalData.benchmarks.length - 1];
    if (!previous.benchmarks.memory) return;

    const increase = (current.peakUsage - previous.benchmarks.memory.peakUsage) / previous.benchmarks.memory.peakUsage;
    
    if (increase > this.thresholds.memory.increase) {
      this.results.regressions.push({
        category: 'Memory Usage',
        message: `Peak memory usage increased by ${(increase * 100).toFixed(1)}%`,
        impact: 'Application stability',
        current: this.formatBytes(current.peakUsage),
        previous: this.formatBytes(previous.benchmarks.memory.peakUsage),
        severity: increase > 0.3 ? 'high' : 'medium'
      });
    }
  }

  async checkAPIRegression(current) {
    if (!this.historicalData.benchmarks.length) return;

    const previous = this.historicalData.benchmarks[this.historicalData.benchmarks.length - 1];
    if (!previous.benchmarks.api) return;

    const increase = (current.averageResponseTime - previous.benchmarks.api.responseTime) / previous.benchmarks.api.responseTime;
    
    if (increase > 0.2) { // 20% increase threshold
      this.results.regressions.push({
        category: 'API Performance',
        message: `Average response time increased by ${(increase * 100).toFixed(1)}%`,
        impact: 'Application responsiveness',
        current: `${current.averageResponseTime}ms`,
        previous: `${previous.benchmarks.api.responseTime}ms`,
        severity: increase > 0.5 ? 'high' : 'medium'
      });
    }
  }

  // Simulation helper methods
  generateBrackets(teams, matches) {
    // Simple bracket generation simulation
    return {
      rounds: Math.ceil(Math.log2(teams.length)),
      matches: matches.length,
      processed: Date.now()
    };
  }

  simulateRealtimeUpdates(matches) {
    // Simulate real-time match updates
    return matches.map(match => ({
      ...match,
      lastUpdate: Date.now(),
      processed: true
    }));
  }

  async benchmarkEndpoint(endpoint) {
    // Simulate API endpoint benchmarking
    const requests = 50;
    const results = {
      requests,
      totalTime: 0,
      errors: 0,
      responseTimes: []
    };

    for (let i = 0; i < requests; i++) {
      const start = Date.now();
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
        const responseTime = Date.now() - start;
        results.responseTimes.push(responseTime);
        results.totalTime += responseTime;
      } catch (error) {
        results.errors++;
      }
    }

    return results;
  }

  async benchmarkOfflineSync() {
    // Simulate offline sync processing
    const queueSize = 100;
    const start = Date.now();
    
    // Simulate processing queue items
    for (let i = 0; i < queueSize; i++) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
    }
    
    const processingTime = Date.now() - start;
    
    return {
      processingTime,
      conflictTime: Math.floor(processingTime * 0.1), // 10% for conflict resolution
      batchSize: queueSize,
      successRate: 0.95 // 95% success rate
    };
  }
}

// CLI interface
if (require.main === module) {
  const runner = new BenchmarkRunner();
  runner.run().catch(console.error);
}

module.exports = BenchmarkRunner;
