/**
 * Load Testing Configuration
 * Artillery.js and K6 configuration for comprehensive load testing
 */

// Artillery.js Configuration
const artilleryConfig = {
  config: {
    target: 'http://localhost:3000',
    phases: [
      // Warm-up phase
      {
        duration: 60,
        arrivalRate: 1,
        name: 'Warm-up'
      },
      // Ramp-up phase
      {
        duration: 120,
        arrivalRate: 1,
        rampTo: 10,
        name: 'Ramp-up'
      },
      // Sustained load
      {
        duration: 300,
        arrivalRate: 10,
        name: 'Sustained load'
      },
      // Peak load
      {
        duration: 60,
        arrivalRate: 20,
        name: 'Peak load'
      },
      // Spike test
      {
        duration: 30,
        arrivalRate: 50,
        name: 'Spike test'
      },
      // Cool-down
      {
        duration: 60,
        arrivalRate: 1,
        name: 'Cool-down'
      }
    ],
    defaults: {
      headers: {
        'User-Agent': 'Artillery Load Test',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    },
    processor: './tests/performance/load-test-processor.js',
    plugins: {
      'artillery-plugin-metrics-by-endpoint': {
        useOnlyRequestNames: true
      }
    }
  },
  scenarios: [
    // Homepage load test
    {
      name: 'Homepage Navigation',
      weight: 30,
      flow: [
        {
          get: {
            url: '/',
            capture: [
              {
                json: '$',
                as: 'homepage'
              }
            ]
          }
        },
        {
          think: 3
        }
      ]
    },
    
    // Authentication flow
    {
      name: 'Authentication Flow',
      weight: 20,
      flow: [
        {
          get: {
            url: '/login',
            capture: [
              {
                json: '$',
                as: 'loginPage'
              }
            ]
          }
        },
        {
          post: {
            url: '/api/auth/signin',
            json: {
              email: '{{ $randomEmail() }}',
              password: 'testPassword123'
            },
            capture: [
              {
                json: '$.token',
                as: 'authToken'
              }
            ]
          }
        },
        {
          think: 2
        }
      ]
    },
    
    // Dashboard interaction
    {
      name: 'Dashboard Interaction',
      weight: 25,
      flow: [
        {
          get: {
            url: '/home',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        {
          get: {
            url: '/api/projects',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        {
          think: 5
        }
      ]
    },
    
    // Project management
    {
      name: 'Project Management',
      weight: 15,
      flow: [
        {
          post: {
            url: '/api/projects',
            json: {
              name: 'Load Test Project {{ $randomString() }}',
              description: 'Test project for load testing'
            },
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            capture: [
              {
                json: '$.id',
                as: 'projectId'
              }
            ]
          }
        },
        {
          get: {
            url: '/org/{{ orgId }}/project/{{ projectId }}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        {
          think: 4
        }
      ]
    },
    
    // API stress test
    {
      name: 'API Endpoints',
      weight: 10,
      flow: [
        {
          get: {
            url: '/api/documents',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        {
          get: {
            url: '/api/requirements',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        {
          get: {
            url: '/api/analytics/performance',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        {
          think: 1
        }
      ]
    }
  ]
};

// K6 Configuration
const k6Config = `
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const apiCalls = new Counter('api_calls');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp-up
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 20 },   // Ramp to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],      // Error rate under 10%
    error_rate: ['rate<0.1'],
    response_time: ['p(95)<2000'],
  },
};

// Base URL
const BASE_URL = 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
];

export default function () {
  group('Homepage Load', () => {
    const response = http.get(\`\${BASE_URL}/\`);
    check(response, {
      'homepage loads': (r) => r.status === 200,
      'homepage response time ok': (r) => r.timings.duration < 2000,
    });
    responseTime.add(response.timings.duration);
    errorRate.add(response.status !== 200);
    sleep(1);
  });

  group('Authentication Flow', () => {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)];
    
    // Login page
    let response = http.get(\`\${BASE_URL}/login\`);
    check(response, {
      'login page loads': (r) => r.status === 200,
    });
    
    // Authentication
    response = http.post(\`\${BASE_URL}/api/auth/signin\`, {
      email: user.email,
      password: user.password,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(response, {
      'authentication succeeds': (r) => r.status === 200,
      'auth response time ok': (r) => r.timings.duration < 3000,
    });
    
    apiCalls.add(1);
    responseTime.add(response.timings.duration);
    errorRate.add(response.status !== 200);
    sleep(2);
  });

  group('Dashboard Operations', () => {
    const response = http.get(\`\${BASE_URL}/home\`);
    check(response, {
      'dashboard loads': (r) => r.status === 200,
      'dashboard response time ok': (r) => r.timings.duration < 3000,
    });
    responseTime.add(response.timings.duration);
    errorRate.add(response.status !== 200);
    sleep(3);
  });

  group('API Performance', () => {
    const endpoints = [
      '/api/projects',
      '/api/documents',
      '/api/requirements',
      '/api/analytics/performance'
    ];
    
    endpoints.forEach(endpoint => {
      const response = http.get(\`\${BASE_URL}\${endpoint}\`);
      check(response, {
        [\`\${endpoint} responds\`]: (r) => r.status === 200 || r.status === 401,
        [\`\${endpoint} response time ok\`]: (r) => r.timings.duration < 1000,
      });
      
      apiCalls.add(1);
      responseTime.add(response.timings.duration);
      errorRate.add(response.status >= 400 && response.status !== 401);
    });
    
    sleep(1);
  });
}

export function teardown(data) {
  console.log('Load test completed');
  console.log('Total API calls:', apiCalls.count);
}
`;

// Load test scenarios for different use cases
const loadTestScenarios = {
  // Smoke test - minimal load
  smoke: {
    phases: [
      { duration: 60, arrivalRate: 1 }
    ],
    target: 'http://localhost:3000'
  },
  
  // Load test - normal expected load
  load: {
    phases: [
      { duration: 120, arrivalRate: 1, rampTo: 10 },
      { duration: 300, arrivalRate: 10 },
      { duration: 120, arrivalRate: 10, rampTo: 1 }
    ],
    target: 'http://localhost:3000'
  },
  
  // Stress test - above normal load
  stress: {
    phases: [
      { duration: 120, arrivalRate: 1, rampTo: 20 },
      { duration: 300, arrivalRate: 20 },
      { duration: 300, arrivalRate: 30 },
      { duration: 120, arrivalRate: 30, rampTo: 1 }
    ],
    target: 'http://localhost:3000'
  },
  
  // Spike test - sudden load increase
  spike: {
    phases: [
      { duration: 60, arrivalRate: 1 },
      { duration: 60, arrivalRate: 50 },
      { duration: 60, arrivalRate: 1 }
    ],
    target: 'http://localhost:3000'
  },
  
  // Volume test - large amount of data
  volume: {
    phases: [
      { duration: 600, arrivalRate: 15 }
    ],
    target: 'http://localhost:3000'
  },
  
  // Soak test - extended period
  soak: {
    phases: [
      { duration: 300, arrivalRate: 1, rampTo: 5 },
      { duration: 1800, arrivalRate: 5 }, // 30 minutes
      { duration: 300, arrivalRate: 5, rampTo: 1 }
    ],
    target: 'http://localhost:3000'
  }
};

module.exports = {
  artillery: artilleryConfig,
  k6: k6Config,
  scenarios: loadTestScenarios
};