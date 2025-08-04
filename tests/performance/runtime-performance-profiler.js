/**
 * Runtime Performance Profiler
 * 
 * Monitors and profiles runtime performance including:
 * - React component render times
 * - JavaScript execution performance
 * - Memory usage patterns
 * - Long task detection
 * - Frame rate monitoring
 */

import { Profiler } from 'react';

class RuntimePerformanceProfiler {
  constructor(options = {}) {
    this.options = {
      enableComponentProfiling: true,
      enableMemoryMonitoring: true,
      enableLongTaskDetection: true,
      enableFrameRateMonitoring: true,
      sampleRate: 0.1, // 10% sampling
      reportingEndpoint: options.reportingEndpoint,
      maxProfileDuration: 60000, // 1 minute
      ...options
    };

    this.profiles = new Map();
    this.memorySnapshots = [];
    this.longTasks = [];
    this.frameRates = [];
    this.isActive = false;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Start performance profiling
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.startTime = performance.now();
    
    if (this.options.enableMemoryMonitoring) {
      this.startMemoryMonitoring();
    }
    
    if (this.options.enableLongTaskDetection) {
      this.startLongTaskDetection();
    }
    
    if (this.options.enableFrameRateMonitoring) {
      this.startFrameRateMonitoring();
    }

    // Auto-stop after max duration
    this.autoStopTimer = setTimeout(() => {
      this.stop();
    }, this.options.maxProfileDuration);

    console.log('🔍 Runtime performance profiling started');
  }

