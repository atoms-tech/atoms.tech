/**
 * Performance Monitoring Dashboard
 * Real-time performance metrics visualization and alerting system
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

class PerformanceDashboard {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.monitoringInterval = options.monitoringInterval || 60000; // 1 minute
    this.targetUrl = options.targetUrl || 'http://localhost:3000';
    this.isMonitoring = false;
    this.performanceData = [];
    this.alerts = [];
    
    this.setupRoutes();
    this.setupSocketHandlers();
    this.loadHistoricalData();
  }

  setupRoutes() {
    // Serve static dashboard files
    this.app.use(express.static(path.join(__dirname, 'dashboard-ui')));
    
    // API endpoints
    this.app.get('/api/performance/current', (req, res) => {
      const latest = this.performanceData.slice(-1)[0];
      res.json(latest || {});
    });

    this.app.get('/api/performance/history', (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      res.json(this.performanceData.slice(-limit));
    });

    this.app.get('/api/performance/alerts', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      res.json(this.alerts.slice(-limit));
    });

    this.app.get('/api/performance/summary', (req, res) => {
      const summary = this.generatePerformanceSummary();
      res.json(summary);
    });

    this.app.post('/api/performance/start-monitoring', (req, res) => {
      this.startMonitoring();
      res.json({ status: 'started', message: 'Performance monitoring started' });
    });

    this.app.post('/api/performance/stop-monitoring', (req, res) => {
      this.stopMonitoring();
      res.json({ status: 'stopped', message: 'Performance monitoring stopped' });
    });

    // Dashboard UI
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('📊 Dashboard client connected');
      
      // Send current status
      socket.emit('monitoring-status', {
        isMonitoring: this.isMonitoring,
        dataPoints: this.performanceData.length,
        alerts: this.alerts.length,
      });

      // Send recent data
      socket.emit('performance-history', this.performanceData.slice(-20));
      socket.emit('recent-alerts', this.alerts.slice(-10));

      socket.on('disconnect', () => {
        console.log('📊 Dashboard client disconnected');
      });

      socket.on('request-summary', () => {
        const summary = this.generatePerformanceSummary();
        socket.emit('performance-summary', summary);
      });
    });
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`🚀 Starting performance monitoring on ${this.targetUrl}`);
    
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.performanceCheck();
      } catch (error) {
        console.error('❌ Performance check failed:', error.message);
        this.handleMonitoringError(error);
      }
    }, this.monitoringInterval);

    // Perform initial check
    await this.performanceCheck();
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️ Monitoring not running');
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    console.log('🛑 Performance monitoring stopped');
    
    this.io.emit('monitoring-status', {
      isMonitoring: false,
      message: 'Monitoring stopped',
    });
  }

  async performanceCheck() {
    const timestamp = new Date().toISOString();
    console.log(`🔍 Performing performance check at ${timestamp}`);

    try {
      // Launch Chrome and run Lighthouse
      const chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
      });

      const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
        port: chrome.port,
      };

      const runnerResult = await lighthouse(this.targetUrl, options);
      await chrome.kill();

      const report = JSON.parse(runnerResult.report);
      const performanceData = this.extractPerformanceMetrics(report, timestamp);
      
      // Store data
      this.performanceData.push(performanceData);
      
      // Check for alerts
      const alerts = this.checkPerformanceAlerts(performanceData);
      if (alerts.length > 0) {
        this.alerts.push(...alerts);
        console.log(`🚨 Generated ${alerts.length} performance alerts`);
      }

      // Emit real-time data
      this.io.emit('performance-data', performanceData);
      if (alerts.length > 0) {
        this.io.emit('performance-alerts', alerts);
      }

      // Save data to file
      this.savePerformanceData();

      console.log(`✅ Performance check complete. Score: ${performanceData.performanceScore}`);

    } catch (error) {
      console.error('❌ Performance check failed:', error.message);
      this.handleMonitoringError(error);
    }
  }

  extractPerformanceMetrics(lighthouseReport, timestamp) {
    const audits = lighthouseReport.audits;
    const categories = lighthouseReport.categories;

    return {
      timestamp,
      url: this.targetUrl,
      performanceScore: Math.round(categories.performance.score * 100),
      
      // Core Web Vitals
      webVitals: {
        LCP: audits['largest-contentful-paint']?.numericValue || null,
        FCP: audits['first-contentful-paint']?.numericValue || null,
        CLS: audits['cumulative-layout-shift']?.numericValue || null,
        TBT: audits['total-blocking-time']?.numericValue || null,
        SI: audits['speed-index']?.numericValue || null,
        TTI: audits['interactive']?.numericValue || null,
      },

      // Resource metrics
      resources: {
        totalSize: audits['total-byte-weight']?.numericValue || 0,
        requests: audits['diagnostics']?.details?.items?.find(item => 
          item.requestCount !== undefined
        )?.requestCount || 0,
        
        // Resource breakdown
        javascript: this.calculateResourceSize(audits, 'script'),
        css: this.calculateResourceSize(audits, 'stylesheet'),
        images: this.calculateResourceSize(audits, 'image'),
        fonts: this.calculateResourceSize(audits, 'font'),
      },

      // Performance opportunities
      opportunities: {
        unusedJavaScript: audits['unused-javascript']?.details?.overallSavingsBytes || 0,
        unusedCSS: audits['unused-css-rules']?.details?.overallSavingsBytes || 0,
        optimizeImages: audits['uses-optimized-images']?.details?.overallSavingsBytes || 0,
        nextGenFormats: audits['uses-webp-images']?.details?.overallSavingsBytes || 0,
      },

      // Diagnostics
      diagnostics: {
        renderBlocking: audits['render-blocking-resources']?.details?.items?.length || 0,
        domSize: audits['dom-size']?.numericValue || 0,
        criticalRequestChains: audits['critical-request-chains']?.details?.longestChain?.length || 0,
      },
    };
  }

  calculateResourceSize(audits, resourceType) {
    const resourceAudit = audits['resource-summary'];
    if (resourceAudit && resourceAudit.details && resourceAudit.details.items) {
      const resource = resourceAudit.details.items.find(item => 
        item.resourceType === resourceType
      );
      return resource ? resource.transferSize : 0;
    }
    return 0;
  }

  checkPerformanceAlerts(data) {
    const alerts = [];
    const thresholds = {
      performanceScore: { critical: 60, warning: 80 },
      LCP: { critical: 4000, warning: 2500 },
      FCP: { critical: 3000, warning: 1800 },
      CLS: { critical: 0.25, warning: 0.1 },
      TBT: { critical: 600, warning: 200 },
      TTI: { critical: 6000, warning: 3500 },
      totalSize: { critical: 3000000, warning: 2000000 }, // bytes
    };

    // Check performance score
    if (data.performanceScore < thresholds.performanceScore.critical) {
      alerts.push({
        id: `alert-${Date.now()}-score-critical`,
        timestamp: data.timestamp,
        level: 'critical',
        metric: 'Performance Score',
        value: data.performanceScore,
        threshold: thresholds.performanceScore.critical,
        message: `Performance score critically low: ${data.performanceScore}%`,
        url: data.url,
      });
    } else if (data.performanceScore < thresholds.performanceScore.warning) {
      alerts.push({
        id: `alert-${Date.now()}-score-warning`,
        timestamp: data.timestamp,
        level: 'warning',
        metric: 'Performance Score',
        value: data.performanceScore,
        threshold: thresholds.performanceScore.warning,
        message: `Performance score below warning threshold: ${data.performanceScore}%`,
        url: data.url,
      });
    }

    // Check Web Vitals
    Object.keys(data.webVitals).forEach(metric => {
      const value = data.webVitals[metric];
      const threshold = thresholds[metric];
      
      if (value && threshold) {
        if (value > threshold.critical) {
          alerts.push({
            id: `alert-${Date.now()}-${metric}-critical`,
            timestamp: data.timestamp,
            level: 'critical',
            metric: metric,
            value: value,
            threshold: threshold.critical,
            message: `${metric} critically slow: ${value.toFixed(2)}ms`,
            url: data.url,
          });
        } else if (value > threshold.warning) {
          alerts.push({
            id: `alert-${Date.now()}-${metric}-warning`,
            timestamp: data.timestamp,
            level: 'warning',
            metric: metric,
            value: value,
            threshold: threshold.warning,
            message: `${metric} above warning threshold: ${value.toFixed(2)}ms`,
            url: data.url,
          });
        }
      }
    });

    // Check resource size
    if (data.resources.totalSize > thresholds.totalSize.critical) {
      alerts.push({
        id: `alert-${Date.now()}-size-critical`,
        timestamp: data.timestamp,
        level: 'critical',
        metric: 'Total Size',
        value: data.resources.totalSize,
        threshold: thresholds.totalSize.critical,
        message: `Page size critically large: ${(data.resources.totalSize / 1024 / 1024).toFixed(2)}MB`,
        url: data.url,
      });
    }

    return alerts;
  }

  generatePerformanceSummary() {
    if (this.performanceData.length === 0) {
      return { message: 'No performance data available' };
    }

    const latest = this.performanceData.slice(-1)[0];
    const last24h = this.performanceData.filter(d => 
      Date.now() - new Date(d.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    const summary = {
      current: {
        timestamp: latest.timestamp,
        performanceScore: latest.performanceScore,
        webVitals: latest.webVitals,
        status: this.getPerformanceStatus(latest.performanceScore),
      },
      
      trends: {
        dataPoints: last24h.length,
        averageScore: last24h.length > 0 ? 
          Math.round(last24h.reduce((sum, d) => sum + d.performanceScore, 0) / last24h.length) : 0,
        scoreImprovement: this.calculateTrend(last24h.map(d => d.performanceScore)),
      },

      alerts: {
        total: this.alerts.length,
        last24h: this.alerts.filter(a => 
          Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000
        ).length,
        critical: this.alerts.filter(a => a.level === 'critical').length,
        warning: this.alerts.filter(a => a.level === 'warning').length,
      },

      recommendations: this.generateRecommendations(latest),
    };

    return summary;
  }

  getPerformanceStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'needs-improvement';
    return 'poor';
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const recent = values.slice(-5);
    const older = values.slice(-10, -5);
    
    if (older.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    return recentAvg - olderAvg;
  }

  generateRecommendations(data) {
    const recommendations = [];

    // Performance score recommendations
    if (data.performanceScore < 80) {
      recommendations.push({
        priority: 'high',
        category: 'Performance Score',
        issue: `Performance score is ${data.performanceScore}%, below optimal threshold`,
        impact: 'Affects user experience and SEO rankings',
        solutions: [
          'Optimize largest contentful paint (LCP)',
          'Reduce cumulative layout shift (CLS)',
          'Minimize total blocking time (TBT)',
        ],
      });
    }

    // LCP recommendations
    if (data.webVitals.LCP > 2500) {
      recommendations.push({
        priority: 'high',
        category: 'Largest Contentful Paint',
        issue: `LCP is ${data.webVitals.LCP.toFixed(0)}ms, above 2.5s threshold`,
        impact: 'Users experience slow loading of main content',
        solutions: [
          'Optimize images and use next-gen formats',
          'Implement lazy loading for non-critical resources',
          'Use a CDN for faster content delivery',
          'Optimize server response times',
        ],
      });
    }

    // CLS recommendations
    if (data.webVitals.CLS > 0.1) {
      recommendations.push({
        priority: 'medium',
        category: 'Cumulative Layout Shift',
        issue: `CLS is ${data.webVitals.CLS.toFixed(3)}, above 0.1 threshold`,
        impact: 'Causes visual instability and poor user experience',
        solutions: [
          'Set dimensions for images and videos',
          'Reserve space for dynamic content',
          'Avoid inserting content above existing content',
          'Use transform animations instead of changing layout properties',
        ],
      });
    }

    // Bundle size recommendations
    if (data.resources.totalSize > 2000000) {
      recommendations.push({
        priority: 'medium',
        category: 'Bundle Size',
        issue: `Total page size is ${(data.resources.totalSize / 1024 / 1024).toFixed(2)}MB, above 2MB threshold`,
        impact: 'Slower loading on slower connections',
        solutions: [
          'Implement code splitting',
          'Remove unused JavaScript and CSS',
          'Compress images and use WebP format',
          'Enable gzip/brotli compression',
        ],
      });
    }

    return recommendations;
  }

  handleMonitoringError(error) {
    const errorAlert = {
      id: `alert-${Date.now()}-error`,
      timestamp: new Date().toISOString(),
      level: 'critical',
      metric: 'Monitoring Error',
      message: `Performance monitoring failed: ${error.message}`,
      url: this.targetUrl,
    };

    this.alerts.push(errorAlert);
    this.io.emit('monitoring-error', errorAlert);
  }

  savePerformanceData() {
    const dataFile = path.join(__dirname, '../performance-reports/dashboard-data.json');
    const data = {
      performanceData: this.performanceData.slice(-1000), // Keep last 1000 records
      alerts: this.alerts.slice(-500), // Keep last 500 alerts
      lastUpdate: new Date().toISOString(),
    };

    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  }

  loadHistoricalData() {
    const dataFile = path.join(__dirname, '../performance-reports/dashboard-data.json');
    
    try {
      if (fs.existsSync(dataFile)) {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        this.performanceData = data.performanceData || [];
        this.alerts = data.alerts || [];
        console.log(`📈 Loaded ${this.performanceData.length} historical performance records`);
      }
    } catch (error) {
      console.warn('⚠️ Could not load historical data:', error.message);
    }
  }

  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Dashboard</title>
    <script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .status-excellent { color: #10b981; }
        .status-good { color: #3b82f6; }
        .status-needs-improvement { color: #f59e0b; }
        .status-poor { color: #ef4444; }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .alerts-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .alert {
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid;
        }
        .alert-critical {
            background: #fef2f2;
            border-color: #ef4444;
        }
        .alert-warning {
            background: #fffbeb;
            border-color: #f59e0b;
        }
        .controls {
            margin: 20px 0;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        .btn-primary {
            background: #3b82f6;
            color: white;
        }
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-active { background: #10b981; }
        .status-inactive { background: #ef4444; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🚀 Performance Dashboard</h1>
            <p>Real-time performance monitoring and alerting</p>
            
            <div class="controls">
                <button id="startBtn" class="btn btn-primary">Start Monitoring</button>
                <button id="stopBtn" class="btn btn-danger">Stop Monitoring</button>
                <span id="status">
                    <span class="status-indicator status-inactive"></span>
                    Monitoring Stopped
                </span>
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Performance Score</div>
                <div id="performanceScore" class="metric-value status-good">--</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Largest Contentful Paint</div>
                <div id="lcp" class="metric-value">-- ms</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Cumulative Layout Shift</div>
                <div id="cls" class="metric-value">--</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Total Blocking Time</div>
                <div id="tbt" class="metric-value">-- ms</div>
            </div>
        </div>

        <div class="chart-container">
            <h3>Performance Score Trend</h3>
            <canvas id="performanceChart"></canvas>
        </div>

        <div class="alerts-container">
            <h3>🚨 Recent Alerts</h3>
            <div id="alertsList">
                <p>No alerts</p>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let performanceChart;

        // Initialize chart
        const ctx = document.getElementById('performanceChart').getContext('2d');
        performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Performance Score',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Socket event handlers
        socket.on('monitoring-status', (data) => {
            updateMonitoringStatus(data.isMonitoring);
        });

        socket.on('performance-data', (data) => {
            updateMetrics(data);
            updateChart(data);
        });

        socket.on('performance-history', (history) => {
            history.forEach(data => updateChart(data));
        });

        socket.on('performance-alerts', (alerts) => {
            updateAlerts(alerts);
        });

        socket.on('recent-alerts', (alerts) => {
            displayAlerts(alerts);
        });

        // Control handlers
        document.getElementById('startBtn').addEventListener('click', () => {
            fetch('/api/performance/start-monitoring', { method: 'POST' });
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            fetch('/api/performance/stop-monitoring', { method: 'POST' });
        });

        function updateMonitoringStatus(isMonitoring) {
            const statusEl = document.getElementById('status');
            const indicator = statusEl.querySelector('.status-indicator');
            
            if (isMonitoring) {
                indicator.className = 'status-indicator status-active';
                statusEl.innerHTML = '<span class="status-indicator status-active"></span>Monitoring Active';
            } else {
                indicator.className = 'status-indicator status-inactive';
                statusEl.innerHTML = '<span class="status-indicator status-inactive"></span>Monitoring Stopped';
            }
        }

        function updateMetrics(data) {
            document.getElementById('performanceScore').textContent = data.performanceScore || '--';
            document.getElementById('lcp').textContent = data.webVitals.LCP ? 
                Math.round(data.webVitals.LCP) + ' ms' : '-- ms';
            document.getElementById('cls').textContent = data.webVitals.CLS ? 
                data.webVitals.CLS.toFixed(3) : '--';
            document.getElementById('tbt').textContent = data.webVitals.TBT ? 
                Math.round(data.webVitals.TBT) + ' ms' : '-- ms';

            // Update performance score status
            const scoreEl = document.getElementById('performanceScore');
            scoreEl.className = 'metric-value ' + getScoreStatus(data.performanceScore);
        }

        function getScoreStatus(score) {
            if (score >= 90) return 'status-excellent';
            if (score >= 80) return 'status-good';
            if (score >= 60) return 'status-needs-improvement';
            return 'status-poor';
        }

        function updateChart(data) {
            const chart = performanceChart;
            const time = new Date(data.timestamp).toLocaleTimeString();
            
            chart.data.labels.push(time);
            chart.data.datasets[0].data.push(data.performanceScore);
            
            // Keep only last 20 data points
            if (chart.data.labels.length > 20) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
            
            chart.update('none');
        }

        function updateAlerts(alerts) {
            alerts.forEach(alert => {
                displayAlert(alert);
            });
        }

        function displayAlerts(alerts) {
            const alertsList = document.getElementById('alertsList');
            
            if (alerts.length === 0) {
                alertsList.innerHTML = '<p>No alerts</p>';
                return;
            }

            alertsList.innerHTML = alerts.map(alert => 
                \`<div class="alert alert-\${alert.level}">
                    <strong>\${alert.metric}</strong>: \${alert.message}
                    <br><small>\${new Date(alert.timestamp).toLocaleString()}</small>
                </div>\`
            ).join('');
        }

        function displayAlert(alert) {
            const alertsList = document.getElementById('alertsList');
            const alertEl = document.createElement('div');
            alertEl.className = \`alert alert-\${alert.level}\`;
            alertEl.innerHTML = \`
                <strong>\${alert.metric}</strong>: \${alert.message}
                <br><small>\${new Date(alert.timestamp).toLocaleString()}</small>
            \`;
            alertsList.insertBefore(alertEl, alertsList.firstChild);
            
            // Keep only last 10 alerts visible
            const alerts = alertsList.querySelectorAll('.alert');
            if (alerts.length > 10) {
                alertsList.removeChild(alerts[alerts.length - 1]);
            }
        }

        // Initialize dashboard
        fetch('/api/performance/summary')
            .then(response => response.json())
            .then(summary => {
                if (summary.current) {
                    updateMetrics(summary.current);
                }
            });
    </script>
</body>
</html>
    `;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🎯 Performance Dashboard running at http://localhost:${this.port}`);
      console.log(`📊 Monitoring target: ${this.targetUrl}`);
    });
  }

  stop() {
    this.stopMonitoring();
    this.server.close();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const port = args.find(arg => arg.startsWith('--port='))?.split('=')[1] || 3001;
  const targetUrl = args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';
  const autoStart = args.includes('--auto-start');

  const dashboard = new PerformanceDashboard({
    port: parseInt(port),
    targetUrl,
  });

  dashboard.start();

  if (autoStart) {
    setTimeout(() => {
      dashboard.startMonitoring();
    }, 2000);
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down performance dashboard...');
    dashboard.stop();
    process.exit(0);
  });
}

module.exports = PerformanceDashboard;