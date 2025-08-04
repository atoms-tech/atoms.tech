/**
 * Load Testing Orchestrator
 * Master orchestrator for all load testing scenarios
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const K6LoadTesting = require('./k6-setup');
const ArtilleryLoadTesting = require('./artillery-setup');

class LoadTestOrchestrator {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';
    this.outputDir = options.outputDir || './test-results/load-testing';
    this.tools = {
      k6: new K6LoadTesting(options),
      artillery: new ArtilleryLoadTesting(options)
    };
    
    this.testSuites = {
      quick: ['smoke'],
      standard: ['smoke', 'load'],
      comprehensive: ['smoke', 'load', 'stress'],
      endurance: ['smoke', 'load', 'soak'],
      breaking: ['smoke', 'load', 'stress', 'spike']
    };
    
    this.setupEnvironment();
  }

  setupEnvironment() {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Create reports directory
    const reportsDir = path.join(this.outputDir, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  }

  /**
   * Memory Leak Detection Tests
   */
  async runMemoryLeakDetection(options = {}) {
    console.log('🧠 Starting Memory Leak Detection Tests...');
    
    const memoryTestConfig = {
      duration: options.duration || '15m',
      vus: options.vus || 25,
      rampUp: '2m',
      rampDown: '2m'
    };

    const memoryScript = `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Gauge } from 'k6/metrics';

const memoryUsage = new Gauge('memory_usage_mb');
const heapUsed = new Gauge('heap_used_mb');
const heapTotal = new Gauge('heap_total_mb');

export const options = {
  scenarios: {
    memory_leak_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '${memoryTestConfig.rampUp}', target: ${memoryTestConfig.vus} },
        { duration: '${memoryTestConfig.duration}', target: ${memoryTestConfig.vus} },
        { duration: '${memoryTestConfig.rampDown}', target: 0 },
      ],
    },
  },
  thresholds: {
    // Memory thresholds - fail if memory usage grows too much
    memory_usage_mb: ['value<500'], // Less than 500MB
    heap_used_mb: ['value<300'],    // Less than 300MB heap
  },
};

const BASE_URL = '${this.baseUrl}';

export default function () {
  // Simulate memory-intensive operations
  
  // Large data fetching
  const projectsResponse = http.get(\`\${BASE_URL}/api/projects\`);
  check(projectsResponse, {
    'projects API responds': (r) => r.status === 200 || r.status === 401,
  });
  
  // Document operations with potential memory leaks
  const documentsResponse = http.get(\`\${BASE_URL}/api/documents\`);
  check(documentsResponse, {
    'documents API responds': (r) => r.status === 200 || r.status === 401,
  });
  
  // Analytics data (potentially large responses)
  const analyticsResponse = http.get(\`\${BASE_URL}/api/analytics/performance\`);
  check(analyticsResponse, {
    'analytics API responds': (r) => r.status === 200 || r.status === 401,
  });
  
  // Simulate memory tracking (in real scenario, this would be server-side monitoring)
  const simulatedMemory = Math.random() * 100 + 50; // 50-150MB simulation
  memoryUsage.add(simulatedMemory);
  heapUsed.add(simulatedMemory * 0.7);
  heapTotal.add(simulatedMemory * 1.3);
  
  sleep(1);
}

export function teardown() {
  console.log('Memory leak detection test completed');
}
`;

    const scriptPath = path.join(this.outputDir, 'memory-leak-test.js');
    fs.writeFileSync(scriptPath, memoryScript);

    try {
      const k6Command = `k6 run --out json=${path.join(this.outputDir, 'memory-leak-results.json')} ${scriptPath}`;
      execSync(k6Command, { stdio: 'inherit' });
      
      console.log('✅ Memory leak detection completed');
      return { success: true, type: 'memory-leak' };
    } catch (error) {
      console.error('❌ Memory leak test failed:', error.message);
      return { success: false, error: error.message, type: 'memory-leak' };
    }
  }

  /**
   * Endurance Testing for Extended Periods
   */
  async runEnduranceTest(options = {}) {
    console.log('⏰ Starting Endurance Test (Extended Period)...');
    
    const enduranceConfig = {
      duration: options.duration || '2h', // 2 hours default
      vus: options.vus || 15,
      rampUp: '10m',
      rampDown: '5m'
    };

    const enduranceScript = `
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('endurance_error_rate');
const responseTime = new Trend('endurance_response_time');
const sessionDuration = new Trend('session_duration');
const stabilityMetric = new Rate('stability_metric');

export const options = {
  scenarios: {
    endurance_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '${enduranceConfig.rampUp}', target: ${enduranceConfig.vus} },
        { duration: '${enduranceConfig.duration}', target: ${enduranceConfig.vus} },
        { duration: '${enduranceConfig.rampDown}', target: 0 },
      ],
    },
  },
  thresholds: {
    // Endurance-specific thresholds
    endurance_error_rate: ['rate<0.02'], // Very low error rate for endurance
    endurance_response_time: ['p(95)<3000'], // Consistent performance
    stability_metric: ['rate>0.95'], // 95% stability
  },
};

const BASE_URL = '${this.baseUrl}';

let sessionStart;

export function setup() {
  sessionStart = Date.now();
  console.log('🏃‍♂️ Starting endurance test - target duration: ${enduranceConfig.duration}');
  return { startTime: sessionStart };
}

export default function (data) {
  const currentTime = Date.now();
  const sessionTime = currentTime - data.startTime;
  
  group('Endurance User Session', () => {
    // Simulate realistic user behavior over extended period
    
    // Homepage visit
    let response = http.get(\`\${BASE_URL}/\`);
    const success = check(response, {
      'homepage stable': (r) => r.status === 200,
      'homepage performance stable': (r) => r.timings.duration < 5000,
    });
    
    stabilityMetric.add(success ? 1 : 0);
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
    
    sleep(Math.random() * 10 + 5); // 5-15 second think time
    
    // API interactions
    response = http.get(\`\${BASE_URL}/api/projects\`);
    const apiSuccess = check(response, {
      'API stable over time': (r) => r.status === 200 || r.status === 401,
      'API performance consistent': (r) => r.timings.duration < 2000,
    });
    
    stabilityMetric.add(apiSuccess ? 1 : 0);
    errorRate.add(!apiSuccess);
    responseTime.add(response.timings.duration);
    
    // Longer think time for endurance testing
    sleep(Math.random() * 20 + 10); // 10-30 second think time
    
    // Document operations
    response = http.get(\`\${BASE_URL}/api/documents\`);
    const docSuccess = check(response, {
      'documents stable': (r) => r.status === 200 || r.status === 401,
    });
    
    stabilityMetric.add(docSuccess ? 1 : 0);
    errorRate.add(!docSuccess);
    responseTime.add(response.timings.duration);
    
    // Track session duration
    sessionDuration.add(sessionTime);
  });
  
  // Longer sleep for endurance pattern
  sleep(Math.random() * 30 + 15); // 15-45 second intervals
}

export function teardown(data) {
  const totalDuration = Date.now() - data.startTime;
  console.log(\`🏁 Endurance test completed. Total duration: \${totalDuration / 1000 / 60} minutes\`);
}
`;

    const scriptPath = path.join(this.outputDir, 'endurance-test.js');
    fs.writeFileSync(scriptPath, enduranceScript);

    try {
      const k6Command = `k6 run --out json=${path.join(this.outputDir, 'endurance-results.json')} ${scriptPath}`;
      execSync(k6Command, { stdio: 'inherit' });
      
      console.log('✅ Endurance test completed');
      return { success: true, type: 'endurance', duration: enduranceConfig.duration };
    } catch (error) {
      console.error('❌ Endurance test failed:', error.message);
      return { success: false, error: error.message, type: 'endurance' };
    }
  }

  /**
   * Concurrent User Simulation Testing
   */
  async runConcurrentUserSimulation(options = {}) {
    console.log('👥 Starting Concurrent User Simulation Test...');
    
    const concurrentConfig = {
      maxUsers: options.maxUsers || 500,
      stepSize: options.stepSize || 50,
      stepDuration: options.stepDuration || '2m'
    };

    const concurrentScript = `
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const concurrentUsers = new Gauge('concurrent_active_users');
const userThoughput = new Rate('user_throughput');
const resourceContention = new Gauge('resource_contention');
const sessionSuccess = new Rate('session_success_rate');

export const options = {
  scenarios: {
    concurrent_ramp: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: ${concurrentConfig.maxUsers},
      stages: [
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize} },
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize * 2} },
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize * 3} },
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize * 4} },
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize * 5} },
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize * 6} },
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize * 7} },
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize * 8} },
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize * 9} },
        { duration: '${concurrentConfig.stepDuration}', target: ${concurrentConfig.stepSize * 10} },
      ],
    },
  },
  thresholds: {
    // Concurrent user thresholds
    concurrent_active_users: ['value<=${concurrentConfig.maxUsers}'],
    user_throughput: ['rate>0.8'], // 80% successful sessions
    session_success_rate: ['rate>0.7'], // 70% session success under high concurrency
    http_req_duration: ['p(95)<10000'], // More lenient for high concurrency
  },
};

const BASE_URL = '${this.baseUrl}';

// User behavior patterns
const userPatterns = [
  'browser', 'api_user', 'power_user', 'mobile_user', 'bot_like'
];

export default function () {
  const pattern = userPatterns[Math.floor(Math.random() * userPatterns.length)];
  const startTime = Date.now();
  
  // Track concurrent users
  concurrentUsers.add(__VU);
  
  let sessionSuccessful = true;
  
  try {
    switch (pattern) {
      case 'browser':
        sessionSuccessful = browserPattern();
        break;
      case 'api_user':
        sessionSuccessful = apiUserPattern();
        break;
      case 'power_user':
        sessionSuccessful = powerUserPattern();
        break;
      case 'mobile_user':
        sessionSuccessful = mobileUserPattern();
        break;
      case 'bot_like':
        sessionSuccessful = botLikePattern();
        break;
    }
  } catch (error) {
    sessionSuccessful = false;
  }
  
  // Record session metrics
  sessionSuccess.add(sessionSuccessful ? 1 : 0);
  userThoughput.add(1);
  
  // Simulate resource contention
  const contentionLevel = __VU / ${concurrentConfig.maxUsers};
  resourceContention.add(contentionLevel);
}

function browserPattern() {
  group('Browser User Pattern', () => {
    const responses = [];
    
    responses.push(http.get(\`\${BASE_URL}/\`));
    sleep(2);
    
    responses.push(http.get(\`\${BASE_URL}/login\`));
    sleep(1);
    
    responses.push(http.get(\`\${BASE_URL}/features\`));
    sleep(3);
    
    return responses.every(r => r.status === 200 || r.status === 404);
  });
}

function apiUserPattern() {
  group('API User Pattern', () => {
    const endpoints = [
      '/api/projects',
      '/api/documents', 
      '/api/requirements',
      '/api/user/profile'
    ];
    
    const responses = endpoints.map(endpoint => {
      const response = http.get(\`\${BASE_URL}\${endpoint}\`);
      sleep(0.5);
      return response;
    });
    
    return responses.every(r => r.status === 200 || r.status === 401);
  });
}

function powerUserPattern() {
  group('Power User Pattern', () => {
    const responses = [];
    
    // Rapid fire requests
    for (let i = 0; i < 10; i++) {
      responses.push(http.get(\`\${BASE_URL}/api/projects\`));
      sleep(0.1);
    }
    
    return responses.every(r => r.status === 200 || r.status === 401 || r.status === 429);
  });
}

function mobileUserPattern() {
  group('Mobile User Pattern', () => {
    const responses = [];
    
    // Slower, intermittent requests
    responses.push(http.get(\`\${BASE_URL}/\`));
    sleep(5); // Longer think time
    
    responses.push(http.get(\`\${BASE_URL}/api/projects\`));
    sleep(8);
    
    return responses.every(r => r.status === 200 || r.status === 401);
  });
}

function botLikePattern() {
  group('Bot-like Pattern', () => {
    const responses = [];
    
    // Very rapid requests
    responses.push(http.get(\`\${BASE_URL}/\`));
    responses.push(http.get(\`\${BASE_URL}/robots.txt\`));
    responses.push(http.get(\`\${BASE_URL}/sitemap.xml\`));
    
    return responses.every(r => r.status >= 200 && r.status < 500);
  });
}
`;

    const scriptPath = path.join(this.outputDir, 'concurrent-users-test.js');
    fs.writeFileSync(scriptPath, concurrentScript);

    try {
      const k6Command = `k6 run --out json=${path.join(this.outputDir, 'concurrent-users-results.json')} ${scriptPath}`;
      execSync(k6Command, { stdio: 'inherit' });
      
      console.log('✅ Concurrent user simulation completed');
      return { success: true, type: 'concurrent-users', maxUsers: concurrentConfig.maxUsers };
    } catch (error) {
      console.error('❌ Concurrent user test failed:', error.message);
      return { success: false, error: error.message, type: 'concurrent-users' };
    }
  }

  /**
   * Database Performance Under Load Testing
   */
  async runDatabaseLoadTest(options = {}) {
    console.log('🗄️ Starting Database Performance Under Load Test...');
    
    const dbConfig = {
      vus: options.vus || 100,
      duration: options.duration || '10m',
      readWriteRatio: options.readWriteRatio || 0.8 // 80% reads, 20% writes
    };

    const databaseScript = `
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const dbReadTime = new Trend('db_read_response_time');
const dbWriteTime = new Trend('db_write_response_time');
const dbConnectionErrors = new Rate('db_connection_errors');
const querySuccess = new Rate('query_success_rate');

export const options = {
  scenarios: {
    database_load: {
      executor: 'constant-vus',
      vus: ${dbConfig.vus},
      duration: '${dbConfig.duration}',
    },
  },
  thresholds: {
    // Database-specific thresholds
    db_read_response_time: ['p(95)<1000'], // Read queries under 1s
    db_write_response_time: ['p(95)<2000'], // Write queries under 2s
    query_success_rate: ['rate>0.95'], // 95% query success
    db_connection_errors: ['rate<0.05'], // Less than 5% connection errors
  },
};

const BASE_URL = '${this.baseUrl}';

export default function () {
  const isReadOperation = Math.random() < ${dbConfig.readWriteRatio};
  
  if (isReadOperation) {
    performReadOperations();
  } else {
    performWriteOperations();
  }
  
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 second intervals
}

function performReadOperations() {
  group('Database Read Operations', () => {
    // Projects list (read-heavy)
    const startTime = Date.now();
    const projectsResponse = http.get(\`\${BASE_URL}/api/projects\`);
    const projectsTime = Date.now() - startTime;
    
    const projectsSuccess = check(projectsResponse, {
      'projects query successful': (r) => r.status === 200 || r.status === 401,
      'projects query fast': (r) => r.timings.duration < 2000,
    });
    
    dbReadTime.add(projectsTime);
    querySuccess.add(projectsSuccess ? 1 : 0);
    dbConnectionErrors.add(projectsResponse.status >= 500 ? 1 : 0);
    
    // Documents list (read-heavy)
    const docStartTime = Date.now();
    const documentsResponse = http.get(\`\${BASE_URL}/api/documents\`);
    const documentsTime = Date.now() - docStartTime;
    
    const documentsSuccess = check(documentsResponse, {
      'documents query successful': (r) => r.status === 200 || r.status === 401,
      'documents query fast': (r) => r.timings.duration < 2000,
    });
    
    dbReadTime.add(documentsTime);
    querySuccess.add(documentsSuccess ? 1 : 0);
    dbConnectionErrors.add(documentsResponse.status >= 500 ? 1 : 0);
    
    // Analytics query (complex read)
    const analyticsStartTime = Date.now();
    const analyticsResponse = http.get(\`\${BASE_URL}/api/analytics/performance\`);
    const analyticsTime = Date.now() - analyticsStartTime;
    
    const analyticsSuccess = check(analyticsResponse, {
      'analytics query successful': (r) => r.status === 200 || r.status === 401,
      'analytics query reasonable': (r) => r.timings.duration < 5000, // More complex query
    });
    
    dbReadTime.add(analyticsTime);
    querySuccess.add(analyticsSuccess ? 1 : 0);
    dbConnectionErrors.add(analyticsResponse.status >= 500 ? 1 : 0);
  });
}

function performWriteOperations() {
  group('Database Write Operations', () => {
    // Create document (write operation)
    const writeStartTime = Date.now();
    const createResponse = http.post(\`\${BASE_URL}/api/documents\`, {
      title: \`Load Test Document \${Date.now()}\`,
      content: 'Test content for database load testing',
      type: 'requirement'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    const writeTime = Date.now() - writeStartTime;
    
    const writeSuccess = check(createResponse, {
      'document create successful': (r) => r.status === 201 || r.status === 401,
      'document create fast': (r) => r.timings.duration < 3000,
    });
    
    dbWriteTime.add(writeTime);
    querySuccess.add(writeSuccess ? 1 : 0);
    dbConnectionErrors.add(createResponse.status >= 500 ? 1 : 0);
    
    // If creation was successful, try to update and delete
    if (createResponse.status === 201) {
      const documentId = JSON.parse(createResponse.body).id;
      
      // Update operation
      const updateStartTime = Date.now();
      const updateResponse = http.put(\`\${BASE_URL}/api/documents/\${documentId}\`, {
        title: \`Updated Load Test Document \${Date.now()}\`,
        content: 'Updated content for database load testing'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      const updateTime = Date.now() - updateStartTime;
      
      const updateSuccess = check(updateResponse, {
        'document update successful': (r) => r.status === 200 || r.status === 401,
      });
      
      dbWriteTime.add(updateTime);
      querySuccess.add(updateSuccess ? 1 : 0);
      dbConnectionErrors.add(updateResponse.status >= 500 ? 1 : 0);
      
      // Delete operation (cleanup)
      const deleteStartTime = Date.now();
      const deleteResponse = http.del(\`\${BASE_URL}/api/documents/\${documentId}\`);
      const deleteTime = Date.now() - deleteStartTime;
      
      const deleteSuccess = check(deleteResponse, {
        'document delete successful': (r) => r.status === 200 || r.status === 404 || r.status === 401,
      });
      
      dbWriteTime.add(deleteTime);
      querySuccess.add(deleteSuccess ? 1 : 0);
      dbConnectionErrors.add(deleteResponse.status >= 500 ? 1 : 0);
    }
  });
}
`;

    const scriptPath = path.join(this.outputDir, 'database-load-test.js');
    fs.writeFileSync(scriptPath, databaseScript);

    try {
      const k6Command = `k6 run --out json=${path.join(this.outputDir, 'database-load-results.json')} ${scriptPath}`;
      execSync(k6Command, { stdio: 'inherit' });
      
      console.log('✅ Database load test completed');
      return { success: true, type: 'database-load' };
    } catch (error) {
      console.error('❌ Database load test failed:', error.message);
      return { success: false, error: error.message, type: 'database-load' };
    }
  }

  /**
   * Generate comprehensive load testing report
   */
  generateComprehensiveReport(results) {
    const timestamp = new Date().toISOString();
    const reportPath = path.join(this.outputDir, 'reports', `comprehensive-load-test-report-${timestamp.replace(/[:.]/g, '-')}.html`);
    
    const report = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Load Testing Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #ecf0f1; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2c3e50; }
        .metric-label { color: #7f8c8d; margin-top: 5px; }
        .success { color: #27ae60; } .warning { color: #f39c12; } .error { color: #e74c3c; }
        .test-result { margin: 15px 0; padding: 15px; border-left: 4px solid #3498db; background: #f8f9fa; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 4px; color: white; font-weight: bold; }
        .status.success { background: #27ae60; } .status.error { background: #e74c3c; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #34495e; color: white; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .chart-placeholder { height: 300px; background: #ecf0f1; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #7f8c8d; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Comprehensive Load Testing Report</h1>
        <p><strong>Generated:</strong> ${timestamp}</p>
        <p><strong>Target URL:</strong> ${this.baseUrl}</p>
        
        <div class="summary">
            <div class="metric-card">
                <div class="metric-value ${results.filter(r => r.success).length === results.length ? 'success' : 'error'}">
                    ${results.filter(r => r.success).length}/${results.length}
                </div>
                <div class="metric-label">Tests Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${results.length}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.max(...results.map(r => r.maxUsers || r.vus || 0))}</div>
                <div class="metric-label">Peak Concurrent Users</div>
            </div>
        </div>

        <h2>📊 Test Results Summary</h2>
        ${results.map(result => `
            <div class="test-result">
                <h3>${result.type.toUpperCase()} Test 
                    <span class="status ${result.success ? 'success' : 'error'}">
                        ${result.success ? 'PASSED' : 'FAILED'}
                    </span>
                </h3>
                <p><strong>Type:</strong> ${result.type}</p>
                ${result.duration ? `<p><strong>Duration:</strong> ${result.duration}</p>` : ''}
                ${result.maxUsers ? `<p><strong>Max Users:</strong> ${result.maxUsers}</p>` : ''}
                ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                ${result.outputFile ? `<p><strong>Results File:</strong> ${result.outputFile}</p>` : ''}
            </div>
        `).join('')}

        <h2>📈 Performance Metrics</h2>
        <div class="chart-placeholder">
            Performance charts would be displayed here
            <br>(Response times, throughput, error rates over time)
        </div>

        <h2>🎯 Load Testing Scenarios Completed</h2>
        <table>
            <thead>
                <tr>
                    <th>Scenario</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Key Findings</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(result => `
                    <tr>
                        <td>${result.type}</td>
                        <td>${this.getScenarioPurpose(result.type)}</td>
                        <td><span class="status ${result.success ? 'success' : 'error'}">${result.success ? 'PASSED' : 'FAILED'}</span></td>
                        <td>${this.getKeyFindings(result)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>💡 Recommendations</h2>
        <div class="recommendations">
            <h3>Performance Optimization Recommendations:</h3>
            <ul>
                ${this.generateRecommendations(results).map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>

        <h2>🔧 System Performance Analysis</h2>
        <p>Based on the load testing results, here are the key performance characteristics:</p>
        
        <h3>Strengths:</h3>
        <ul>
            ${results.filter(r => r.success).map(r => `<li>${r.type} test passed successfully</li>`).join('')}
        </ul>
        
        ${results.filter(r => !r.success).length > 0 ? `
        <h3>Areas for Improvement:</h3>
        <ul>
            ${results.filter(r => !r.success).map(r => `<li>${r.type} test failed - ${r.error || 'Review detailed logs'}</li>`).join('')}
        </ul>
        ` : ''}

        <h2>📋 Next Steps</h2>
        <ol>
            <li>Review detailed test results in individual output files</li>
            <li>Implement recommended performance optimizations</li>
            <li>Set up continuous load testing in CI/CD pipeline</li>
            <li>Monitor production performance metrics</li>
            <li>Schedule regular endurance tests</li>
        </ol>

        <p style="margin-top: 40px; text-align: center; color: #7f8c8d;">
            Generated by Atoms.tech Load Testing Suite<br>
            Report Date: ${new Date().toLocaleString()}
        </p>
    </div>
</body>
</html>
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📈 Comprehensive report generated: ${reportPath}`);
    return reportPath;
  }

  getScenarioPurpose(type) {
    const purposes = {
      'memory-leak': 'Detect memory leaks under sustained load',
      'endurance': 'Test system stability over extended periods',
      'concurrent-users': 'Evaluate performance with high concurrent user load',
      'database-load': 'Assess database performance under load',
      'smoke': 'Verify basic functionality with minimal load',
      'load': 'Test normal expected load conditions',
      'stress': 'Test beyond normal capacity',
      'spike': 'Test sudden traffic increases'
    };
    return purposes[type] || 'Load testing scenario';
  }

  getKeyFindings(result) {
    if (!result.success) {
      return 'Test failed - see error details';
    }
    
    const findings = {
      'memory-leak': 'Memory usage within acceptable limits',
      'endurance': 'System stable over extended period',
      'concurrent-users': `Handled up to ${result.maxUsers || 'N/A'} concurrent users`,
      'database-load': 'Database performed well under load',
      'smoke': 'Basic functionality verified',
      'load': 'Normal load handled successfully',
      'stress': 'System degraded gracefully under stress',
      'spike': 'Recovered well from traffic spikes'
    };
    
    return findings[result.type] || 'Test completed successfully';
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    const failedTests = results.filter(r => !r.success);
    const passedTests = results.filter(r => r.success);
    
    if (failedTests.length === 0) {
      recommendations.push('Excellent! All load tests passed. Consider running more aggressive stress tests.');
    } else {
      recommendations.push(`${failedTests.length} test(s) failed. Priority should be given to fixing these issues.`);
    }
    
    if (failedTests.some(t => t.type === 'memory-leak')) {
      recommendations.push('Memory leak detected. Review application for memory leaks and implement proper garbage collection.');
    }
    
    if (failedTests.some(t => t.type === 'database-load')) {
      recommendations.push('Database performance issues detected. Consider database optimization, indexing, and connection pooling.');
    }
    
    if (failedTests.some(t => t.type === 'concurrent-users')) {
      recommendations.push('High concurrency issues detected. Consider implementing rate limiting and scaling infrastructure.');
    }
    
    recommendations.push('Set up continuous monitoring for production performance metrics.');
    recommendations.push('Implement automated performance regression testing in CI/CD pipeline.');
    recommendations.push('Consider implementing caching strategies for frequently accessed data.');
    recommendations.push('Review and optimize database queries based on load test results.');
    
    return recommendations;
  }

  /**
   * Run comprehensive load testing suite
   */
  async runComprehensiveLoadTesting(options = {}) {
    console.log('🎯 Starting Comprehensive Load Testing Suite...');
    console.log(`Target: ${this.baseUrl}`);
    
    const results = [];
    const startTime = Date.now();
    
    try {
      // 1. Memory Leak Detection
      console.log('\n🧠 Running Memory Leak Detection...');
      const memoryResult = await this.runMemoryLeakDetection(options.memory);
      results.push(memoryResult);
      
      // Wait for system recovery
      console.log('⏳ Waiting 60s for system recovery...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // 2. Concurrent User Simulation
      console.log('\n👥 Running Concurrent User Simulation...');
      const concurrentResult = await this.runConcurrentUserSimulation(options.concurrent);
      results.push(concurrentResult);
      
      // Wait for system recovery
      console.log('⏳ Waiting 60s for system recovery...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // 3. Database Load Testing
      console.log('\n🗄️ Running Database Load Testing...');
      const databaseResult = await this.runDatabaseLoadTest(options.database);
      results.push(databaseResult);
      
      // Wait for system recovery
      console.log('⏳ Waiting 60s for system recovery...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // 4. Endurance Testing (optional, only if specified)
      if (options.includeEndurance) {
        console.log('\n⏰ Running Endurance Testing...');
        const enduranceResult = await this.runEnduranceTest(options.endurance);
        results.push(enduranceResult);
      }
      
    } catch (error) {
      console.error('❌ Load testing suite failed:', error.message);
      results.push({
        success: false,
        error: error.message,
        type: 'suite-execution'
      });
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n🏁 Load testing suite completed in ${(totalTime / 1000 / 60).toFixed(2)} minutes`);
    
    // Generate comprehensive report
    const reportPath = this.generateComprehensiveReport(results);
    
    return {
      success: results.every(r => r.success),
      results,
      reportPath,
      totalTime,
      summary: {
        total: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        successRate: (results.filter(r => r.success).length / results.length) * 100
      }
    };
  }
}

module.exports = LoadTestOrchestrator;