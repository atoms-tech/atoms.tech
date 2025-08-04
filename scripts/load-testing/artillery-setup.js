/**
 * Artillery Load Testing Setup and Configuration
 * Comprehensive Artillery.js setup for HTTP load testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ArtilleryLoadTesting {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';
    this.outputDir = options.outputDir || './test-results/load-testing';
    this.configDir = path.join(__dirname, 'artillery-configs');
    
    this.setupDirectories();
  }

  setupDirectories() {
    [this.outputDir, this.configDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateArtilleryConfig(scenario = 'load') {
    const configs = {
      smoke: {
        phases: [
          { duration: 60, arrivalRate: 1, name: 'Smoke test' }
        ],
        payload: { path: './test-data/smoke-users.csv' }
      },
      
      load: {
        phases: [
          { duration: 120, arrivalRate: 1, rampTo: 10, name: 'Ramp-up' },
          { duration: 300, arrivalRate: 10, name: 'Sustained load' },
          { duration: 60, arrivalRate: 10, rampTo: 1, name: 'Ramp-down' }
        ],
        payload: { path: './test-data/load-users.csv' }
      },
      
      stress: {
        phases: [
          { duration: 60, arrivalRate: 1, rampTo: 20, name: 'Initial ramp' },
          { duration: 180, arrivalRate: 20, name: 'Stress level 1' },
          { duration: 120, arrivalRate: 20, rampTo: 50, name: 'Stress ramp' },
          { duration: 300, arrivalRate: 50, name: 'Peak stress' },
          { duration: 120, arrivalRate: 50, rampTo: 1, name: 'Recovery' }
        ],
        payload: { path: './test-data/stress-users.csv' }
      },
      
      spike: {
        phases: [
          { duration: 60, arrivalRate: 1, name: 'Baseline' },
          { duration: 30, arrivalRate: 100, name: 'Spike' },
          { duration: 60, arrivalRate: 1, name: 'Recovery' }
        ],
        payload: { path: './test-data/spike-users.csv' }
      },
      
      soak: {
        phases: [
          { duration: 300, arrivalRate: 1, rampTo: 15, name: 'Ramp-up' },
          { duration: 1800, arrivalRate: 15, name: 'Soak test - 30 min' },
          { duration: 300, arrivalRate: 15, rampTo: 1, name: 'Ramp-down' }
        ],
        payload: { path: './test-data/soak-users.csv' }
      }
    };

    const config = {
      config: {
        target: this.baseUrl,
        phases: configs[scenario].phases,
        
        // Global settings
        defaults: {
          headers: {
            'User-Agent': `Artillery/${scenario}-test`,
            'Accept': 'application/json, text/html, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
          }
        },
        
        // Performance budgets and thresholds
        ensure: {
          p95: 2000,    // 95th percentile response time < 2s
          p99: 5000,    // 99th percentile response time < 5s
          maxErrorRate: 5  // Error rate < 5%
        },
        
        // Plugins for enhanced reporting
        plugins: {
          'artillery-plugin-metrics-by-endpoint': {
            useOnlyRequestNames: true
          },
          'artillery-plugin-memory-usage': {},
          'artillery-plugin-publish-metrics': {
            type: 'datadog',
            tags: [`scenario:${scenario}`, 'service:atoms-tech']
          }
        },
        
        // Custom processor for advanced logic
        processor: './artillery-processor.js',
        
        // Test data
        payload: configs[scenario].payload,
        
        // Variables for templating
        variables: {
          baseUrl: this.baseUrl,
          scenario: scenario,
          timestamp: Date.now()
        }
      },
      
      scenarios: [
        // Anonymous user browsing (40% of traffic)
        {
          name: 'Anonymous Browsing',
          weight: 40,
          flow: [
            // Homepage visit
            {
              get: {
                url: '/',
                capture: [
                  { json: '$', as: 'homepage' },
                  { header: 'set-cookie', as: 'sessionCookie' }
                ],
                expect: [
                  { statusCode: 200 },
                  { contentType: 'text/html' }
                ]
              }
            },
            { think: 3 },
            
            // Browse features
            {
              get: {
                url: '/features',
                expect: [{ statusCode: [200, 404] }]
              }
            },
            { think: 2 },
            
            // Visit login page
            {
              get: {
                url: '/login',
                capture: [
                  { json: '$', as: 'loginPage' }
                ],
                expect: [{ statusCode: 200 }]
              }
            },
            { think: 5 }
          ]
        },
        
        // User authentication flow (25% of traffic)
        {
          name: 'Authentication Flow',
          weight: 25,
          flow: [
            // Get login page
            {
              get: {
                url: '/login',
                capture: [
                  { json: '$', as: 'loginPage' },
                  { header: 'set-cookie', as: 'csrfCookie' }
                ]
              }
            },
            { think: 2 },
            
            // Attempt login
            {
              post: {
                url: '/api/auth/signin',
                json: {
                  email: '{{ email }}',
                  password: '{{ password }}'
                },
                capture: [
                  { json: '$.access_token', as: 'authToken' },
                  { json: '$.user.id', as: 'userId' }
                ],
                expect: [
                  { statusCode: [200, 401, 422] }
                ]
              }
            },
            { think: 1 },
            
            // If authenticated, access dashboard
            {
              get: {
                url: '/home',
                headers: {
                  'Authorization': 'Bearer {{ authToken }}'
                },
                ifTrue: '{{ authToken }}',
                expect: [{ statusCode: [200, 401] }]
              }
            }
          ]
        },
        
        // Authenticated user workflow (20% of traffic)
        {
          name: 'Dashboard Operations',
          weight: 20,
          beforeRequest: 'ensureAuthenticated',
          flow: [
            // Dashboard home
            {
              get: {
                url: '/home',
                headers: {
                  'Authorization': 'Bearer {{ authToken }}'
                },
                capture: [
                  { json: '$', as: 'dashboard' }
                ]
              }
            },
            { think: 3 },
            
            // Projects list
            {
              get: {
                url: '/api/projects',
                headers: {
                  'Authorization': 'Bearer {{ authToken }}'
                },
                capture: [
                  { json: '$[0].id', as: 'firstProjectId' }
                ]
              }
            },
            { think: 2 },
            
            // Documents list
            {
              get: {
                url: '/api/documents',
                headers: {
                  'Authorization': 'Bearer {{ authToken }}'
                },
                capture: [
                  { json: '$', as: 'documents' }
                ]
              }
            },
            { think: 2 },
            
            // User profile
            {
              get: {
                url: '/api/user/profile',
                headers: {
                  'Authorization': 'Bearer {{ authToken }}'
                }
              }
            }
          ]
        },
        
        // CRUD operations (10% of traffic)
        {
          name: 'CRUD Operations',
          weight: 10,
          beforeRequest: 'ensureAuthenticated',
          flow: [
            // Create new document
            {
              post: {
                url: '/api/documents',
                headers: {
                  'Authorization': 'Bearer {{ authToken }}',
                  'Content-Type': 'application/json'
                },
                json: {
                  title: 'Load Test Document {{ $timestamp() }}',
                  content: 'This is a test document created during load testing.',
                  type: 'requirement'
                },
                capture: [
                  { json: '$.id', as: 'newDocumentId' }
                ]
              }
            },
            { think: 2 },
            
            // Read the created document
            {
              get: {
                url: '/api/documents/{{ newDocumentId }}',
                headers: {
                  'Authorization': 'Bearer {{ authToken }}'
                },
                ifTrue: '{{ newDocumentId }}'
              }
            },
            { think: 1 },
            
            // Update the document
            {
              put: {
                url: '/api/documents/{{ newDocumentId }}',
                headers: {
                  'Authorization': 'Bearer {{ authToken }}',
                  'Content-Type': 'application/json'
                },
                json: {
                  title: 'Updated Load Test Document {{ $timestamp() }}',
                  content: 'This document has been updated during load testing.'
                },
                ifTrue: '{{ newDocumentId }}'
              }
            },
            { think: 1 },
            
            // Delete the document (cleanup)
            {
              delete: {
                url: '/api/documents/{{ newDocumentId }}',
                headers: {
                  'Authorization': 'Bearer {{ authToken }}'
                },
                ifTrue: '{{ newDocumentId }}'
              }
            }
          ]
        },
        
        // API stress testing (5% of traffic)
        {
          name: 'API Stress Test',
          weight: 5,
          beforeRequest: 'ensureAuthenticated',
          flow: [
            // Rapid API calls
            {
              get: {
                url: '/api/projects',
                headers: { 'Authorization': 'Bearer {{ authToken }}' }
              }
            },
            {
              get: {
                url: '/api/documents',
                headers: { 'Authorization': 'Bearer {{ authToken }}' }
              }
            },
            {
              get: {
                url: '/api/requirements',
                headers: { 'Authorization': 'Bearer {{ authToken }}' }
              }
            },
            {
              get: {
                url: '/api/analytics/performance',
                headers: { 'Authorization': 'Bearer {{ authToken }}' }
              }
            },
            {
              get: {
                url: '/api/user/settings',
                headers: { 'Authorization': 'Bearer {{ authToken }}' }
              }
            },
            { think: 0.5 }
          ]
        }
      ]
    };

    return config;
  }

  generateArtilleryProcessor() {
    return `/**
 * Artillery Custom Processor
 * Advanced logic for authentication and custom metrics
 */

