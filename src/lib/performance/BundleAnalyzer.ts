/**
 * Comprehensive Bundle Analysis Utility
 *
 * Provides detailed bundle size tracking, performance budget enforcement,
 * and optimization recommendations for the CourtMaster application.
 */

interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  brotliSize?: number;
  chunkCount: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  assets: AssetInfo[];
  timestamp: number;
  buildHash: string;
}

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  dependencies: string[];
  type: 'entry' | 'vendor' | 'async' | 'runtime';
  cacheability: 'high' | 'medium' | 'low';
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  gzippedSize: number;
  isTreeShakeable: boolean;
  usage: 'critical' | 'important' | 'optional' | 'unused';
  impactScore: number;
}

interface AssetInfo {
  name: string;
  size: number;
  type: 'image' | 'font' | 'css' | 'js' | 'other';
  optimizable: boolean;
  compressionRatio: number;
}

interface PerformanceBudget {
  maxTotalSize: number;
  maxChunkSize: number;
  maxInitialLoad: number;
  maxAssetSize: number;
  maxDependencies: number;
  warnings: BudgetWarning[];
}

interface BudgetWarning {
  type: 'size' | 'count' | 'optimization';
  severity: 'error' | 'warning' | 'info';
  message: string;
  recommendation: string;
  affectedItems: string[];
}

interface AnalysisReport {
  metrics: BundleMetrics;
  budget: PerformanceBudget;
  recommendations: OptimizationRecommendation[];
  comparison?: ComparisonData;
  score: number;
}

interface OptimizationRecommendation {
  type: 'chunk-splitting' | 'tree-shaking' | 'compression' | 'caching' | 'lazy-loading';
  priority: 'high' | 'medium' | 'low';
  impact: 'major' | 'moderate' | 'minor';
  description: string;
  implementation: string;
  estimatedSaving: number;
}

interface ComparisonData {
  previousBuild: BundleMetrics;
  sizeChange: number;
  chunkChanges: ChunkComparison[];
  regressions: string[];
  improvements: string[];
}

interface ChunkComparison {
  name: string;
  oldSize: number;
  newSize: number;
  change: number;
  changePercent: number;
}

class BundleAnalyzer {
  private budgetConfig: PerformanceBudget;
  private historyPath: string;
  private maxHistoryEntries: number = 50;

  constructor(budgetConfig?: Partial<PerformanceBudget>) {
    this.budgetConfig = {
      maxTotalSize: 2 * 1024 * 1024, // 2MB total
      maxChunkSize: 250 * 1024, // 250KB per chunk
      maxInitialLoad: 1 * 1024 * 1024, // 1MB initial load
      maxAssetSize: 100 * 1024, // 100KB per asset
      maxDependencies: 100,
      warnings: [],
      ...budgetConfig
    };
    this.historyPath = 'dist/bundle-history.json';
  }

  /**
   * Analyze bundle from build stats
   */
  async analyzeBuild(statsPath: string): Promise<AnalysisReport> {
    try {
      const stats = await this.loadBuildStats(statsPath);
      const metrics = this.extractMetrics(stats);
      const budget = this.checkPerformanceBudget(metrics);
      const recommendations = this.generateRecommendations(metrics, budget);
      const comparison = await this.compareWithPrevious(metrics);
      const score = this.calculateScore(metrics, budget);

      const report: AnalysisReport = {
        metrics,
        budget,
        recommendations,
        comparison,
        score
      };

      await this.saveToHistory(metrics);
      return report;
    } catch (error) {
      throw new Error(`Bundle analysis failed: ${error.message}`);
    }
  }

