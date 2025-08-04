/**
 * Enhanced Bundle Analyzer for Performance Optimization
 * 
 * Comprehensive bundle analysis with:
 * - Bundle size optimization
 * - Tree shaking analysis  
 * - Duplicate detection
 * - Performance impact assessment
 * - CI/CD integration
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BundleAnalyzer {
  constructor(options = {}) {
    this.options = {
      buildDir: '.next',
      reportDir: './test-results/bundle-analysis',
      thresholds: {
        maxBundleSize: 250000,      // 250KB
        maxChunkSize: 100000,       // 100KB
        maxGzipSize: 70000,         // 70KB gzipped
        maxAssetSize: 500000,       // 500KB for assets
        totalSizeWarning: 1000000,  // 1MB total warning
        totalSizeError: 2000000     // 2MB total error
      },
      excludePatterns: [
        '**/_buildManifest.js',
        '**/_ssgManifest.js',
        '**/node_modules/**',
        '**/*.map'
      ],
      ...options
    };
    
    this.analysis = {
      bundles: [],
      chunks: [],
      assets: [],
      summary: {}
    };
  }

  async initialize() {
    await fs.mkdir(this.options.reportDir, { recursive: true });
    console.log('📦 Bundle Analyzer initialized');
  }

  // Analyze Next.js build output
  async analyzeNextJsBuild() {
    const buildPath = path.join(process.cwd(), this.options.buildDir);
    
    try {
      // Read build manifest
      const buildManifest = await this.readBuildManifest(buildPath);
      
      // Analyze static chunks
      await this.analyzeStaticChunks(buildPath);
      
      // Analyze page bundles
      await this.analyzePageBundles(buildPath);
      
      // Analyze assets
      await this.analyzeAssets(buildPath);
      
      return this.analysis;
    } catch (error) {
      console.error('❌ Build analysis failed:', error.message);
      throw error;
    }
  }

  async readBuildManifest(buildPath) {
    try {
      const manifestPath = path.join(buildPath, 'build-manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(manifestContent);
    } catch (error) {
      console.warn('⚠️ Build manifest not found, proceeding with file system analysis');
      return null;
    }
  }

  async analyzeStaticChunks(buildPath) {
    const staticPath = path.join(buildPath, 'static');
    const chunkFiles = glob.sync('**/*.js', { cwd: staticPath });
    
    for (const file of chunkFiles) {
      const filePath = path.join(staticPath, file);
      await this.analyzeFile(filePath, 'chunk');
    }
  }

  async analyzePageBundles(buildPath) {
    const serverPath = path.join(buildPath, 'server/pages');
    
    if (await this.pathExists(serverPath)) {
      const pageFiles = glob.sync('**/*.js', { cwd: serverPath });
      
      for (const file of pageFiles) {
        const filePath = path.join(serverPath, file);
        await this.analyzeFile(filePath, 'page');
      }
    }
  }

  async analyzeAssets(buildPath) {
    const staticPath = path.join(buildPath, 'static');
    const assetFiles = glob.sync('**/*.{css,png,jpg,jpeg,gif,svg,woff,woff2}', { cwd: staticPath });
    
    for (const file of assetFiles) {
      const filePath = path.join(staticPath, file);
      await this.analyzeFile(filePath, 'asset');
    }
  }

  async analyzeFile(filePath, type) {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath);
      
      const analysis = {
        path: filePath,
        name: path.basename(filePath),
        type,
        size: stats.size,
        gzipSize: type === 'asset' ? null : await gzipSize(content),
        humanSize: fileSize(stats.size).human('si'),
        humanGzipSize: type === 'asset' ? null : fileSize(await gzipSize(content)).human('si'),
        timestamp: stats.mtime,
        violations: []
      };

      // Check thresholds
      this.checkFileThresholds(analysis);
      
      // Store analysis
      if (type === 'chunk') {
        this.analysis.chunks.push(analysis);
      } else if (type === 'page') {
        this.analysis.bundles.push(analysis);
      } else {
        this.analysis.assets.push(analysis);
      }
      
    } catch (error) {
      console.warn(`⚠️ Failed to analyze ${filePath}:`, error.message);
    }
  }

  checkFileThresholds(analysis) {
    const { thresholds } = this.options;
    
    // Check uncompressed size
    if (analysis.size > thresholds.maxBundleSize && analysis.type !== 'asset') {
      analysis.violations.push({
        type: 'LARGE_BUNDLE',
        threshold: thresholds.maxBundleSize,
        actual: analysis.size,
        severity: analysis.size > thresholds.maxBundleSize * 2 ? 'error' : 'warning'
      });
    }
    
    // Check gzipped size
    if (analysis.gzipSize && analysis.gzipSize > thresholds.maxGzipSize) {
      analysis.violations.push({
        type: 'LARGE_GZIP',
        threshold: thresholds.maxGzipSize,
        actual: analysis.gzipSize,
        severity: 'warning'
      });
    }
    
    // Check asset size
    if (analysis.type === 'asset' && analysis.size > thresholds.maxAssetSize) {
      analysis.violations.push({
        type: 'LARGE_ASSET',
        threshold: thresholds.maxAssetSize,
        actual: analysis.size,
        severity: 'warning'
      });
    }
  }

  // Generate bundle size report
  generateSizeReport() {
    const totalSize = this.calculateTotalSize();
    const totalGzipSize = this.calculateTotalGzipSize();
    
    this.analysis.summary = {
      totalFiles: this.analysis.bundles.length + this.analysis.chunks.length + this.analysis.assets.length,
      totalSize,
      totalGzipSize,
      humanTotalSize: fileSize(totalSize).human('si'),
      humanTotalGzipSize: fileSize(totalGzipSize).human('si'),
      compressionRatio: ((totalSize - totalGzipSize) / totalSize * 100).toFixed(1),
      violations: this.getAllViolations(),
      timestamp: new Date().toISOString()
    };

    return this.analysis.summary;
  }

  calculateTotalSize() {
    return [
      ...this.analysis.bundles,
      ...this.analysis.chunks,
      ...this.analysis.assets
    ].reduce((total, file) => total + file.size, 0);
  }

  calculateTotalGzipSize() {
    return [
      ...this.analysis.bundles,
      ...this.analysis.chunks
    ].reduce((total, file) => total + (file.gzipSize || 0), 0);
  }

  getAllViolations() {
    const allFiles = [
      ...this.analysis.bundles,
      ...this.analysis.chunks,
      ...this.analysis.assets
    ];
    
    return allFiles.reduce((violations, file) => {
      return violations.concat(file.violations.map(violation => ({
        ...violation,
        file: file.name,
        path: file.path
      })));
    }, []);
  }

  // Find largest files
  findLargestFiles(count = 10) {
    const allFiles = [
      ...this.analysis.bundles,
      ...this.analysis.chunks,
      ...this.analysis.assets
    ];
    
    return allFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, count)
      .map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        humanSize: file.humanSize,
        gzipSize: file.gzipSize,
        humanGzipSize: file.humanGzipSize
      }));
  }

  // Bundle optimization suggestions
  generateOptimizationSuggestions() {
    const suggestions = [];
    const violations = this.getAllViolations();
    
    // Large bundle suggestions
    const largeBundles = violations.filter(v => v.type === 'LARGE_BUNDLE');
    if (largeBundles.length > 0) {
      suggestions.push({
        category: 'Bundle Size',
        priority: 'high',
        description: 'Consider code splitting and lazy loading for large bundles',
        files: largeBundles.map(v => v.file),
        techniques: [
          'Dynamic imports for non-critical code',
          'Route-based code splitting',
          'Component-level lazy loading',
          'Tree shaking optimization'
        ]
      });
    }
    
    // Large asset suggestions
    const largeAssets = violations.filter(v => v.type === 'LARGE_ASSET');
    if (largeAssets.length > 0) {
      suggestions.push({
        category: 'Asset Optimization',
        priority: 'medium',
        description: 'Optimize large assets to reduce load times',
        files: largeAssets.map(v => v.file),
        techniques: [
          'Image compression and modern formats (WebP, AVIF)',
          'Font subsetting and preloading',
          'CSS optimization and purging',
          'Asset bundling and CDN usage'
        ]
      });
    }
    
    // Compression suggestions
    const totalSize = this.analysis.summary.totalSize;
    const compressionRatio = parseFloat(this.analysis.summary.compressionRatio);
    
    if (compressionRatio < 60) {
      suggestions.push({
        category: 'Compression',
        priority: 'medium',
        description: 'Improve compression ratio for better performance',
        techniques: [
          'Enable Brotli compression',
          'Optimize Webpack compression settings',
          'Minify and uglify JavaScript/CSS',
          'Remove dead code and comments'
        ]
      });
    }
    
    return suggestions;
  }

  // Generate detailed console report
  printReport() {
    const summary = this.analysis.summary;
    const violations = summary.violations;
    const suggestions = this.generateOptimizationSuggestions();
    
    console.log(chalk.blue('\n📦 Bundle Analysis Report'));
    console.log(chalk.blue('========================\n'));
    
    // Summary
    console.log(chalk.green('📊 Summary:'));
    console.log(`   Total Files: ${summary.totalFiles}`);
    console.log(`   Total Size: ${chalk.yellow(summary.humanTotalSize)}`);
    console.log(`   Gzipped: ${chalk.yellow(summary.humanTotalGzipSize)}`);
    console.log(`   Compression: ${chalk.yellow(summary.compressionRatio + '%')}\n`);
    
    // Violations
    if (violations.length > 0) {
      console.log(chalk.red('⚠️ Issues Found:'));
      violations.forEach(violation => {
        const color = violation.severity === 'error' ? chalk.red : chalk.yellow;
        console.log(`   ${color('●')} ${violation.file}: ${violation.type}`);
        console.log(`     Actual: ${fileSize(violation.actual).human('si')}, Threshold: ${fileSize(violation.threshold).human('si')}`);
      });
      console.log('');
    } else {
      console.log(chalk.green('✅ No size violations found\n'));
    }
    
    // Largest files
    const largestFiles = this.findLargestFiles(5);
    console.log(chalk.blue('📈 Largest Files:'));
    largestFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${file.type}): ${chalk.yellow(file.humanSize)}`);
    });
    console.log('');
    
    // Optimization suggestions
    if (suggestions.length > 0) {
      console.log(chalk.blue('💡 Optimization Suggestions:'));
      suggestions.forEach(suggestion => {
        const priorityColor = suggestion.priority === 'high' ? chalk.red : chalk.yellow;
        console.log(`   ${priorityColor('●')} ${suggestion.category}: ${suggestion.description}`);
        suggestion.techniques.forEach(technique => {
          console.log(`     - ${technique}`);
        });
        console.log('');
      });
    }
  }

  // Save detailed report to file
  async saveReport() {
    const reportPath = path.join(this.options.reportDir, `bundle-analysis-${Date.now()}.json`);
    const report = {
      ...this.analysis,
      optimizationSuggestions: this.generateOptimizationSuggestions(),
      largestFiles: this.findLargestFiles(20)
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Save CSV summary
    const csvPath = path.join(this.options.reportDir, `bundle-summary-${Date.now()}.csv`);
    await this.saveCsvReport(csvPath);
    
    console.log(`📄 Detailed report saved: ${reportPath}`);
    console.log(`📊 CSV summary saved: ${csvPath}`);
    
    return reportPath;
  }

  async saveCsvReport(csvPath) {
    const allFiles = [
      ...this.analysis.bundles,
      ...this.analysis.chunks,
      ...this.analysis.assets
    ];
    
    const csvHeader = 'Name,Type,Size,Gzipped,Human Size,Human Gzipped,Violations\n';
    const csvRows = allFiles.map(file => {
      return [
        file.name,
        file.type,
        file.size,
        file.gzipSize || '',
        file.humanSize,
        file.humanGzipSize || '',
        file.violations.length
      ].join(',');
    }).join('\n');
    
    await fs.writeFile(csvPath, csvHeader + csvRows);
  }

  async pathExists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  // Main analysis method
  async analyze() {
    await this.initialize();
    await this.analyzeNextJsBuild();
    this.generateSizeReport();
    this.printReport();
    await this.saveReport();
    
    return this.analysis;
  }
}

module.exports = BundleAnalyzer;

// CLI usage
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(console.error);
}