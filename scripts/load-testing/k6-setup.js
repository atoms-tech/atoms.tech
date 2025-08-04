/**
 * K6 Load Testing Setup and Utilities
 * Comprehensive k6 configuration and test scenarios
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class K6LoadTesting {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';
    this.outputDir = options.outputDir || './test-results/load-testing';
    this.scenarioConfig = {
      smoke: { vus: 5, duration: '30s' },
      load: { vus: 50, duration: '2m' },
      stress: { vus: 200, duration: '5m' },
      spike: { vus: 500, duration: '1m' },
      soak: { vus: 20, duration: '30m' }
    };
    
    this.setupOutputDirectory();
  }

  setupOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  generateK6Script(scenario = 'load', testConfig = {}) {
    const config = { ...this.scenarioConfig[scenario], ...testConfig };
    
    return `
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Custom metrics for detailed monitoring
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const apiCalls = new Counter('api_calls');
const concurrentUsers = new Gauge('concurrent_users');
const memoryUsage = new Gauge('memory_usage_mb');
const throughput = new Rate('throughput_rps');

// Test configuration
export const options = {
  scenarios: {
    ${scenario}_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: Math.floor(${config.vus} * 0.1) }, // Ramp-up
        { duration: '${config.duration}', target: ${config.vus} }, // Stay at target
        { duration: '30s', target: 0 }, // Ramp-down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // Performance thresholds
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'], // 5% error rate
    error_rate: ['rate<0.05'],
    response_time: ['p(95)<2000'],
    
    // Load-specific thresholds
    ${scenario === 'stress' ? `
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    http_req_failed: ['rate<0.1'], // 10% for stress test
    ` : ''}
    
    ${scenario === 'spike' ? `
    http_req_duration: ['p(95)<10000'],
    http_req_failed: ['rate<0.2'], // 20% for spike test
    ` : ''}
  },
  
  // Resource monitoring
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  userAgent: 'K6LoadTest/${scenario}',
};

const BASE_URL = '${this.baseUrl}';

// Test user data for authentication scenarios
const testUsers = [
  { email: 'loadtest1@atoms.tech', password: 'LoadTest123!' },
  { email: 'loadtest2@atoms.tech', password: 'LoadTest123!' },
  { email: 'loadtest3@atoms.tech', password: 'LoadTest123!' },
  { email: 'loadtest4@atoms.tech', password: 'LoadTest123!' },
  { email: 'loadtest5@atoms.tech', password: 'LoadTest123!' },
];

// Authentication state management
let authTokens = {};

export function setup() {
  console.log('🚀 Starting ${scenario} test with ${config.vus} virtual users');
  console.log('🎯 Target URL:', BASE_URL);
  
  // Pre-authenticate test users for realistic load patterns
  testUsers.forEach((user, index) => {
    try {
      const loginResponse = http.post(\`\${BASE_URL}/api/auth/signin\`, {
        email: user.email,
        password: user.password,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (loginResponse.status === 200) {
        const token = loginResponse.json('access_token');
        if (token) {
          authTokens[user.email] = token;
        }
      }
    } catch (error) {
      console.warn(\`Failed to pre-authenticate user \${user.email}:\`, error.message);
    }
  });
  
  return { authTokens, baseUrl: BASE_URL };
}

export default function (data) {
  // Update concurrent users metric
  concurrentUsers.add(__VU);
  
  // Simulate different user behavior patterns
  const userBehavior = Math.random();
  
  if (userBehavior < 0.4) {
    // 40% - Anonymous browsing
    anonymousBrowsing();
  } else if (userBehavior < 0.7) {
    // 30% - Authenticated user workflow
    authenticatedUserWorkflow(data);
  } else if (userBehavior < 0.9) {
    // 20% - API-heavy operations
    apiHeavyOperations(data);
  } else {
    // 10% - Real-time features testing
    realtimeFeaturesTesting(data);
  }
  
  // Random think time between 1-5 seconds
  sleep(Math.random() * 4 + 1);
}

function anonymousBrowsing() {
  group('Anonymous Browsing', () => {
    // Homepage
    let response = http.get(\`\${BASE_URL}/\`);
    recordMetrics(response, 'homepage');
    
    check(response, {
      'homepage loads': (r) => r.status === 200,
      'homepage loads quickly': (r) => r.timings.duration < 3000,
      'homepage has content': (r) => r.body.length > 1000,
    });
    
    sleep(2);
    
    // Navigate to login page
    response = http.get(\`\${BASE_URL}/login\`);
    recordMetrics(response, 'login_page');
    
    check(response, {
      'login page loads': (r) => r.status === 200,
      'login page loads quickly': (r) => r.timings.duration < 2000,
    });
    
    sleep(1);
    
    // Browse public content
    const publicPages = ['/about', '/features', '/pricing'];
    const randomPage = publicPages[Math.floor(Math.random() * publicPages.length)];
    
    response = http.get(\`\${BASE_URL}\${randomPage}\`);
    recordMetrics(response, 'public_page');
    
    check(response, {
      'public page accessible': (r) => r.status === 200 || r.status === 404,
      'public page responds quickly': (r) => r.timings.duration < 2000,
    });
  });
}

function authenticatedUserWorkflow(data) {
  group('Authenticated User Workflow', () => {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)];
    let authHeaders = {};
    
    // Try to use pre-authenticated token or login
    if (data.authTokens && data.authTokens[user.email]) {
      authHeaders = {
        'Authorization': \`Bearer \${data.authTokens[user.email]}\`,
        'Content-Type': 'application/json',
      };
    } else {
      // Perform login
      const loginResponse = http.post(\`\${BASE_URL}/api/auth/signin\`, {
        email: user.email,
        password: user.password,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      recordMetrics(loginResponse, 'login');
      
      if (loginResponse.status === 200) {
        const token = loginResponse.json('access_token');
        if (token) {
          authHeaders = {
            'Authorization': \`Bearer \${token}\`,
            'Content-Type': 'application/json',
          };
        }
      }
    }
    
    // Dashboard access
    let response = http.get(\`\${BASE_URL}/home\`, { headers: authHeaders });
    recordMetrics(response, 'dashboard');
    
    check(response, {
      'dashboard loads': (r) => r.status === 200,
      'dashboard loads quickly': (r) => r.timings.duration < 3000,
    });
    
    sleep(2);
    
    // Projects list
    response = http.get(\`\${BASE_URL}/api/projects\`, { headers: authHeaders });
    recordMetrics(response, 'projects_list');
    
    check(response, {
      'projects list loads': (r) => r.status === 200,
      'projects API responds quickly': (r) => r.timings.duration < 1000,
    });
    
    sleep(1);
    
    // Document operations
    response = http.get(\`\${BASE_URL}/api/documents\`, { headers: authHeaders });
    recordMetrics(response, 'documents_list');
    
    check(response, {
      'documents list loads': (r) => r.status === 200,
      'documents API responds quickly': (r) => r.timings.duration < 1000,
    });
  });
}

function apiHeavyOperations(data) {
  group('API Heavy Operations', () => {
    const user = testUsers[0]; // Use first user for consistency
    const authHeaders = data.authTokens && data.authTokens[user.email] ? {
      'Authorization': \`Bearer \${data.authTokens[user.email]}\`,
      'Content-Type': 'application/json',
    } : {};
    
    // Multiple API calls in succession
    const apiEndpoints = [
      '/api/projects',
      '/api/documents',
      '/api/requirements',
      '/api/analytics/performance',
      '/api/user/profile',
      '/api/organizations',
    ];
    
    apiEndpoints.forEach(endpoint => {
      const response = http.get(\`\${BASE_URL}\${endpoint}\`, { headers: authHeaders });
      recordMetrics(response, \`api_\${endpoint.split('/').pop()}\`);
      
      check(response, {
        [\`\${endpoint} responds\`]: (r) => r.status === 200 || r.status === 401 || r.status === 403,
        [\`\${endpoint} fast response\`]: (r) => r.timings.duration < 1000,
      });
      
      // Small delay between API calls
      sleep(0.1);
    });
    
    // Batch operations
    const batchCreateResponse = http.post(\`\${BASE_URL}/api/documents/batch\`, {
      documents: [
        { title: 'Load Test Doc 1', content: 'Test content 1' },
        { title: 'Load Test Doc 2', content: 'Test content 2' },
        { title: 'Load Test Doc 3', content: 'Test content 3' },
      ]
    }, { headers: authHeaders });
    
    recordMetrics(batchCreateResponse, 'batch_create');
    
    check(batchCreateResponse, {
      'batch create succeeds': (r) => r.status === 200 || r.status === 201,
      'batch create reasonable time': (r) => r.timings.duration < 5000,
    });
  });
}

function realtimeFeaturesTesting(data) {
  group('Real-time Features', () => {
    // SSE connection simulation
    const eventsResponse = http.get(\`\${BASE_URL}/api/events/stream\`, {
      headers: { 'Accept': 'text/event-stream' },
    });
    
    recordMetrics(eventsResponse, 'sse_connect');
    
    check(eventsResponse, {
      'SSE connection established': (r) => r.status === 200,
      'SSE connects quickly': (r) => r.timings.duration < 2000,
    });
    
    // Simulate WebSocket-like polling for real-time updates
    const pollResponse = http.get(\`\${BASE_URL}/api/realtime/poll\`);
    recordMetrics(pollResponse, 'realtime_poll');
    
    check(pollResponse, {
      'real-time poll responds': (r) => r.status === 200,
      'real-time poll fast': (r) => r.timings.duration < 500,
    });
  });
}

function recordMetrics(response, operation) {
  // Record response time
  responseTime.add(response.timings.duration, { operation });
  
  // Record error rate
  const isError = response.status >= 400;
  errorRate.add(isError, { operation });
  
  // Count API calls
  apiCalls.add(1, { operation });
  
  // Record throughput
  throughput.add(1);
  
  // Memory usage simulation (in real scenario, this would come from monitoring)
  if (Math.random() < 0.1) { // 10% chance to record memory
    memoryUsage.add(Math.random() * 100 + 50); // Simulate 50-150MB usage
  }
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    [\`\${path.join('${this.outputDir}', \`k6-report-${scenario}-\${timestamp}.html\`)}\`]: htmlReport(data),
    [\`\${path.join('${this.outputDir}', \`k6-summary-${scenario}-\${timestamp}.json\`)}\`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

export function teardown(data) {
  console.log('🏁 ${scenario.toUpperCase()} test completed');
  console.log('📊 Total API calls:', data.apiCalls || 'N/A');
  console.log('📈 Check test results in:', '${this.outputDir}');
}
`;
  }

  generateK6Config(scenario = 'load') {
    const scriptPath = path.join(this.outputDir, `k6-${scenario}-test.js`);
    const script = this.generateK6Script(scenario);
    
    fs.writeFileSync(scriptPath, script);
    console.log(`✅ Generated K6 script: ${scriptPath}`);
    
    return scriptPath;
  }

  async runK6Test(scenario = 'load', options = {}) {
    console.log(`🚀 Starting K6 ${scenario} test...`);
    
    // Check if k6 is installed
    try {
      execSync('k6 version', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ K6 not found. Please install K6 first:');
      console.error('   brew install k6  (macOS)');
      console.error('   or visit: https://k6.io/docs/getting-started/installation/');
      return null;
    }
    
    const scriptPath = this.generateK6Config(scenario);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(this.outputDir, `k6-results-${scenario}-${timestamp}.json`);
    
    try {
      const k6Command = [
        'k6 run',
        `--out json=${outputFile}`,
        options.quiet ? '--quiet' : '',
        options.verbose ? '--verbose' : '',
        scriptPath
      ].filter(Boolean).join(' ');
      
      console.log(`📋 Running: ${k6Command}`);
      
      const result = execSync(k6Command, { 
        stdio: 'inherit',
        env: { 
          ...process.env, 
          LOAD_TEST_BASE_URL: this.baseUrl 
        }
      });
      
      console.log(`✅ K6 ${scenario} test completed successfully`);
      console.log(`📊 Results saved to: ${outputFile}`);
      
      return {
        success: true,
        outputFile,
        scriptPath,
        scenario
      };
      
    } catch (error) {
      console.error(`❌ K6 ${scenario} test failed:`, error.message);
      return {
        success: false,
        error: error.message,
        scenario
      };
    }
  }

  async runAllScenarios(options = {}) {
    const results = {};
    const scenarios = options.scenarios || ['smoke', 'load', 'stress'];
    
    console.log(`🚀 Running K6 test suite: ${scenarios.join(', ')}`);
    
    for (const scenario of scenarios) {
      console.log(`\n📋 Starting ${scenario} test...`);
      const result = await this.runK6Test(scenario, options);
      results[scenario] = result;
      
      // Wait between tests to allow system recovery
      if (scenarios.indexOf(scenario) < scenarios.length - 1) {
        console.log('⏳ Waiting 30s for system recovery...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    return results;
  }

  generateInstallScript() {
    const installScript = `#!/bin/bash
# K6 Installation Script for Load Testing

echo "🚀 Installing K6 Load Testing Tool..."

# Detect OS and install K6
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew &> /dev/null; then
        echo "📦 Installing K6 via Homebrew..."
        brew install k6
    else
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "📦 Installing K6 via package manager..."
    
    # Debian/Ubuntu
    if command -v apt &> /dev/null; then
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    
    # CentOS/RHEL/Fedora
    elif command -v yum &> /dev/null; then
        sudo dnf install https://dl.k6.io/rpm/repo.rpm
        sudo dnf install k6
    
    else
        echo "❌ Package manager not supported. Please install K6 manually:"
        echo "   https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
else
    echo "❌ OS not supported. Please install K6 manually:"
    echo "   https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Verify installation
if command -v k6 &> /dev/null; then
    echo "✅ K6 installed successfully!"
    k6 version
else
    echo "❌ K6 installation failed"
    exit 1
fi

echo "🎯 K6 is ready for load testing!"
echo "📚 Quick start:"
echo "   npm run test:load:k6:smoke    # Run smoke test"
echo "   npm run test:load:k6:load     # Run load test"
echo "   npm run test:load:k6:stress   # Run stress test"
`;

    const scriptPath = path.join(this.outputDir, 'install-k6.sh');
    fs.writeFileSync(scriptPath, installScript);
    fs.chmodSync(scriptPath, 0o755);
    
    console.log(`✅ K6 installation script created: ${scriptPath}`);
    return scriptPath;
  }
}

module.exports = K6LoadTesting;