const crypto = require('crypto');

// Authentication state management
const authTokens = new Map();
const userCredentials = [
  { email: 'loadtest1@atoms.tech', password: 'LoadTest123!' },
  { email: 'loadtest2@atoms.tech', password: 'LoadTest123!' },
  { email: 'loadtest3@atoms.tech', password: 'LoadTest123!' },
  { email: 'loadtest4@atoms.tech', password: 'LoadTest123!' },
  { email: 'loadtest5@atoms.tech', password: 'LoadTest123!' }
];

module.exports = {
  // Custom functions for scenarios
  ensureAuthenticated,
  generateTestData,
  validateResponse,
  
  // Metrics collection
  collectCustomMetrics,
  
  // Setup and teardown
  setupPhase,
  teardownPhase
};

/**
 * Ensure user is authenticated before making requests
 */
function ensureAuthenticated(requestParams, context, ee, next) {
  // If already authenticated, continue
  if (context.vars.authToken) {
    return next();
  }
  
  // Get random user credentials
  const user = userCredentials[Math.floor(Math.random() * userCredentials.length)];
  
  // Check if we have a cached token for this user
  const cachedToken = authTokens.get(user.email);
  if (cachedToken) {
    context.vars.authToken = cachedToken;
    context.vars.email = user.email;
    return next();
  }
  
  // Set user credentials for authentication
  context.vars.email = user.email;
  context.vars.password = user.password;
  
  next();
}

