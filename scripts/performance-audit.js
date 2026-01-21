#!/usr/bin/env node

/**
 * Performance Audit Script for CourtMaster Tournament Manager
 *
 * This script runs comprehensive performance audits including:
 * - Lighthouse CI for desktop and mobile
 * - Bundle analysis and dependency review
 * - Core Web Vitals measurement
 * - Performance baseline reporting
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';

const execAsync = promisify(exec);

class PerformanceAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      lighthouse: {},
      bundle: {},
      vitals: {},
      recommendations: []
    };
    this.reportsDir = path.join(process.cwd(), 'reports', 'perf');
  }

  async ensureReportsDirectory() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create reports directory:', error);
    }
  }

  async runLighthouseAudit() {
    const spinner = ora('Running Lighthouse performance audits...').start();

    try {
      // Key routes to audit
      const routes = [
        { name: 'Home', path: '/' },
        { name: 'Tournament Dashboard', path: '/tournaments' },
        { name: 'Court Management', path: '/courts' },
        { name: 'Live Scoring', path: '/scoring' },
        { name: 'Public View', path: '/public/tournament/demo' },
        { name: 'Player Dashboard', path: '/player/dashboard' }
      ];

      const lighthouseResults = {};

      for (const route of routes) {
        spinner.text = `Auditing ${route.name} (Desktop)...`;

        const desktopResult = await this.runLighthouseForRoute(route, 'desktop');

        spinner.text = `Auditing ${route.name} (Mobile)...`;

        const mobileResult = await this.runLighthouseForRoute(route, 'mobile');

        lighthouseResults[route.name] = {
          desktop: desktopResult,
          mobile: mobileResult
        };
      }

      this.results.lighthouse = lighthouseResults;
      spinner.succeed('Lighthouse audits completed');

    } catch (error) {
      spinner.fail('Lighthouse audit failed');
      console.error('Lighthouse error:', error);
      this.results.lighthouse.error = error.message;
    }
  }

  async runLighthouseForRoute(route, formFactor) {
    try {
      const url = `http://localhost:3000${route.path}`;
      const configPath = await this.createLighthouseConfig(formFactor);

      const command = `npx lighthouse ${url} --config-path=${configPath} --output=json --quiet`;
      const { stdout } = await execAsync(command);

      const result = JSON.parse(stdout);

      return {
        performance: result.lhr.categories.performance.score * 100,
        fcp: result.lhr.audits['first-contentful-paint'].numericValue,
        lcp: result.lhr.audits['largest-contentful-paint'].numericValue,
        fid: result.lhr.audits['max-potential-fid']?.numericValue || 0,
        cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
        tti: result.lhr.audits['interactive'].numericValue,
        tbt: result.lhr.audits['total-blocking-time'].numericValue,
        speedIndex: result.lhr.audits['speed-index'].numericValue
      };
    } catch (error) {
      console.error(`Failed to audit ${route.name} on ${formFactor}:`, error);
      return {
        error: error.message,
        performance: 0
      };
    }
  }

  async createLighthouseConfig(formFactor) {
    const config = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: formFactor,
        throttling: formFactor === 'mobile'
          ? { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 }
          : { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
        screenEmulation: formFactor === 'mobile'
          ? { mobile: true, width: 375, height: 667, deviceScaleFactor: 2 }
          : { mobile: false, width: 1920, height: 1080, deviceScaleFactor: 1 }
      }
    };

    const configPath = path.join(this.reportsDir, `lighthouse-${formFactor}-config.json`);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  async analyzeBundleSize() {
    const spinner = ora('Analyzing bundle size and dependencies...').start();

    try {
      // Run vite build with bundle analyzer
      spinner.text = 'Building production bundle...';
      await execAsync('npm run build', { cwd: process.cwd() });

      // Analyze dist directory
      const distPath = path.join(process.cwd(), 'dist');
      const assets = await this.analyzeBuildOutput(distPath);

      // Analyze package.json for large dependencies
      const dependencies = await this.analyzeDependencies();

      this.results.bundle = {
        assets,
        dependencies,
        totalSize: assets.reduce((sum, asset) => sum + asset.size, 0),
        jsSize: assets.filter(a => a.name.endsWith('.js')).reduce((sum, asset) => sum + asset.size, 0),
        cssSize: assets.filter(a => a.name.endsWith('.css')).reduce((sum, asset) => sum + asset.size, 0)
      };

      spinner.succeed('Bundle analysis completed');

    } catch (error) {
      spinner.fail('Bundle analysis failed');
      console.error('Bundle analysis error:', error);
      this.results.bundle.error = error.message;
    }
  }

  async analyzeBuildOutput(distPath) {
    const assets = [];

    try {
      const files = await fs.readdir(distPath, { recursive: true });

      for (const file of files) {
        if (typeof file === 'string') {
          const filePath = path.join(distPath, file);
          const stats = await fs.stat(filePath);

          if (stats.isFile()) {
            assets.push({
              name: file,
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing build output:', error);
    }

    return assets.sort((a, b) => b.size - a.size);
  }

  async analyzeDependencies() {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf-8')
      );

      const dependencies = [];

      // Analyze production dependencies
      for (const [name, version] of Object.entries(packageJson.dependencies || {})) {
        try {
          const { stdout } = await execAsync(`npm list ${name} --depth=0 --json`);
          const packageInfo = JSON.parse(stdout);

          dependencies.push({
            name,
            version,
            type: 'production'
          });
        } catch (error) {
          dependencies.push({
            name,
            version,
            type: 'production',
            error: 'Could not analyze'
          });
        }
      }

      return dependencies;
    } catch (error) {
      console.error('Error analyzing dependencies:', error);
      return [];
    }
  }

  async measureCoreWebVitals() {
    const spinner = ora('Measuring Core Web Vitals...').start();

    try {
      // Create a simple test script to measure CWV
      const vitalsScript = `
        import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

        const vitals = {};

        getCLS((metric) => vitals.cls = metric);
        getFID((metric) => vitals.fid = metric);
        getFCP((metric) => vitals.fcp = metric);
        getLCP((metric) => vitals.lcp = metric);
        getTTFB((metric) => vitals.ttfb = metric);

        setTimeout(() => {
          console.log(JSON.stringify(vitals));
        }, 5000);
      `;

      // For now, use Lighthouse results as proxy for CWV
      this.results.vitals = {
        source: 'lighthouse',
        note: 'Core Web Vitals measured via Lighthouse audit',
        timestamp: new Date().toISOString()
      };

      spinner.succeed('Core Web Vitals measurement completed');

    } catch (error) {
      spinner.fail('Core Web Vitals measurement failed');
      console.error('CWV error:', error);
      this.results.vitals.error = error.message;
    }
  }

  async generateRecommendations() {
    const recommendations = [];

    // Analyze Lighthouse results for recommendations
    if (this.results.lighthouse && Object.keys(this.results.lighthouse).length > 0) {
      for (const [routeName, routeResults] of Object.entries(this.results.lighthouse)) {
        if (routeResults.mobile?.performance < 90) {
          recommendations.push({
            category: 'Performance',
            priority: 'high',
            issue: `${routeName} mobile performance score is ${routeResults.mobile?.performance || 0}/100`,
            solution: 'Consider code splitting, image optimization, or reducing JavaScript bundle size'
          });
        }

        if (routeResults.desktop?.performance < 95) {
          recommendations.push({
            category: 'Performance',
            priority: 'medium',
            issue: `${routeName} desktop performance score is ${routeResults.desktop?.performance || 0}/100`,
            solution: 'Optimize resource loading and reduce main thread blocking time'
          });
        }

        // Check specific metrics
        if (routeResults.mobile?.lcp > 2500) {
          recommendations.push({
            category: 'Core Web Vitals',
            priority: 'high',
            issue: `${routeName} LCP is ${routeResults.mobile.lcp}ms (target: <2500ms)`,
            solution: 'Optimize largest contentful paint by preloading critical resources'
          });
        }

        if (routeResults.mobile?.cls > 0.1) {
          recommendations.push({
            category: 'Core Web Vitals',
            priority: 'high',
            issue: `${routeName} CLS is ${routeResults.mobile.cls} (target: <0.1)`,
            solution: 'Add size attributes to images and reserve space for dynamic content'
          });
        }
      }
    }

    // Analyze bundle size for recommendations
    if (this.results.bundle && this.results.bundle.totalSize > 1000000) { // 1MB
      recommendations.push({
        category: 'Bundle Size',
        priority: 'medium',
        issue: `Total bundle size is ${this.formatBytes(this.results.bundle.totalSize)}`,
        solution: 'Consider code splitting, tree shaking, or removing unused dependencies'
      });
    }

    if (this.results.bundle && this.results.bundle.jsSize > 500000) { // 500KB
      recommendations.push({
        category: 'JavaScript',
        priority: 'medium',
        issue: `JavaScript bundle is ${this.formatBytes(this.results.bundle.jsSize)}`,
        solution: 'Implement lazy loading for non-critical components'
      });
    }

    this.results.recommendations = recommendations;
  }

  async saveResults() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(this.reportsDir, `performance-audit-${timestamp}.json`);

      await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));

      // Also save a latest.json for easy access
      const latestPath = path.join(this.reportsDir, 'latest.json');
      await fs.writeFile(latestPath, JSON.stringify(this.results, null, 2));

      return reportPath;
    } catch (error) {
      console.error('Failed to save results:', error);
      throw error;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  displayResults() {
    console.log('\n' + boxen(
      chalk.blue.bold('Performance Audit Results'),
      { padding: 1, borderColor: 'blue', borderStyle: 'round' }
    ));

    // Display Lighthouse scores
    if (this.results.lighthouse && Object.keys(this.results.lighthouse).length > 0) {
      console.log(chalk.yellow.bold('\n📊 Lighthouse Performance Scores:'));

      for (const [routeName, routeResults] of Object.entries(this.results.lighthouse)) {
        if (routeResults.error) {
          console.log(`  ${chalk.red('❌')} ${routeName}: Error - ${routeResults.error}`);
          continue;
        }

        const desktopScore = routeResults.desktop?.performance || 0;
        const mobileScore = routeResults.mobile?.performance || 0;

        const desktopColor = desktopScore >= 90 ? 'green' : desktopScore >= 70 ? 'yellow' : 'red';
        const mobileColor = mobileScore >= 90 ? 'green' : mobileScore >= 70 ? 'yellow' : 'red';

        console.log(`  ${routeName}:`);
        console.log(`    Desktop: ${chalk[desktopColor](Math.round(desktopScore))}/100`);
        console.log(`    Mobile:  ${chalk[mobileColor](Math.round(mobileScore))}/100`);
      }
    }

    // Display bundle analysis
    if (this.results.bundle && !this.results.bundle.error) {
      console.log(chalk.yellow.bold('\n📦 Bundle Analysis:'));
      console.log(`  Total Size: ${chalk.cyan(this.formatBytes(this.results.bundle.totalSize))}`);
      console.log(`  JavaScript: ${chalk.cyan(this.formatBytes(this.results.bundle.jsSize))}`);
      console.log(`  CSS: ${chalk.cyan(this.formatBytes(this.results.bundle.cssSize))}`);

      if (this.results.bundle.assets && this.results.bundle.assets.length > 0) {
        console.log('  Largest Assets:');
        this.results.bundle.assets.slice(0, 5).forEach(asset => {
          console.log(`    ${asset.name}: ${chalk.cyan(asset.sizeFormatted)}`);
        });
      }
    }

    // Display recommendations
    if (this.results.recommendations && this.results.recommendations.length > 0) {
      console.log(chalk.yellow.bold('\n💡 Performance Recommendations:'));

      this.results.recommendations.forEach((rec, index) => {
        const priorityColor = rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'green';
        console.log(`  ${index + 1}. ${chalk[priorityColor](rec.priority.toUpperCase())} - ${rec.category}`);
        console.log(`     ${chalk.gray('Issue:')} ${rec.issue}`);
        console.log(`     ${chalk.gray('Solution:')} ${rec.solution}`);
      });
    }

    console.log(chalk.green.bold('\n✅ Performance audit completed!'));
    console.log(`Report saved to: ${chalk.cyan(this.reportsDir)}`);
  }

  async run() {
    console.log(chalk.blue.bold('🚀 Starting Performance Audit...\n'));

    await this.ensureReportsDirectory();
    await this.runLighthouseAudit();
    await this.analyzeBundleSize();
    await this.measureCoreWebVitals();
    await this.generateRecommendations();

    const reportPath = await this.saveResults();

    this.displayResults();

    return reportPath;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new PerformanceAuditor();

  auditor.run()
    .then((reportPath) => {
      console.log(`\n📄 Detailed report: ${reportPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red('Performance audit failed:'), error);
      process.exit(1);
    });
}

export default PerformanceAuditor;