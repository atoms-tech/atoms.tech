/**
 * Performance Regression Detection System
 * Automated detection and alerting for performance degradations
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class PerformanceRegressionDetector {
  constructor(options = {}) {
    this.options = {
      baselineDir: './test-results/performance-baselines',
      reportsDir: './test-results/performance-reports',
      thresholds: {
        lighthouse: {
          performance: 5,     // 5 point drop
          accessibility: 3,
          bestPractices: 3,
          seo: 3
        },
        webVitals: {
          lcp: 500,          // 500ms increase
          fid: 50,           // 50ms increase
          cls: 0.05,         // 0.05 increase
          inp: 100           // 100ms increase
        },
        bundleSize: {
          total: 100000,     // 100KB increase
          javascript: 50000,  // 50KB increase
          css: 10000         // 10KB increase
        },
        memory: {
          growth: 20,        // 20% increase in growth
          peak: 50 * 1024 * 1024  // 50MB increase in peak
        }
      },
      alertingEnabled: true,
      retentionDays: 30,
      minimumSamples: 3,
      confidenceLevel: 0.95,
      ...options
    };
    
    this.regressions = [];
    this.baseline = null;
    this.currentMetrics = null;
  }

  async initialize() {
    await fs.mkdir(this.options.baselineDir, { recursive: true });
    await fs.mkdir(this.options.reportsDir, { recursive: true });
    
    console.log('🔍 Performance Regression Detector initialized');
  }

  // Load baseline metrics
  async loadBaseline(testSuite = 'default') {
    const baselinePath = path.join(this.options.baselineDir, `baseline-${testSuite}.json`);
    
    try {
      const baselineData = await fs.readFile(baselinePath, 'utf-8');
      this.baseline = JSON.parse(baselineData);
      
      console.log(`📊 Loaded baseline: ${testSuite} (${this.baseline.samples?.length || 1} samples)`);
      return this.baseline;
    } catch (error) {
      console.warn(`⚠️ No baseline found for ${testSuite}, will create new baseline`);
      return null;
    }
  }

  // Save new baseline
  async saveBaseline(metrics, testSuite = 'default') {
    const baselinePath = path.join(this.options.baselineDir, `baseline-${testSuite}.json`);
    
    const baseline = {
      testSuite,
      timestamp: new Date().toISOString(),
      metrics,
      samples: [metrics],
      statistics: this.calculateStatistics([metrics])
    };
    
    await fs.writeFile(baselinePath, JSON.stringify(baseline, null, 2));
    
    console.log(`💾 Saved baseline: ${testSuite}`);
    this.baseline = baseline;
    
    return baseline;
  }

  // Update baseline with new sample
  async updateBaseline(metrics, testSuite = 'default') {
    if (!this.baseline) {
      return await this.saveBaseline(metrics, testSuite);
    }
    
    // Add new sample
    this.baseline.samples.push(metrics);
    
    // Keep only recent samples (retention policy)
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.options.retentionDays);
    
    this.baseline.samples = this.baseline.samples.filter(sample => 
      new Date(sample.timestamp) > retentionDate
    );
    
    // Recalculate statistics
    this.baseline.statistics = this.calculateStatistics(this.baseline.samples);
    this.baseline.timestamp = new Date().toISOString();
    
    // Save updated baseline
    const baselinePath = path.join(this.options.baselineDir, `baseline-${testSuite}.json`);
    await fs.writeFile(baselinePath, JSON.stringify(this.baseline, null, 2));
    
    return this.baseline;
  }

  // Calculate statistical measures
  calculateStatistics(samples) {
    if (samples.length === 0) return null;
    
    const metrics = {
      lighthouse: [],
      webVitals: {},
      bundleSize: {},
      memory: {}
    };
    
    // Extract metrics from samples
    samples.forEach(sample => {
      // Lighthouse scores
      if (sample.lighthouse) {
        metrics.lighthouse.push(sample.lighthouse.performanceScore || 0);
      }
      
      // Web Vitals
      if (sample.webVitals?.coreWebVitals) {
        sample.webVitals.coreWebVitals.forEach(vital => {
          const name = vital.name.toLowerCase();
          if (!metrics.webVitals[name]) metrics.webVitals[name] = [];
          metrics.webVitals[name].push(vital.value);
        });
      }
      
      // Bundle size
      if (sample.bundleAnalysis?.summary) {
        const bundle = sample.bundleAnalysis.summary;
        if (!metrics.bundleSize.total) metrics.bundleSize.total = [];
        if (!metrics.bundleSize.javascript) metrics.bundleSize.javascript = [];
        if (!metrics.bundleSize.css) metrics.bundleSize.css = [];
        
        metrics.bundleSize.total.push(bundle.totalSize || 0);
        // Additional bundle metrics would be extracted here
      }
      
      // Memory metrics
      if (sample.memoryAnalysis?.memoryStats) {
        const memory = sample.memoryAnalysis.memoryStats;
        if (!metrics.memory.growth) metrics.memory.growth = [];
        if (!metrics.memory.peak) metrics.memory.peak = [];
        
        metrics.memory.growth.push(memory.growthPercentage || 0);
        metrics.memory.peak.push(memory.max || 0);
      }
    });
    
    // Calculate statistics for each metric
    const statistics = {};
    
    Object.keys(metrics).forEach(category => {
      statistics[category] = {};
      
      if (Array.isArray(metrics[category])) {
        statistics[category] = this.calculateArrayStats(metrics[category]);
      } else {
        Object.keys(metrics[category]).forEach(metric => {
          statistics[category][metric] = this.calculateArrayStats(metrics[category][metric]);
        });
      }
    });
    
    return statistics;
  }

  calculateArrayStats(values) {
    if (values.length === 0) return null;
    
    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    // Calculate variance and standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: mean,
      median: values.length % 2 === 0 ? 
        (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2 : 
        sorted[Math.floor(values.length / 2)],
      p90: sorted[Math.floor(values.length * 0.9)],
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)],
      stdDev: stdDev,
      variance: variance
    };
  }

  // Detect regressions by comparing current metrics with baseline
  async detectRegressions(currentMetrics, testSuite = 'default') {
    this.currentMetrics = currentMetrics;
    
    if (!this.baseline) {
      await this.loadBaseline(testSuite);
    }
    
    if (!this.baseline || this.baseline.samples.length < this.options.minimumSamples) {
      console.log('📈 Insufficient baseline data, adding to baseline...');
      await this.updateBaseline(currentMetrics, testSuite);
      return { regressions: [], status: 'baseline-updated' };
    }
    
    this.regressions = [];
    
    // Check Lighthouse regressions
    this.checkLighthouseRegressions();
    
    // Check Web Vitals regressions
    this.checkWebVitalsRegressions();
    
    // Check Bundle Size regressions
    this.checkBundleSizeRegressions();
    
    // Check Memory regressions
    this.checkMemoryRegressions();
    
    // Generate regression report
    const report = await this.generateRegressionReport(testSuite);
    
    // Send alerts if enabled
    if (this.options.alertingEnabled && this.regressions.length > 0) {
      await this.sendAlerts(report);
    }
    
    return report;
  }

  checkLighthouseRegressions() {
    if (!this.currentMetrics.lighthouse || !this.baseline.statistics.lighthouse) return;
    
    const current = this.currentMetrics.lighthouse.performanceScore || 0;
    const baseline = this.baseline.statistics.lighthouse.mean || 0;
    const threshold = this.options.thresholds.lighthouse.performance;
    
    if (baseline - current > threshold) {
      this.regressions.push({
        category: 'lighthouse',
        metric: 'performance',
        type: 'score_drop',
        current: current,
        baseline: baseline,
        difference: baseline - current,
        threshold: threshold,
        severity: this.calculateSeverity(baseline - current, threshold),
        description: `Lighthouse performance score dropped by ${(baseline - current).toFixed(1)} points`
      });
    }
  }

  checkWebVitalsRegressions() {
    if (!this.currentMetrics.webVitals?.coreWebVitals || !this.baseline.statistics.webVitals) return;
    
    this.currentMetrics.webVitals.coreWebVitals.forEach(vital => {
      const metricName = vital.name.toLowerCase();
      const current = vital.value;
      const baselineStats = this.baseline.statistics.webVitals[metricName];
      
      if (!baselineStats) return;
      
      const baseline = baselineStats.mean;
      const threshold = this.options.thresholds.webVitals[metricName];
      
      if (threshold && current - baseline > threshold) {
        this.regressions.push({
          category: 'webVitals',
          metric: metricName,
          type: 'performance_degradation',
          current: current,
          baseline: baseline,
          difference: current - baseline,
          threshold: threshold,
          severity: this.calculateSeverity(current - baseline, threshold),
          description: `${vital.name} increased by ${(current - baseline).toFixed(1)}${metricName === 'cls' ? '' : 'ms'}`
        });
      }
    });
  }

  checkBundleSizeRegressions() {
    if (!this.currentMetrics.bundleAnalysis?.summary || !this.baseline.statistics.bundleSize) return;
    
    const current = this.currentMetrics.bundleAnalysis.summary.totalSize || 0;
    const baselineStats = this.baseline.statistics.bundleSize.total;
    
    if (!baselineStats) return;
    
    const baseline = baselineStats.mean;
    const threshold = this.options.thresholds.bundleSize.total;
    
    if (current - baseline > threshold) {
      this.regressions.push({
        category: 'bundleSize',
        metric: 'total',
        type: 'size_increase',
        current: current,
        baseline: baseline,
        difference: current - baseline,
        threshold: threshold,
        severity: this.calculateSeverity(current - baseline, threshold),
        description: `Total bundle size increased by ${this.formatBytes(current - baseline)}`
      });
    }
  }

  checkMemoryRegressions() {
    if (!this.currentMetrics.memoryAnalysis?.memoryStats || !this.baseline.statistics.memory) return;
    
    const current = this.currentMetrics.memoryAnalysis.memoryStats.growthPercentage || 0;
    const baselineStats = this.baseline.statistics.memory.growth;
    
    if (!baselineStats) return;
    
    const baseline = baselineStats.mean;
    const threshold = this.options.thresholds.memory.growth;
    
    if (current - baseline > threshold) {
      this.regressions.push({
        category: 'memory',
        metric: 'growth',
        type: 'memory_leak',
        current: current,
        baseline: baseline,
        difference: current - baseline,
        threshold: threshold,
        severity: this.calculateSeverity(current - baseline, threshold),
        description: `Memory growth increased by ${(current - baseline).toFixed(1)}%`
      });
    }
  }

  calculateSeverity(difference, threshold) {
    const ratio = difference / threshold;
    
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate comprehensive regression report
  async generateRegressionReport(testSuite) {
    const report = {
      testSuite,
      timestamp: new Date().toISOString(),
      regressions: this.regressions,
      summary: {
        totalRegressions: this.regressions.length,
        severityBreakdown: this.getRegressionSeverityBreakdown(),
        status: this.regressions.length > 0 ? 'regressions_detected' : 'no_regressions',
        overallSeverity: this.getOverallSeverity()
      },
      baseline: {
        samples: this.baseline?.samples?.length || 0,
        lastUpdated: this.baseline?.timestamp,
        statistics: this.baseline?.statistics
      },
      currentMetrics: this.currentMetrics,
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = path.join(
      this.options.reportsDir,
      `regression-report-${testSuite}-${Date.now()}.json`
    );
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Regression report saved: ${reportPath}`);
    
    return report;
  }

  getRegressionSeverityBreakdown() {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    
    this.regressions.forEach(regression => {
      breakdown[regression.severity]++;
    });
    
    return breakdown;
  }

  getOverallSeverity() {
    if (this.regressions.some(r => r.severity === 'critical')) return 'critical';
    if (this.regressions.some(r => r.severity === 'high')) return 'high';
    if (this.regressions.some(r => r.severity === 'medium')) return 'medium';
    if (this.regressions.length > 0) return 'low';
    return 'none';
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Group regressions by category
    const byCategory = this.regressions.reduce((acc, regression) => {
      if (!acc[regression.category]) acc[regression.category] = [];
      acc[regression.category].push(regression);
      return acc;
    }, {});
    
    Object.keys(byCategory).forEach(category => {
      const regressions = byCategory[category];
      
      switch (category) {
        case 'lighthouse':
          recommendations.push({
            category: 'Lighthouse Performance',
            priority: 'high',
            description: `${regressions.length} Lighthouse regression(s) detected`,
            actions: [
              'Review recent code changes for performance impact',
              'Run detailed Lighthouse audit to identify specific issues',
              'Check for new render-blocking resources',
              'Validate Core Web Vitals improvements'
            ]
          });
          break;
          
        case 'webVitals':
          recommendations.push({
            category: 'Core Web Vitals',
            priority: 'critical',
            description: `${regressions.length} Web Vitals regression(s) detected`,
            actions: [
              'Investigate layout shift sources if CLS regressed',
              'Check for new JavaScript blocking main thread if FID/INP regressed',
              'Review image loading strategies if LCP regressed',
              'Enable field monitoring for real user impact'
            ]
          });
          break;
          
        case 'bundleSize':
          recommendations.push({
            category: 'Bundle Size',
            priority: 'medium',
            description: `${regressions.length} bundle size regression(s) detected`,
            actions: [
              'Analyze bundle for new large dependencies',
              'Check for missing tree-shaking optimizations',
              'Review code splitting configuration',
              'Consider lazy loading for non-critical code'
            ]
          });
          break;
          
        case 'memory':
          recommendations.push({
            category: 'Memory Usage',
            priority: 'high',
            description: `${regressions.length} memory regression(s) detected`,
            actions: [
              'Review recent changes for memory leaks',
              'Check event listener cleanup',
              'Validate component unmounting behavior',
              'Monitor production memory usage'
            ]
          });
          break;
      }
    });
    
    return recommendations;
  }

  // Send alerts for regressions
  async sendAlerts(report) {
    if (report.regressions.length === 0) return;
    
    const alert = {
      timestamp: new Date().toISOString(),
      testSuite: report.testSuite,
      severity: report.summary.overallSeverity,
      regressionsCount: report.regressions.length,
      message: this.generateAlertMessage(report),
      details: report.regressions,
      reportUrl: `${this.options.reportsDir}/regression-report-${report.testSuite}-${Date.now()}.json`
    };
    
    // Log alert (in production, this would be sent to alerting systems)
    console.log('\n🚨 PERFORMANCE REGRESSION ALERT');
    console.log('================================');
    console.log(`Severity: ${alert.severity.toUpperCase()}`);
    console.log(`Test Suite: ${alert.testSuite}`);
    console.log(`Regressions: ${alert.regressionsCount}`);
    console.log(`Message: ${alert.message}\n`);
    
    // In production, implement actual alerting:
    // - Slack/Teams notifications
    // - Email alerts
    // - PagerDuty integration
    // - Custom webhooks
    
    return alert;
  }

  generateAlertMessage(report) {
    const { regressions, summary } = report;
    
    if (regressions.length === 1) {
      const regression = regressions[0];
      return `Performance regression detected: ${regression.description}`;
    }
    
    const severityBreakdown = summary.severityBreakdown;
    const parts = [];
    
    if (severityBreakdown.critical > 0) parts.push(`${severityBreakdown.critical} critical`);
    if (severityBreakdown.high > 0) parts.push(`${severityBreakdown.high} high`);
    if (severityBreakdown.medium > 0) parts.push(`${severityBreakdown.medium} medium`);
    if (severityBreakdown.low > 0) parts.push(`${severityBreakdown.low} low`);
    
    return `${regressions.length} performance regressions detected (${parts.join(', ')})`;
  }

  // Compare two test runs for regression analysis
  async compareTestRuns(currentRunPath, baselineRunPath) {
    try {
      const currentData = JSON.parse(await fs.readFile(currentRunPath, 'utf-8'));
      const baselineData = JSON.parse(await fs.readFile(baselineRunPath, 'utf-8'));
      
      this.currentMetrics = currentData;
      this.baseline = { statistics: this.calculateStatistics([baselineData]) };
      
      return await this.detectRegressions(currentData, 'comparison');
    } catch (error) {
      throw new Error(`Failed to compare test runs: ${error.message}`);
    }
  }

  // Clean up old reports and baselines
  async cleanup() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionDays);
    
    // Clean up old reports
    const reportFiles = await fs.readdir(this.options.reportsDir);
    
    for (const file of reportFiles) {
      const filePath = path.join(this.options.reportsDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        console.log(`🗑️ Cleaned up old report: ${file}`);
      }
    }
  }
}

module.exports = PerformanceRegressionDetector;

// CLI usage
if (require.main === module) {
  const detector = new PerformanceRegressionDetector();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'detect':
      // Example: node performance-regression-detector.js detect ./current-results.json
      const metricsPath = args[1];
      if (!metricsPath) {
        console.error('Usage: node performance-regression-detector.js detect <metrics-file>');
        process.exit(1);
      }
      
      detector.initialize().then(async () => {
        const metrics = JSON.parse(await fs.readFile(metricsPath, 'utf-8'));
        const report = await detector.detectRegressions(metrics);
        console.log(JSON.stringify(report, null, 2));
      });
      break;
      
    case 'compare':
      // Example: node performance-regression-detector.js compare ./current.json ./baseline.json
      const [currentPath, baselinePath] = args.slice(1);
      if (!currentPath || !baselinePath) {
        console.error('Usage: node performance-regression-detector.js compare <current-file> <baseline-file>');
        process.exit(1);
      }
      
      detector.initialize().then(async () => {
        const report = await detector.compareTestRuns(currentPath, baselinePath);
        console.log(JSON.stringify(report, null, 2));
      });
      break;
      
    case 'cleanup':
      detector.initialize().then(() => detector.cleanup());
      break;
      
    default:
      console.log('Usage: node performance-regression-detector.js <command>');
      console.log('Commands:');
      console.log('  detect <metrics-file>     - Detect regressions in metrics file');
      console.log('  compare <current> <base>  - Compare two test runs');
      console.log('  cleanup                   - Clean up old reports');
  }
}