/**
 * Generate dynamic test data
 */
function generateTestData(requestParams, context, ee, next) {
  // Generate unique identifiers
  context.vars.uniqueId = crypto.randomBytes(8).toString('hex');
  context.vars.timestamp = Date.now();
  context.vars.randomString = Math.random().toString(36).substring(7);
  
  // Generate realistic document content
  context.vars.documentTitle = \`Test Document \${context.vars.uniqueId}\`;
  context.vars.documentContent = \`This is test content generated at \${new Date().toISOString()}\`;
  
  next();
}

/**
 * Validate API responses and collect metrics
 */
function validateResponse(requestParams, response, context, ee, next) {
  // Response time metrics
  const responseTime = response.timings?.phases?.total || 0;
  ee.emit('counter', 'custom.response_time', responseTime);
  
  // Status code metrics
  ee.emit('counter', \`custom.status_\${response.statusCode}\`, 1);
  
  // Error tracking
  if (response.statusCode >= 400) {
    ee.emit('counter', 'custom.errors', 1);
    ee.emit('counter', \`custom.error_\${response.statusCode}\`, 1);
  } else {
    ee.emit('counter', 'custom.success', 1);
  }
  
  // Authentication token caching
  if (response.statusCode === 200 && requestParams.url?.includes('/auth/signin')) {
    try {
      const responseBody = JSON.parse(response.body);
      if (responseBody.access_token) {
        const email = context.vars.email;
        authTokens.set(email, responseBody.access_token);
        context.vars.authToken = responseBody.access_token;
        context.vars.userId = responseBody.user?.id;
        
        ee.emit('counter', 'custom.authentication_success', 1);
      }
    } catch (error) {
      ee.emit('counter', 'custom.authentication_parse_error', 1);
    }
  }
  
  // Memory usage tracking (simulated)
  if (Math.random() < 0.1) { // 10% sampling
    const memoryUsage = process.memoryUsage();
    ee.emit('histogram', 'custom.memory_heap_used', memoryUsage.heapUsed / 1024 / 1024);
    ee.emit('histogram', 'custom.memory_heap_total', memoryUsage.heapTotal / 1024 / 1024);
  }
  
  next();
}

/**
 * Collect custom metrics during test execution
 */
function collectCustomMetrics(requestParams, response, context, ee, next) {
  // Throughput calculation
  ee.emit('counter', 'custom.requests_total', 1);
  
  // Endpoint-specific metrics
  const endpoint = requestParams.url?.split('/').slice(-2).join('/') || 'unknown';
  ee.emit('counter', \`custom.endpoint_\${endpoint}\`, 1);
  
  // User session tracking
  if (context.vars.userId) {
    ee.emit('counter', 'custom.active_sessions', 1);
  }
  
  next();
}

/**
 * Setup phase for test initialization
 */
function setupPhase(context, ee, next) {
  console.log('🚀 Artillery test phase starting...');
  
  // Pre-authenticate some users for better performance
  const preAuthPromises = userCredentials.slice(0, 2).map(async (user) => {
    try {
      const response = await fetch(\`\${context.vars.target}/api/auth/signin\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          authTokens.set(user.email, data.access_token);
          console.log(\`✅ Pre-authenticated user: \${user.email}\`);
        }
      }
    } catch (error) {
      console.log(\`⚠️ Failed to pre-authenticate \${user.email}:\`, error.message);
    }
  });
  
  Promise.all(preAuthPromises).then(() => {
    console.log(\`📊 Pre-authenticated \${authTokens.size} users\`);
    next();
  });
}

/**
 * Teardown phase for cleanup
 */
function teardownPhase(context, ee, next) {
  console.log('🏁 Artillery test phase completed');
  console.log(\`👥 Total authenticated users: \${authTokens.size}\`);
  
  // Clear authentication cache
  authTokens.clear();
  
  next();
}

// Helper function for generating random data
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Export for Artillery
module.exports.randomChoice = randomChoice;
`;
  }

  generateTestData() {
    const testUsers = [
      { email: 'loadtest1@atoms.tech', password: 'LoadTest123!' },
      { email: 'loadtest2@atoms.tech', password: 'LoadTest123!' },
      { email: 'loadtest3@atoms.tech', password: 'LoadTest123!' },
      { email: 'loadtest4@atoms.tech', password: 'LoadTest123!' },
      { email: 'loadtest5@atoms.tech', password: 'LoadTest123!' },
      { email: 'loadtest6@atoms.tech', password: 'LoadTest123!' },
      { email: 'loadtest7@atoms.tech', password: 'LoadTest123!' },
      { email: 'loadtest8@atoms.tech', password: 'LoadTest123!' },
      { email: 'loadtest9@atoms.tech', password: 'LoadTest123!' },
      { email: 'loadtest10@atoms.tech', password: 'LoadTest123!' }
    ];

    // Generate CSV files for different scenarios
    const scenarios = ['smoke', 'load', 'stress', 'spike', 'soak'];
    const dataDir = path.join(this.outputDir, 'test-data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    scenarios.forEach(scenario => {
      const csvContent = [
        'email,password',
        ...testUsers.map(user => `${user.email},${user.password}`)
      ].join('\n');
      
      const csvPath = path.join(dataDir, `${scenario}-users.csv`);
      fs.writeFileSync(csvPath, csvContent);
    });

    console.log(`✅ Generated test data for Artillery scenarios`);
    return dataDir;
  }

  async runArtilleryTest(scenario = 'load', options = {}) {
    console.log(`🚀 Starting Artillery ${scenario} test...`);
    
    // Check if Artillery is installed
    try {
      execSync('artillery version', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ Artillery not found. Installing Artillery...');
      try {
        execSync('npm install -g artillery', { stdio: 'inherit' });
        console.log('✅ Artillery installed successfully');
      } catch (installError) {
        console.error('❌ Failed to install Artillery:', installError.message);
        return null;
      }
    }

    // Generate configurations
    const config = this.generateArtilleryConfig(scenario);
    const processor = this.generateArtilleryProcessor();
    this.generateTestData();
    
    // Write configuration files
    const configPath = path.join(this.configDir, `${scenario}-config.yml`);
    const processorPath = path.join(this.configDir, 'artillery-processor.js');
    
    // Convert config to YAML
    const yaml = this.objectToYaml(config);
    fs.writeFileSync(configPath, yaml);
    fs.writeFileSync(processorPath, processor);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(this.outputDir, `artillery-results-${scenario}-${timestamp}.json`);
    const reportFile = path.join(this.outputDir, `artillery-report-${scenario}-${timestamp}.html`);

    try {
      const artilleryCommand = [
        'artillery run',
        configPath,
        '--output', outputFile,
        options.quiet ? '--quiet' : '',
        options.verbose ? '--verbose' : ''
      ].filter(Boolean).join(' ');
      
      console.log(`📋 Running: ${artilleryCommand}`);
      
      execSync(artilleryCommand, { 
        stdio: 'inherit',
        env: { 
          ...process.env, 
          LOAD_TEST_BASE_URL: this.baseUrl 
        }
      });
      
      // Generate HTML report
      if (fs.existsSync(outputFile)) {
        const reportCommand = `artillery report ${outputFile} --output ${reportFile}`;
        execSync(reportCommand, { stdio: 'inherit' });
      }
      
      console.log(`✅ Artillery ${scenario} test completed successfully`);
      console.log(`📊 Results: ${outputFile}`);
      console.log(`📈 Report: ${reportFile}`);
      
      return {
        success: true,
        outputFile,
        reportFile,
        configPath,
        scenario
      };
      
    } catch (error) {
      console.error(`❌ Artillery ${scenario} test failed:`, error.message);
      return {
        success: false,
        error: error.message,
        scenario
      };
    }
  }

  objectToYaml(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += this.objectToYaml(item, indent + 2).replace(/^/gm, '    ');
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  async runAllScenarios(options = {}) {
    const results = {};
    const scenarios = options.scenarios || ['smoke', 'load', 'stress'];
    
    console.log(`🚀 Running Artillery test suite: ${scenarios.join(', ')}`);
    
    for (const scenario of scenarios) {
      console.log(`\n📋 Starting ${scenario} test...`);
      const result = await this.runArtilleryTest(scenario, options);
      results[scenario] = result;
      
      // Wait between tests for system recovery
      if (scenarios.indexOf(scenario) < scenarios.length - 1) {
        console.log('⏳ Waiting 30s for system recovery...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    return results;
  }
}

module.exports = ArtilleryLoadTesting;