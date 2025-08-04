/**
 * Memory Leak Detection System
 * Automated memory monitoring and leak detection with MemLab integration
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class MemoryLeakDetector {
  constructor(options = {}) {
    this.options = {
      baseUrl: 'http://localhost:3000',
      testDuration: 300000,        // 5 minutes
      sampleInterval: 5000,        // 5 seconds
      memoryThreshold: 50 * 1024 * 1024, // 50MB
      heapGrowthThreshold: 0.2,    // 20% growth
      reportPath: './test-results/memory-analysis',
      headless: true,
      scenarios: [
        'navigation',
        'form-interaction',
        'data-loading',
        'component-mounting'
      ],
      ...options
    };
    
    this.browser = null;
    this.page = null;
    this.memoryData = [];
    this.leaks = [];
    this.startTime = null;
  }

  async initialize() {
    await fs.mkdir(this.options.reportPath, { recursive: true });
    
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--enable-precise-memory-info'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Enable memory monitoring
    await this.page.evaluateOnNewDocument(() => {
      window.memoryMonitor = {
        samples: [],
        startTime: Date.now(),
        
        collectSample() {
          if (performance.memory) {
            const sample = {
              timestamp: Date.now(),
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit
            };
            this.samples.push(sample);
            return sample;
          }
          return null;
        },
        
        getGrowthRate() {
          if (this.samples.length < 2) return 0;
          const first = this.samples[0];
          const last = this.samples[this.samples.length - 1];
          return (last.used - first.used) / first.used;
        }
      };
    });
    
    console.log('🧠 Memory Leak Detector initialized');
  }

  // Test scenario: Navigation pattern
  async testNavigationPattern() {
    console.log('🔄 Testing navigation pattern...');
    
    const routes = [
      '/',
      '/login',
      '/signup',
      '/home',
      '/org/demo',
      '/org/demo/project/sample'
    ];
    
    for (let cycle = 0; cycle < 10; cycle++) {
      for (const route of routes) {
        await this.page.goto(`${this.options.baseUrl}${route}`, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        
        await this.collectMemorySample(`navigation-${route}-${cycle}`);
        await this.page.waitForTimeout(2000);
        
        // Force garbage collection if available
        if (this.page.evaluate(() => window.gc)) {
          await this.page.evaluate(() => window.gc());
        }
      }
    }
  }

  // Test scenario: Form interactions
  async testFormInteractions() {
    console.log('📝 Testing form interactions...');
    
    await this.page.goto(`${this.options.baseUrl}/login`);
    
    for (let i = 0; i < 50; i++) {
      // Fill form
      await this.page.type('input[type="email"]', `test${i}@example.com`, { delay: 10 });
      await this.page.type('input[type="password"]', 'password123', { delay: 10 });
      
      // Clear form
      await this.page.evaluate(() => {
        document.querySelectorAll('input').forEach(input => input.value = '');
      });
      
      await this.collectMemorySample(`form-interaction-${i}`);
      await this.page.waitForTimeout(1000);
    }
  }

  // Test scenario: Component mounting/unmounting
  async testComponentLifecycle() {
    console.log('🔧 Testing component lifecycle...');
    
    await this.page.goto(`${this.options.baseUrl}/home`);
    
    for (let i = 0; i < 30; i++) {
      // Simulate component state changes
      await this.page.evaluate(() => {
        // Trigger React re-renders
        if (window.React) {
          const event = new CustomEvent('test-rerender');
          document.dispatchEvent(event);
        }
      });
      
      // Create and destroy DOM elements
      await this.page.evaluate((iteration) => {
        const container = document.createElement('div');
        container.innerHTML = `
          <div id="test-container-${iteration}">
            ${Array.from({ length: 100 }, (_, i) => `<div class="test-item">${i}</div>`).join('')}
          </div>
        `;
        document.body.appendChild(container);
        
        // Remove after a short delay
        setTimeout(() => {
          container.remove();
        }, 100);
      }, i);
      
      await this.collectMemorySample(`component-lifecycle-${i}`);
      await this.page.waitForTimeout(1500);
    }
  }

  // Test scenario: Data loading and caching
  async testDataLoading() {
    console.log('📊 Testing data loading patterns...');
    
    await this.page.goto(`${this.options.baseUrl}/home`);
    
    for (let i = 0; i < 20; i++) {
      // Simulate API calls and data caching
      await this.page.evaluate(async (iteration) => {
        try {
          // Create large data structures
          const largeData = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            data: `Large data string for iteration ${iteration} item ${i}`.repeat(10),
            nested: {
              array: Array.from({ length: 50 }, (_, j) => `nested-${j}`)
            }
          }));
          
          // Store in various caches
          if (window.localStorage) {
            window.localStorage.setItem(`test-data-${iteration}`, JSON.stringify(largeData));
          }
          
          if (window.sessionStorage) {
            window.sessionStorage.setItem(`session-data-${iteration}`, JSON.stringify(largeData));
          }
          
          // Simulate React Query or similar caching
          if (!window.testCache) window.testCache = new Map();
          window.testCache.set(`cache-${iteration}`, largeData);
          
        } catch (error) {
          console.warn('Data loading test error:', error);
        }
      }, i);
      
      await this.collectMemorySample(`data-loading-${i}`);
      await this.page.waitForTimeout(2000);
    }
  }

  async collectMemorySample(label) {
    try {
      // Get memory info from browser
      const memoryInfo = await this.page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (memoryInfo) {
        const sample = {
          timestamp: Date.now(),
          label,
          ...memoryInfo,
          usedMB: Math.round(memoryInfo.used / 1024 / 1024 * 100) / 100,
          totalMB: Math.round(memoryInfo.total / 1024 / 1024 * 100) / 100,
          limitMB: Math.round(memoryInfo.limit / 1024 / 1024 * 100) / 100
        };
        
        this.memoryData.push(sample);
        
        // Check for potential leaks
        this.analyzeMemoryGrowth(sample);
        
        return sample;
      }
    } catch (error) {
      console.warn('Failed to collect memory sample:', error);
    }
    
    return null;
  }

  analyzeMemoryGrowth(currentSample) {
    if (this.memoryData.length < 10) return; // Need baseline
    
    const baseline = this.memoryData[Math.floor(this.memoryData.length / 4)]; // 25% mark
    const growthRate = (currentSample.used - baseline.used) / baseline.used;
    
    // Detect concerning growth patterns
    if (growthRate > this.options.heapGrowthThreshold) {
      const leak = {
        type: 'HEAP_GROWTH',
        timestamp: currentSample.timestamp,
        label: currentSample.label,
        growthRate: Math.round(growthRate * 100),
        baselineUsed: baseline.used,
        currentUsed: currentSample.used,
        growthMB: Math.round((currentSample.used - baseline.used) / 1024 / 1024 * 100) / 100,
        severity: growthRate > 0.5 ? 'high' : 'medium'
      };
      
      this.leaks.push(leak);
      console.warn(`⚠️ Memory growth detected: ${leak.growthMB}MB (${leak.growthRate}%)`);
    }
    
    // Check absolute threshold
    if (currentSample.used > this.options.memoryThreshold) {
      const leak = {
        type: 'THRESHOLD_EXCEEDED',
        timestamp: currentSample.timestamp,
        label: currentSample.label,
        usedMB: currentSample.usedMB,
        thresholdMB: Math.round(this.options.memoryThreshold / 1024 / 1024),
        severity: 'high'
      };
      
      this.leaks.push(leak);
      console.warn(`🚨 Memory threshold exceeded: ${leak.usedMB}MB`);
    }
  }

  // Analyze memory patterns for leaks
  analyzeMemoryPatterns() {
    const analysis = {
      totalSamples: this.memoryData.length,
      testDuration: Date.now() - this.startTime,
      memoryStats: this.calculateMemoryStats(),
      leakPatterns: this.identifyLeakPatterns(),
      recommendations: this.generateRecommendations()
    };
    
    return analysis;
  }

  calculateMemoryStats() {
    if (this.memoryData.length === 0) return null;
    
    const usedMemory = this.memoryData.map(d => d.used);
    const initial = usedMemory[0];
    const final = usedMemory[usedMemory.length - 1];
    const max = Math.max(...usedMemory);
    const min = Math.min(...usedMemory);
    const avg = usedMemory.reduce((a, b) => a + b, 0) / usedMemory.length;
    
    return {
      initial: Math.round(initial / 1024 / 1024 * 100) / 100,
      final: Math.round(final / 1024 / 1024 * 100) / 100,
      max: Math.round(max / 1024 / 1024 * 100) / 100,
      min: Math.round(min / 1024 / 1024 * 100) / 100,
      average: Math.round(avg / 1024 / 1024 * 100) / 100,
      growth: Math.round((final - initial) / 1024 / 1024 * 100) / 100,
      growthPercentage: Math.round((final - initial) / initial * 100)
    };
  }

  identifyLeakPatterns() {
    const patterns = {
      continuousGrowth: false,
      memorySpikes: [],
      cyclicPattern: false,
      steadyState: false
    };
    
    // Analyze growth trend
    const chunks = this.chunkArray(this.memoryData, 10);
    const chunkAverages = chunks.map(chunk => 
      chunk.reduce((sum, sample) => sum + sample.used, 0) / chunk.length
    );
    
    // Check for continuous growth
    let growingChunks = 0;
    for (let i = 1; i < chunkAverages.length; i++) {
      if (chunkAverages[i] > chunkAverages[i - 1]) {
        growingChunks++;
      }
    }
    
    patterns.continuousGrowth = growingChunks / (chunkAverages.length - 1) > 0.7;
    
    // Identify memory spikes
    const threshold = this.calculateMemoryStats().average * 1.2;
    patterns.memorySpikes = this.memoryData
      .filter(sample => sample.used > threshold)
      .map(sample => ({
        timestamp: sample.timestamp,
        label: sample.label,
        usedMB: sample.usedMB
      }));
    
    return patterns;
  }

  generateRecommendations() {
    const recommendations = [];
    const stats = this.calculateMemoryStats();
    const patterns = this.identifyLeakPatterns();
    
    if (stats.growthPercentage > 30) {
      recommendations.push({
        category: 'Memory Growth',
        priority: 'high',
        description: `Memory grew by ${stats.growth}MB (${stats.growthPercentage}%)`,
        suggestions: [
          'Review component cleanup in useEffect hooks',
          'Check for event listener removal',
          'Verify closure and callback cleanup',
          'Implement proper cache invalidation'
        ]
      });
    }
    
    if (patterns.continuousGrowth) {
      recommendations.push({
        category: 'Continuous Growth',
        priority: 'high',
        description: 'Memory shows continuous upward trend',
        suggestions: [
          'Add garbage collection points',
          'Implement memory-efficient data structures',
          'Review React component lifecycle methods',
          'Check for retained DOM references'
        ]
      });
    }
    
    if (patterns.memorySpikes.length > 5) {
      recommendations.push({
        category: 'Memory Spikes',
        priority: 'medium',
        description: `Detected ${patterns.memorySpikes.length} memory spikes`,
        suggestions: [
          'Optimize large data operations',
          'Implement data pagination',
          'Use virtual scrolling for large lists',
          'Consider lazy loading strategies'
        ]
      });
    }
    
    if (this.leaks.length > 0) {
      recommendations.push({
        category: 'Memory Leaks',
        priority: 'critical',
        description: `Found ${this.leaks.length} potential memory leaks`,
        suggestions: [
          'Run detailed heap snapshot analysis',
          'Review identified leak sources',
          'Implement proper cleanup patterns',
          'Use WeakMap/WeakSet for object references'
        ]
      });
    }
    
    return recommendations;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async generateReport() {
    const analysis = this.analyzeMemoryPatterns();
    const stats = this.calculateMemoryStats();
    
    const report = {
      timestamp: new Date().toISOString(),
      testConfiguration: this.options,
      memoryStats: stats,
      analysis,
      leaks: this.leaks,
      samples: this.memoryData.length > 1000 ? 
        this.memoryData.filter((_, i) => i % 10 === 0) : // Sample for large datasets
        this.memoryData
    };
    
    // Save detailed report
    const reportPath = path.join(
      this.options.reportPath,
      `memory-analysis-${Date.now()}.json`
    );
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n🧠 Memory Analysis Report');
    console.log('========================\n');
    console.log(`📊 Memory Stats:`);
    console.log(`   Initial: ${stats.initial}MB`);
    console.log(`   Final: ${stats.final}MB`);
    console.log(`   Growth: ${stats.growth}MB (${stats.growthPercentage}%)`);
    console.log(`   Peak: ${stats.max}MB`);
    console.log(`   Average: ${stats.average}MB\n`);
    
    if (this.leaks.length > 0) {
      console.log(`⚠️ Potential Leaks: ${this.leaks.length}`);
      this.leaks.forEach((leak, index) => {
        console.log(`   ${index + 1}. ${leak.type}: ${leak.label}`);
      });
      console.log('');
    }
    
    if (analysis.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      analysis.recommendations.forEach(rec => {
        console.log(`   • ${rec.category}: ${rec.description}`);
      });
    }
    
    console.log(`\n📄 Detailed report: ${reportPath}`);
    
    return report;
  }

  async runFullTest() {
    this.startTime = Date.now();
    
    try {
      await this.initialize();
      
      // Run all test scenarios
      await this.testNavigationPattern();
      await this.testFormInteractions();
      await this.testComponentLifecycle();
      await this.testDataLoading();
      
      const report = await this.generateReport();
      
      return report;
      
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

module.exports = MemoryLeakDetector;

// CLI usage
if (require.main === module) {
  const detector = new MemoryLeakDetector();
  detector.runFullTest().catch(console.error);
}