  /**
   * Load and parse build statistics
   */
  private async loadBuildStats(statsPath: string): Promise<any> {
    const fs = await import('fs');
    const data = await fs.promises.readFile(statsPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Extract comprehensive metrics from build stats
   */
  private extractMetrics(stats: any): BundleMetrics {
    const chunks = this.analyzeChunks(stats.chunks || []);
    const dependencies = this.analyzeDependencies(stats.modules || []);
    const assets = this.analyzeAssets(stats.assets || []);

    return {
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      gzippedSize: chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0),
      chunkCount: chunks.length,
      chunks,
      dependencies,
      assets,
      timestamp: Date.now(),
      buildHash: stats.hash || 'unknown'
    };
  }

  /**
   * Analyze individual chunks for optimization opportunities
   */
  private analyzeChunks(chunks: any[]): ChunkInfo[] {
    return chunks.map(chunk => {
      const modules = chunk.modules?.map(m => m.name) || [];
      const dependencies = this.extractChunkDependencies(modules);
      const type = this.categorizeChunk(chunk.name, modules);
      const cacheability = this.assessCacheability(type, modules);

      return {
        name: chunk.name,
        size: chunk.size || 0,
        gzippedSize: this.estimateGzipSize(chunk.size || 0),
        modules,
        dependencies,
        type,
        cacheability
      };
    });
  }

  /**
   * Analyze dependencies for size impact and tree-shaking opportunities
   */
  private analyzeDependencies(modules: any[]): DependencyInfo[] {
    const depMap = new Map<string, DependencyInfo>();

    modules.forEach(module => {
      if (module.name?.includes('node_modules')) {
        const depName = this.extractDependencyName(module.name);
        if (depName) {
          const existing = depMap.get(depName);
          const size = module.size || 0;

          if (existing) {
            existing.size += size;
            existing.gzippedSize += this.estimateGzipSize(size);
          } else {
            depMap.set(depName, {
              name: depName,
              version: 'unknown',
              size: size,
              gzippedSize: this.estimateGzipSize(size),
              isTreeShakeable: this.checkTreeShakeable(depName),
              usage: this.assessDependencyUsage(depName, modules),
              impactScore: this.calculateImpactScore(depName, size)
            });
          }
        }
      }
    });

    return Array.from(depMap.values()).sort((a, b) => b.size - a.size);
  }

  /**
   * Analyze static assets for optimization opportunities
   */
  private analyzeAssets(assets: any[]): AssetInfo[] {
    return assets.map(asset => {
      const type = this.getAssetType(asset.name);
      const optimizable = this.isAssetOptimizable(asset.name, asset.size);
      const compressionRatio = this.estimateCompressionRatio(type, asset.size);

      return {
        name: asset.name,
        size: asset.size || 0,
        type,
        optimizable,
        compressionRatio
      };
    });
  }

  /**
   * Check performance budget violations
   */
  private checkPerformanceBudget(metrics: BundleMetrics): PerformanceBudget {
    const warnings: BudgetWarning[] = [];

    // Check total size
    if (metrics.totalSize > this.budgetConfig.maxTotalSize) {
      warnings.push({
        type: 'size',
        severity: 'error',
        message: `Total bundle size (${this.formatSize(metrics.totalSize)}) exceeds budget (${this.formatSize(this.budgetConfig.maxTotalSize)})`,
        recommendation: 'Consider code splitting, tree shaking, or removing unused dependencies',
        affectedItems: ['total-bundle']
      });
    }

    // Check individual chunk sizes
    metrics.chunks.forEach(chunk => {
      if (chunk.size > this.budgetConfig.maxChunkSize) {
        warnings.push({
          type: 'size',
          severity: 'warning',
          message: `Chunk "${chunk.name}" (${this.formatSize(chunk.size)}) exceeds budget (${this.formatSize(this.budgetConfig.maxChunkSize)})`,
          recommendation: 'Split large chunks or optimize heavy dependencies',
          affectedItems: [chunk.name]
        });
      }
    });

    // Check initial load budget
    const initialLoadSize = this.calculateInitialLoadSize(metrics.chunks);
    if (initialLoadSize > this.budgetConfig.maxInitialLoad) {
      warnings.push({
        type: 'size',
        severity: 'error',
        message: `Initial load size (${this.formatSize(initialLoadSize)}) exceeds budget (${this.formatSize(this.budgetConfig.maxInitialLoad)})`,
        recommendation: 'Implement lazy loading for non-critical routes',
        affectedItems: ['initial-load']
      });
    }

    return {
      ...this.budgetConfig,
      warnings
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(metrics: BundleMetrics, budget: PerformanceBudget): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze large dependencies
    const largeDeps = metrics.dependencies.filter(dep => dep.size > 50 * 1024);
    largeDeps.forEach(dep => {
      recommendations.push({
        type: 'tree-shaking',
        priority: 'high',
        impact: 'major',
        description: `Large dependency: ${dep.name} (${this.formatSize(dep.size)})`,
        implementation: dep.isTreeShakeable
          ? `Enable tree-shaking for ${dep.name} by importing only used modules`
          : `Consider replacing ${dep.name} with a lighter alternative`,
        estimatedSaving: dep.isTreeShakeable ? dep.size * 0.3 : dep.size * 0.1
      });
    });

    // Analyze chunk splitting opportunities
    const largeChunks = metrics.chunks.filter(chunk => chunk.size > this.budgetConfig.maxChunkSize);
    largeChunks.forEach(chunk => {
      recommendations.push({
        type: 'chunk-splitting',
        priority: 'medium',
        impact: 'moderate',
        description: `Large chunk: ${chunk.name} (${this.formatSize(chunk.size)})`,
        implementation: 'Split chunk into smaller, more cacheable pieces based on usage patterns',
        estimatedSaving: chunk.size * 0.2
      });
    });

    // Analyze compression opportunities
    const uncompressedAssets = metrics.assets.filter(asset => asset.optimizable);
    if (uncompressedAssets.length > 0) {
      recommendations.push({
        type: 'compression',
        priority: 'medium',
        impact: 'moderate',
        description: `${uncompressedAssets.length} assets can be better compressed`,
        implementation: 'Enable Brotli compression and optimize image formats',
        estimatedSaving: uncompressedAssets.reduce((sum, asset) => sum + asset.size * 0.3, 0)
      });
    }

    return recommendations.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      return priorityScore[b.priority] - priorityScore[a.priority];
    });
  }