  /**
   * Stop performance profiling
   */
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.endTime = performance.now();
    
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
    }

    this.stopMemoryMonitoring();
    this.stopLongTaskDetection();
    this.stopFrameRateMonitoring();

    const report = this.generateReport();
    this.sendReport(report);

    console.log('✅ Runtime performance profiling completed');
    return report;
  }

  /**
   * React Profiler callback for component performance
   */
  onRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime, interactions) => {
    if (!this.isActive) return;
    
    // Sample based on sample rate
    if (Math.random() > this.options.sampleRate) return;

    const profile = {
      componentId: id,
      phase, // 'mount' or 'update'
      actualDuration, // Time spent rendering
      baseDuration, // Estimated time without memoization
      startTime,
      commitTime,
      interactions: Array.from(interactions || []).map(interaction => ({
        name: interaction.name,
        timestamp: interaction.timestamp
      })),
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    // Store profile
    if (!this.profiles.has(id)) {
      this.profiles.set(id, []);
    }
    this.profiles.get(id).push(profile);

    // Log slow renders
    if (actualDuration > 16) { // Slower than 60fps
      console.warn(`🐌 Slow render detected: ${id} took ${actualDuration.toFixed(2)}ms`);
    }
  };

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    if (!('memory' in performance)) {
      console.warn('Memory API not available');
      return;
    }

    this.memoryInterval = setInterval(() => {
      if (!this.isActive) return;

      const memInfo = performance.memory;
      const snapshot = {
        usedJSHeapSize: memInfo.usedJSHeapSize,
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
        timestamp: Date.now(),
        sessionId: this.sessionId
      };

      this.memorySnapshots.push(snapshot);

      // Detect memory leaks (growing heap over time)
      if (this.memorySnapshots.length > 10) {
        const recent = this.memorySnapshots.slice(-10);
        const trend = this.calculateMemoryTrend(recent);
        
        if (trend.isIncreasing && trend.rate > 1024 * 1024) { // 1MB/snapshot
          console.warn('🚨 Potential memory leak detected');
        }
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop memory monitoring
   */
  stopMemoryMonitoring() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }

  /**
   * Calculate memory usage trend
   */
  calculateMemoryTrend(snapshots) {
    if (snapshots.length < 2) return { isIncreasing: false, rate: 0 };

    const first = snapshots[0].usedJSHeapSize;
    const last = snapshots[snapshots.length - 1].usedJSHeapSize;
    const rate = (last - first) / snapshots.length;

    return {
      isIncreasing: rate > 0,
      rate,
      totalIncrease: last - first,
      percentageIncrease: ((last - first) / first) * 100
    };
  }

  /**
   * Start long task detection
   */
  startLongTaskDetection() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not available');
      return;
    }

    try {
      this.longTaskObserver = new PerformanceObserver((list) => {
        if (!this.isActive) return;

        const entries = list.getEntries();
        entries.forEach(entry => {
          const longTask = {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
            attribution: this.parseAttribution(entry.attribution),
            timestamp: Date.now(),
            sessionId: this.sessionId
          };

          this.longTasks.push(longTask);

          // Log significant long tasks
          if (entry.duration > 100) {
            console.warn(`⏱️ Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      this.longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Long task observer not supported:', error);
    }
  }

  /**
   * Stop long task detection
   */
  stopLongTaskDetection() {
    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
      this.longTaskObserver = null;
    }
  }

  /**
   * Parse long task attribution
   */
  parseAttribution(attribution) {
    if (!attribution || !attribution.length) return [];
    
    return Array.from(attribution).map(attr => ({
      name: attr.name,
      containerType: attr.containerType,
      containerSrc: attr.containerSrc,
      containerId: attr.containerId,
      containerName: attr.containerName
    }));
  }

  /**
   * Start frame rate monitoring
   */
  startFrameRateMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFrameRate = (currentTime) => {
      if (!this.isActive) return;

      frameCount++;
      
      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        this.frameRates.push({
          fps,
          timestamp: Date.now(),
          sessionId: this.sessionId
        });

        // Warn about low frame rates
        if (fps < 55) {
          console.warn(`📉 Low frame rate detected: ${fps} FPS`);
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      this.frameRateAnimationId = requestAnimationFrame(measureFrameRate);
    };

    this.frameRateAnimationId = requestAnimationFrame(measureFrameRate);
  }

  /**
   * Stop frame rate monitoring
   */
  stopFrameRateMonitoring() {
    if (this.frameRateAnimationId) {
      cancelAnimationFrame(this.frameRateAnimationId);
      this.frameRateAnimationId = null;
    }
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    const duration = this.endTime - this.startTime;
    
    return {
      sessionId: this.sessionId,
      duration,
      timestamp: Date.now(),
      
      // Component performance
      components: this.analyzeComponentPerformance(),
      
      // Memory analysis
      memory: this.analyzeMemoryUsage(),
      
      // Long task analysis
      longTasks: this.analyzeLongTasks(),
      
      // Frame rate analysis
      frameRate: this.analyzeFrameRate(),
      
      // Performance score
      score: this.calculatePerformanceScore(),
      
      // Recommendations
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Analyze component performance data
   */
  analyzeComponentPerformance() {
    const components = {};
    
    this.profiles.forEach((profiles, componentId) => {
      const totalRenders = profiles.length;
      const totalDuration = profiles.reduce((sum, p) => sum + p.actualDuration, 0);
      const avgDuration = totalDuration / totalRenders;
      
      const slowRenders = profiles.filter(p => p.actualDuration > 16);
      const mountTime = profiles.find(p => p.phase === 'mount')?.actualDuration || 0;
      
      components[componentId] = {
        totalRenders,
        totalDuration,
        avgDuration,
        slowRenders: slowRenders.length,
        slowRenderPercentage: (slowRenders.length / totalRenders) * 100,
        mountTime,
        maxDuration: Math.max(...profiles.map(p => p.actualDuration)),
        minDuration: Math.min(...profiles.map(p => p.actualDuration))
      };
    });

    // Sort by total duration (most expensive first)
    const sortedComponents = Object.entries(components)
      .sort(([, a], [, b]) => b.totalDuration - a.totalDuration);

    return {
      summary: {
        totalComponents: Object.keys(components).length,
        totalRenders: Object.values(components).reduce((sum, c) => sum + c.totalRenders, 0),
        totalRenderTime: Object.values(components).reduce((sum, c) => sum + c.totalDuration, 0),
        slowestComponent: sortedComponents[0]?.[0],
        avgRenderTime: Object.values(components).reduce((sum, c) => sum + c.avgDuration, 0) / Object.keys(components).length
      },
      components: Object.fromEntries(sortedComponents)
    };
  }

  /**
   * Analyze memory usage patterns
   */
  analyzeMemoryUsage() {
    if (this.memorySnapshots.length === 0) {
      return { available: false };
    }

    const snapshots = this.memorySnapshots;
    const initial = snapshots[0];
    const final = snapshots[snapshots.length - 1];
    
    const trend = this.calculateMemoryTrend(snapshots);
    const peakUsage = Math.max(...snapshots.map(s => s.usedJSHeapSize));
    const minUsage = Math.min(...snapshots.map(s => s.usedJSHeapSize));

    return {
      available: true,
      initial: initial.usedJSHeapSize,
      final: final.usedJSHeapSize,
      peak: peakUsage,
      minimum: minUsage,
      growth: final.usedJSHeapSize - initial.usedJSHeapSize,
      growthPercentage: ((final.usedJSHeapSize - initial.usedJSHeapSize) / initial.usedJSHeapSize) * 100,
      trend,
      snapshots: snapshots.length,
      potentialLeak: trend.isIncreasing && trend.rate > 512 * 1024 // 512KB growth rate
    };
  }

  /**
   * Analyze long task data
   */
  analyzeLongTasks() {
    if (this.longTasks.length === 0) {
      return { count: 0, totalTime: 0, available: false };
    }

    const totalTime = this.longTasks.reduce((sum, task) => sum + task.duration, 0);
    const avgDuration = totalTime / this.longTasks.length;
    const maxDuration = Math.max(...this.longTasks.map(task => task.duration));
    
    // Group by attribution
    const byAttribution = this.longTasks.reduce((acc, task) => {
      const key = task.attribution?.[0]?.name || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});

    return {
      available: true,
      count: this.longTasks.length,
      totalTime,
      avgDuration,
      maxDuration,
      byAttribution,
      tasksOver50ms: this.longTasks.filter(task => task.duration > 50).length,
      tasksOver100ms: this.longTasks.filter(task => task.duration > 100).length
    };
  }

  /**
   * Analyze frame rate data
   */
  analyzeFrameRate() {
    if (this.frameRates.length === 0) {
      return { available: false };
    }

    const frameRates = this.frameRates.map(f => f.fps);
    const avgFPS = frameRates.reduce((sum, fps) => sum + fps, 0) / frameRates.length;
    const minFPS = Math.min(...frameRates);
    const maxFPS = Math.max(...frameRates);
    
    const droppedFrames = this.frameRates.filter(f => f.fps < 55).length;
    const smoothPercentage = ((this.frameRates.length - droppedFrames) / this.frameRates.length) * 100;

    return {
      available: true,
      avgFPS,
      minFPS,
      maxFPS,
      droppedFrames,
      smoothPercentage,
      samples: this.frameRates.length
    };
  }

  /**
   * Calculate overall performance score
   */
  calculatePerformanceScore() {
    let score = 100;
    const factors = [];

    // Component performance factor
    const componentData = this.analyzeComponentPerformance();
    if (componentData.summary.avgRenderTime > 16) {
      const penalty = Math.min(30, (componentData.summary.avgRenderTime - 16) * 2);
      score -= penalty;
      factors.push({
        factor: 'slow-components',
        penalty,
        description: `Average render time: ${componentData.summary.avgRenderTime.toFixed(2)}ms`
      });
    }

    // Memory factor
    const memoryData = this.analyzeMemoryUsage();
    if (memoryData.available && memoryData.potentialLeak) {
      const penalty = 25;
      score -= penalty;
      factors.push({
        factor: 'memory-leak',
        penalty,
        description: `Potential memory leak detected`
      });
    }

    // Long tasks factor
    const longTaskData = this.analyzeLongTasks();
    if (longTaskData.available && longTaskData.tasksOver100ms > 0) {
      const penalty = Math.min(20, longTaskData.tasksOver100ms * 5);
      score -= penalty;
      factors.push({
        factor: 'long-tasks',
        penalty,
        description: `${longTaskData.tasksOver100ms} tasks over 100ms`
      });
    }

    // Frame rate factor
    const frameRateData = this.analyzeFrameRate();
    if (frameRateData.available && frameRateData.smoothPercentage < 90) {
      const penalty = Math.min(15, (90 - frameRateData.smoothPercentage));
      score -= penalty;
      factors.push({
        factor: 'dropped-frames',
        penalty,
        description: `${frameRateData.smoothPercentage.toFixed(1)}% smooth frames`
      });
    }

    return {
      score: Math.max(0, Math.round(score)),
      grade: this.getPerformanceGrade(score),
      factors
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const componentData = this.analyzeComponentPerformance();
    const memoryData = this.analyzeMemoryUsage();
    const longTaskData = this.analyzeLongTasks();
    const frameRateData = this.analyzeFrameRate();

    // Component optimization recommendations
    if (componentData.summary.avgRenderTime > 16) {
      recommendations.push({
        category: 'Component Performance',
        priority: 'high',
        title: 'Optimize slow-rendering components',
        description: `Average render time is ${componentData.summary.avgRenderTime.toFixed(2)}ms`,
        suggestions: [
          'Use React.memo() for pure components',
          'Implement useMemo() for expensive calculations',
          'Use useCallback() to prevent unnecessary re-renders',
          'Consider component code splitting'
        ]
      });
    }

    // Memory recommendations
    if (memoryData.available && memoryData.potentialLeak) {
      recommendations.push({
        category: 'Memory Management',
        priority: 'critical',
        title: 'Potential memory leak detected',
        description: `Memory usage increased by ${memoryData.growthPercentage.toFixed(1)}%`,
        suggestions: [
          'Check for event listeners that are not cleaned up',
          'Review component lifecycle and cleanup effects',
          'Avoid creating new objects in render methods',
          'Use WeakMap/WeakSet for temporary references'
        ]
      });
    }

    // Long task recommendations
    if (longTaskData.available && longTaskData.tasksOver100ms > 0) {
      recommendations.push({
        category: 'Main Thread Performance',
        priority: 'high',
        title: 'Long tasks blocking the main thread',
        description: `${longTaskData.tasksOver100ms} tasks took longer than 100ms`,
        suggestions: [
          'Break up long-running computations',
          'Use web workers for heavy processing',
          'Implement time slicing with scheduler',
          'Defer non-critical work'
        ]
      });
    }

    // Frame rate recommendations
    if (frameRateData.available && frameRateData.avgFPS < 55) {
      recommendations.push({
        category: 'Frame Rate',
        priority: 'medium',
        title: 'Low frame rate detected',
        description: `Average FPS: ${frameRateData.avgFPS.toFixed(1)}`,
        suggestions: [
          'Reduce DOM manipulations',
          'Optimize CSS animations',
          'Use transform and opacity for animations',
          'Debounce scroll and resize handlers'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get performance grade based on score
   */
  getPerformanceGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Send report to analytics endpoint
   */
  async sendReport(report) {
    if (!this.options.reportingEndpoint) return;

    try {
      await fetch(this.options.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'runtime-performance',
          report,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'perf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Create React Profiler component
   */
  createProfilerComponent() {
    return ({ children, id }) => (
      <Profiler id={id} onRender={this.onRenderCallback}>
        {children}
      </Profiler>
    );
  }
}

// React hook for easy integration
export function usePerformanceProfiler(componentId, enabled = true) {
  const profilerRef = React.useRef(null);

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (!profilerRef.current) {
      profilerRef.current = new RuntimePerformanceProfiler({
        enableComponentProfiling: true,
        sampleRate: 0.1
      });
    }

    const profiler = profilerRef.current;
    profiler.start();

    return () => {
      profiler.stop();
    };
  }, [enabled]);

  return profilerRef.current;
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuntimePerformanceProfiler;
} else if (typeof window !== 'undefined') {
  window.RuntimePerformanceProfiler = RuntimePerformanceProfiler;
}

export default RuntimePerformanceProfiler;