  /**
   * Compare with previous build
   */
  private async compareWithPrevious(metrics: BundleMetrics): Promise<ComparisonData | undefined> {
    try {
      const history = await this.loadHistory();
      if (history.length === 0) return undefined;

      const previousBuild = history[history.length - 1];
      const sizeChange = metrics.totalSize - previousBuild.totalSize;
      const chunkChanges = this.compareChunks(metrics.chunks, previousBuild.chunks);

      return {
        previousBuild,
        sizeChange,
        chunkChanges,
        regressions: chunkChanges.filter(c => c.change > 0).map(c => c.name),
        improvements: chunkChanges.filter(c => c.change < 0).map(c => c.name)
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Calculate overall performance score
   */
  private calculateScore(metrics: BundleMetrics, budget: PerformanceBudget): number {
    let score = 100;

    // Deduct points for budget violations
    budget.warnings.forEach(warning => {
      switch (warning.severity) {
        case 'error': score -= 20; break;
        case 'warning': score -= 10; break;
        case 'info': score -= 5; break;
      }
    });

    // Deduct points for inefficiencies
    const compressionEfficiency = metrics.gzippedSize / metrics.totalSize;
    if (compressionEfficiency > 0.8) score -= 10;

    const chunkCountPenalty = Math.max(0, metrics.chunkCount - 10) * 2;
    score -= chunkCountPenalty;

    return Math.max(0, score);
  }

  // Utility methods
  private estimateGzipSize(size: number): number {
    return Math.round(size * 0.3); // Rough estimate
  }

  private categorizeChunk(name: string, modules: string[]): ChunkInfo['type'] {
    if (name.includes('vendor') || modules.some(m => m.includes('node_modules'))) return 'vendor';
    if (name.includes('runtime')) return 'runtime';
    if (name.includes('main') || name.includes('index')) return 'entry';
    return 'async';
  }

  private assessCacheability(type: ChunkInfo['type'], modules: string[]): ChunkInfo['cacheability'] {
    if (type === 'vendor') return 'high';
    if (type === 'runtime' || modules.some(m => m.includes('src/components'))) return 'medium';
    return 'low';
  }

  private extractDependencyName(moduleName: string): string | null {
    const match = moduleName.match(/node_modules\/(@?[^\/]+(?:\/[^\/]+)?)/);
    return match ? match[1] : null;
  }

  private checkTreeShakeable(depName: string): boolean {
    const treeShakeableLibs = ['lodash-es', 'date-fns', '@radix-ui', 'lucide-react'];
    return treeShakeableLibs.some(lib => depName.includes(lib));
  }

  private assessDependencyUsage(depName: string, modules: any[]): DependencyInfo['usage'] {
    const usageCount = modules.filter(m => m.name?.includes(depName)).length;
    if (usageCount === 0) return 'unused';
    if (usageCount === 1) return 'optional';
    if (usageCount < 5) return 'important';
    return 'critical';
  }

  private calculateImpactScore(depName: string, size: number): number {
    const criticalDeps = ['react', 'react-dom', 'react-router-dom'];
    const baseScore = size / 1024; // Size in KB
    const isCritical = criticalDeps.some(dep => depName.includes(dep));
    return isCritical ? baseScore * 0.5 : baseScore; // Lower impact for critical deps
  }

  private getAssetType(name: string): AssetInfo['type'] {
    if (/\.(png|jpe?g|gif|svg|webp)$/i.test(name)) return 'image';
    if (/\.(woff2?|ttf|eot|otf)$/i.test(name)) return 'font';
    if (/\.css$/i.test(name)) return 'css';
    if (/\.js$/i.test(name)) return 'js';
    return 'other';
  }

  private isAssetOptimizable(name: string, size: number): boolean {
    const type = this.getAssetType(name);
    if (type === 'image' && size > 10 * 1024) return true; // Images > 10KB
    if (type === 'font' && !name.includes('.woff2')) return true; // Non-WOFF2 fonts
    return false;
  }

  private estimateCompressionRatio(type: AssetInfo['type'], size: number): number {
    const ratios = { image: 0.8, font: 0.7, css: 0.3, js: 0.3, other: 0.5 };
    return ratios[type] || 0.5;
  }

  private calculateInitialLoadSize(chunks: ChunkInfo[]): number {
    return chunks
      .filter(chunk => chunk.type === 'entry' || chunk.type === 'runtime')
      .reduce((sum, chunk) => sum + chunk.size, 0);
  }

  private compareChunks(current: ChunkInfo[], previous: ChunkInfo[]): ChunkComparison[] {
    const comparisons: ChunkComparison[] = [];
    const prevMap = new Map(previous.map(c => [c.name, c]));

    current.forEach(chunk => {
      const prev = prevMap.get(chunk.name);
      if (prev) {
        const change = chunk.size - prev.size;
        const changePercent = (change / prev.size) * 100;
        comparisons.push({
          name: chunk.name,
          oldSize: prev.size,
          newSize: chunk.size,
          change,
          changePercent
        });
      }
    });

    return comparisons;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  private async loadHistory(): Promise<BundleMetrics[]> {
    try {
      const fs = await import('fs');
      const data = await fs.promises.readFile(this.historyPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveToHistory(metrics: BundleMetrics): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');

      const history = await this.loadHistory();
      history.push(metrics);

      // Keep only recent entries
      if (history.length > this.maxHistoryEntries) {
        history.splice(0, history.length - this.maxHistoryEntries);
      }

      await fs.promises.mkdir(path.dirname(this.historyPath), { recursive: true });
      await fs.promises.writeFile(this.historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.warn('Failed to save bundle history:', error.message);
    }
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(report: AnalysisReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>CourtMaster Bundle Analysis Report</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #667eea; padding-bottom: 1rem; margin-bottom: 2rem; }
        .score { font-size: 3rem; font-weight: bold; color: ${report.score >= 80 ? '#10b981' : report.score >= 60 ? '#f59e0b' : '#ef4444'}; }
        .metric { display: inline-block; margin: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px; }
        .warning { padding: 0.5rem; margin: 0.5rem 0; border-left: 4px solid #ef4444; background: #fef2f2; }
        .recommendation { padding: 1rem; margin: 1rem 0; border-left: 4px solid #667eea; background: #f0f7ff; }
        .chunk { padding: 0.5rem; margin: 0.25rem 0; background: #f8f9fa; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CourtMaster Bundle Analysis</h1>
            <div class="score">${report.score}/100</div>
            <p>Generated: ${new Date(report.metrics.timestamp).toLocaleString()}</p>
        </div>

        <section>
            <h2>Bundle Metrics</h2>
            <div class="metric">
                <h3>Total Size</h3>
                <div>${this.formatSize(report.metrics.totalSize)}</div>
            </div>
            <div class="metric">
                <h3>Gzipped Size</h3>
                <div>${this.formatSize(report.metrics.gzippedSize)}</div>
            </div>
            <div class="metric">
                <h3>Chunks</h3>
                <div>${report.metrics.chunkCount}</div>
            </div>
        </section>

        <section>
            <h2>Budget Violations</h2>
            ${report.budget.warnings.map(warning => `
                <div class="warning">
                    <strong>${warning.severity.toUpperCase()}:</strong> ${warning.message}
                    <br><em>Recommendation: ${warning.recommendation}</em>
                </div>
            `).join('')}
        </section>

        <section>
            <h2>Optimization Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation">
                    <h4>${rec.type} (${rec.priority} priority)</h4>
                    <p>${rec.description}</p>
                    <p><strong>Implementation:</strong> ${rec.implementation}</p>
                    <p><strong>Estimated Saving:</strong> ${this.formatSize(rec.estimatedSaving)}</p>
                </div>
            `).join('')}
        </section>

        <section>
            <h2>Chunk Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Chunk</th>
                        <th>Size</th>
                        <th>Gzipped</th>
                        <th>Type</th>
                        <th>Cacheability</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.metrics.chunks.map(chunk => `
                        <tr>
                            <td>${chunk.name}</td>
                            <td>${this.formatSize(chunk.size)}</td>
                            <td>${this.formatSize(chunk.gzippedSize)}</td>
                            <td>${chunk.type}</td>
                            <td>${chunk.cacheability}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>

        <section>
            <h2>Dependencies</h2>
            <table>
                <thead>
                    <tr>
                        <th>Package</th>
                        <th>Size</th>
                        <th>Usage</th>
                        <th>Tree Shakeable</th>
                        <th>Impact Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.metrics.dependencies.slice(0, 20).map(dep => `
                        <tr>
                            <td>${dep.name}</td>
                            <td>${this.formatSize(dep.size)}</td>
                            <td>${dep.usage}</td>
                            <td>${dep.isTreeShakeable ? 'Yes' : 'No'}</td>
                            <td>${dep.impactScore.toFixed(1)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>
    </div>
</body>
</html>`;
  }
}

export { BundleAnalyzer, type AnalysisReport, type BundleMetrics, type PerformanceBudget };