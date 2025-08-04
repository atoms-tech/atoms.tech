/**
 * Load Testing Performance Tests
 * Testing application performance under various load conditions
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

describe('Load Testing Performance Tests', () => {
  const baseUrl = 'http://localhost:3000';
  const reportDir = './test-results/load-testing';
  
  beforeAll(async () => {
    await fs.mkdir(reportDir, { recursive: true });
  });

  describe('Smoke Testing', () => {
    test('should handle minimal load (smoke test)', async () => {
      const testConfig = {
        target: baseUrl,
        phases: [
          { duration: 30, arrivalRate: 1 }
        ]
      };

      const result = await runArtilleryTest('smoke', testConfig);
      
      expect(result.summary.codes['200']).toBeGreaterThan(0);
      expect(result.summary.errors).toBeLessThan(result.summary.codes['200'] * 0.01); // <1% error rate
      
      console.log(`🔥 Smoke Test Results:`);
      console.log(`   Requests: ${result.summary.codes['200']} successful`);
      console.log(`   Errors: ${result.summary.errors}`);
      console.log(`   Response Time P95: ${result.summary.latency.p95}ms`);
      
      expect(result.summary.latency.p95).toBeLessThan(2000); // P95 under 2s
    }, 60000);
  });

  describe('Load Testing', () => {
    test('should handle normal expected load', async () => {
      const testConfig = {
        target: baseUrl,
        phases: [
          { duration: 60, arrivalRate: 1, rampTo: 5 },
          { duration: 120, arrivalRate: 5 },
          { duration: 60, arrivalRate: 5, rampTo: 1 }
        ],
        scenarios: [
          {
            name: 'Homepage Load',
            weight: 40,
            flow: [
              { get: { url: '/' } },
              { think: 2 }
            ]
          },
          {
            name: 'Authentication Flow',
            weight: 30,
            flow: [
              { get: { url: '/login' } },
              { think: 3 }
            ]
          },
          {
            name: 'Dashboard Access',
            weight: 30,
            flow: [
              { get: { url: '/home' } },
              { think: 5 }
            ]
          }
        ]
      };

      const result = await runArtilleryTest('load', testConfig);
      
      expect(result.summary.codes['200']).toBeGreaterThan(0);
      expect(result.summary.errors).toBeLessThan(result.summary.codes['200'] * 0.05); // <5% error rate
      
      console.log(`📊 Load Test Results:`);
      console.log(`   Total Requests: ${result.summary.requestsCompleted}`);
      console.log(`   Successful: ${result.summary.codes['200']}`);
      console.log(`   Errors: ${result.summary.errors}`);
      console.log(`   Average Response Time: ${result.summary.latency.mean}ms`);
      console.log(`   P95 Response Time: ${result.summary.latency.p95}ms`);
      console.log(`   P99 Response Time: ${result.summary.latency.p99}ms`);
      
      // Performance assertions
      expect(result.summary.latency.mean).toBeLessThan(1000); // Average under 1s
      expect(result.summary.latency.p95).toBeLessThan(3000); // P95 under 3s
      expect(result.summary.latency.p99).toBeLessThan(5000); // P99 under 5s
      
      // Throughput assertions
      const throughput = result.summary.requestsCompleted / (testConfig.phases.reduce((sum, phase) => sum + phase.duration, 0));
      expect(throughput).toBeGreaterThan(1); // At least 1 req/sec average
      
      console.log(`   Throughput: ${throughput.toFixed(2)} req/sec`);
    }, 300000); // 5 minutes timeout
  });

  describe('Stress Testing', () => {
    test('should handle above-normal load gracefully', async () => {
      const testConfig = {
        target: baseUrl,
        phases: [
          { duration: 60, arrivalRate: 1, rampTo: 10 },
          { duration: 180, arrivalRate: 10 },
          { duration: 60, arrivalRate: 10, rampTo: 20 },
          { duration: 120, arrivalRate: 20 },
          { duration: 60, arrivalRate: 20, rampTo: 1 }
        ]
      };

      const result = await runArtilleryTest('stress', testConfig);
      
      console.log(`🔥 Stress Test Results:`);
      console.log(`   Total Requests: ${result.summary.requestsCompleted}`);
      console.log(`   Successful: ${result.summary.codes['200'] || 0}`);
      console.log(`   Errors: ${result.summary.errors}`);
      console.log(`   Error Rate: ${((result.summary.errors / result.summary.requestsCompleted) * 100).toFixed(2)}%`);
      console.log(`   P95 Response Time: ${result.summary.latency.p95}ms`);
      console.log(`   Max Response Time: ${result.summary.latency.max}ms`);
      
      // Stress test allows higher error rates but should still function
      expect(result.summary.errors).toBeLessThan(result.summary.requestsCompleted * 0.15); // <15% error rate
      expect(result.summary.latency.p95).toBeLessThan(10000); // P95 under 10s (degraded but functional)
      
      // Should still serve some requests successfully
      expect(result.summary.codes['200'] || 0).toBeGreaterThan(result.summary.requestsCompleted * 0.5);
    }, 600000); // 10 minutes timeout
  });

  describe('Spike Testing', () => {
    test('should handle sudden traffic spikes', async () => {
      const testConfig = {
        target: baseUrl,
        phases: [
          { duration: 30, arrivalRate: 1 },
          { duration: 30, arrivalRate: 25 }, // Sudden spike
          { duration: 30, arrivalRate: 1 }
        ]
      };

      const result = await runArtilleryTest('spike', testConfig);
      
      console.log(`📈 Spike Test Results:`);
      console.log(`   Total Requests: ${result.summary.requestsCompleted}`);
      console.log(`   Successful: ${result.summary.codes['200'] || 0}`);
      console.log(`   Errors: ${result.summary.errors}`);
      console.log(`   Error Rate: ${((result.summary.errors / result.summary.requestsCompleted) * 100).toFixed(2)}%`);
      console.log(`   P95 Response Time: ${result.summary.latency.p95}ms`);
      
      // Spike tests may have higher error rates during the spike
      expect(result.summary.errors).toBeLessThan(result.summary.requestsCompleted * 0.25); // <25% error rate
      
      // Should recover and handle requests
      expect(result.summary.codes['200'] || 0).toBeGreaterThan(0);
    }, 180000); // 3 minutes timeout
  });

  describe('Endurance Testing', () => {
    test('should maintain performance over extended period', async () => {
      const testConfig = {
        target: baseUrl,
        phases: [
          { duration: 120, arrivalRate: 1, rampTo: 3 },
          { duration: 600, arrivalRate: 3 }, // 10 minutes sustained
          { duration: 120, arrivalRate: 3, rampTo: 1 }
        ]
      };

      const result = await runArtilleryTest('endurance', testConfig);
      
      console.log(`⏰ Endurance Test Results:`);
      console.log(`   Total Requests: ${result.summary.requestsCompleted}`);
      console.log(`   Test Duration: ${(testConfig.phases.reduce((sum, phase) => sum + phase.duration, 0) / 60).toFixed(1)} minutes`);
      console.log(`   Successful: ${result.summary.codes['200'] || 0}`);
      console.log(`   Errors: ${result.summary.errors}`);
      console.log(`   Error Rate: ${((result.summary.errors / result.summary.requestsCompleted) * 100).toFixed(2)}%`);
      console.log(`   Average Response Time: ${result.summary.latency.mean}ms`);
      console.log(`   P95 Response Time: ${result.summary.latency.p95}ms`);
      
      // Endurance test should maintain stable performance
      expect(result.summary.errors).toBeLessThan(result.summary.requestsCompleted * 0.05); // <5% error rate
      expect(result.summary.latency.p95).toBeLessThan(5000); // P95 under 5s
      
      // Should not show significant performance degradation
      expect(result.summary.latency.mean).toBeLessThan(2000); // Average under 2s
    }, 900000); // 15 minutes timeout
  });

  describe('API Load Testing', () => {
    test('should handle API endpoint load', async () => {
      const testConfig = {
        target: baseUrl,
        phases: [
          { duration: 60, arrivalRate: 1, rampTo: 8 },
          { duration: 120, arrivalRate: 8 }
        ],
        scenarios: [
          {
            name: 'API Health Check',
            weight: 30,
            flow: [
              { get: { url: '/api/health' } }
            ]
          },
          {
            name: 'Static Assets',
            weight: 40,
            flow: [
              { get: { url: '/_next/static/css/app/layout.css' } }
            ]
          },
          {
            name: 'API Routes',
            weight: 30,
            flow: [
              { get: { url: '/api/auth/session' } }
            ]
          }
        ]
      };

      const result = await runArtilleryTest('api', testConfig);
      
      console.log(`🔌 API Load Test Results:`);
      console.log(`   Total API Requests: ${result.summary.requestsCompleted}`);
      console.log(`   Successful: ${result.summary.codes['200'] || 0}`);
      console.log(`   Errors: ${result.summary.errors}`);
      console.log(`   Average Response Time: ${result.summary.latency.mean}ms`);
      console.log(`   P95 Response Time: ${result.summary.latency.p95}ms`);
      
      // API endpoints should be fast and reliable
      expect(result.summary.errors).toBeLessThan(result.summary.requestsCompleted * 0.02); // <2% error rate
      expect(result.summary.latency.mean).toBeLessThan(500); // Average under 500ms
      expect(result.summary.latency.p95).toBeLessThan(1500); // P95 under 1.5s
    }, 240000); // 4 minutes timeout
  });

  describe('Concurrent User Simulation', () => {
    test('should simulate realistic user behavior', async () => {
      const testConfig = {
        target: baseUrl,
        phases: [
          { duration: 120, arrivalRate: 1, rampTo: 5 },
          { duration: 180, arrivalRate: 5 }
        ],
        scenarios: [
          {
            name: 'New User Journey',
            weight: 25,
            flow: [
              { get: { url: '/' } },
              { think: 3 },
              { get: { url: '/signup' } },
              { think: 5 },
              { get: { url: '/login' } },
              { think: 2 }
            ]
          },
          {
            name: 'Returning User Journey',
            weight: 50,
            flow: [
              { get: { url: '/login' } },
              { think: 2 },
              { get: { url: '/home' } },
              { think: 8 },
              { get: { url: '/org/demo' } },
              { think: 5 }
            ]
          },
          {
            name: 'Browse and Exit',
            weight: 25,
            flow: [
              { get: { url: '/' } },
              { think: 5 },
              { get: { url: '/login' } },
              { think: 2 }
            ]
          }
        ]
      };

      const result = await runArtilleryTest('user-simulation', testConfig);
      
      console.log(`👥 User Simulation Results:`);
      console.log(`   Total User Sessions: ${result.summary.scenariosCompleted || result.summary.requestsCompleted}`);
      console.log(`   Total Page Views: ${result.summary.requestsCompleted}`);
      console.log(`   Successful Requests: ${result.summary.codes['200'] || 0}`);
      console.log(`   Failed Requests: ${result.summary.errors}`);
      console.log(`   Average Session Time: ${result.summary.latency.mean}ms`);
      console.log(`   P95 Response Time: ${result.summary.latency.p95}ms`);
      
      // User simulation should have high success rate
      expect(result.summary.errors).toBeLessThan(result.summary.requestsCompleted * 0.05); // <5% error rate
      expect(result.summary.latency.p95).toBeLessThan(4000); // P95 under 4s
      
      // Calculate pages per session
      const pagesPerSession = result.summary.requestsCompleted / (result.summary.scenariosCompleted || 1);
      console.log(`   Pages per session: ${pagesPerSession.toFixed(1)}`);
      
      expect(pagesPerSession).toBeGreaterThan(1); // At least 1 page per session
    }, 360000); // 6 minutes timeout
  });

  // Helper function to run Artillery tests
  async function runArtilleryTest(testName, config) {
    return new Promise((resolve, reject) => {
      const configPath = path.join(reportDir, `${testName}-config.json`);
      const reportPath = path.join(reportDir, `${testName}-report.json`);
      
      // Write test configuration
      fs.writeFile(configPath, JSON.stringify({ config }, null, 2))
        .then(() => {
          // Run Artillery test
          const artillery = spawn('npx', ['artillery', 'run', configPath, '--output', reportPath], {
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          let stdout = '';
          let stderr = '';
          
          artillery.stdout.on('data', (data) => {
            stdout += data.toString();
          });
          
          artillery.stderr.on('data', (data) => {
            stderr += data.toString();
          });
          
          artillery.on('close', async (code) => {
            try {
              if (code !== 0) {
                console.warn(`⚠️ Artillery exited with code ${code}`);
                console.warn('STDERR:', stderr);
              }
              
              // Try to read the report
              let result;
              try {
                const reportData = await fs.readFile(reportPath, 'utf-8');
                const report = JSON.parse(reportData);
                result = report.aggregate || report;
              } catch (error) {
                // Fallback: parse from stdout
                result = parseArtilleryOutput(stdout);
              }
              
              resolve(result);
            } catch (error) {
              reject(new Error(`Failed to parse Artillery results: ${error.message}`));
            }
          });
          
          artillery.on('error', (error) => {
            reject(new Error(`Failed to run Artillery: ${error.message}`));
          });
        })
        .catch(reject);
    });
  }

  // Helper function to parse Artillery output when JSON report fails
  function parseArtilleryOutput(output) {
    const summary = {
      requestsCompleted: 0,
      codes: {},
      errors: 0,
      latency: {
        mean: 0,
        p95: 0,
        p99: 0,
        max: 0
      }
    };
    
    // Parse basic metrics from text output
    const lines = output.split('\n');
    
    lines.forEach(line => {
      if (line.includes('http.requests:')) {
        const match = line.match(/(\d+)/);
        if (match) summary.requestsCompleted = parseInt(match[1]);
      }
      
      if (line.includes('http.responses:')) {
        const match = line.match(/(\d+)/);
        if (match) summary.codes['200'] = parseInt(match[1]);
      }
      
      if (line.includes('errors:')) {
        const match = line.match(/(\d+)/);
        if (match) summary.errors = parseInt(match[1]);
      }
      
      if (line.includes('response_time:')) {
        // Try to extract response time metrics
        const meanMatch = line.match(/mean:\s*(\d+(?:\.\d+)?)/);
        const p95Match = line.match(/p95:\s*(\d+(?:\.\d+)?)/);
        const p99Match = line.match(/p99:\s*(\d+(?:\.\d+)?)/);
        
        if (meanMatch) summary.latency.mean = parseFloat(meanMatch[1]);
        if (p95Match) summary.latency.p95 = parseFloat(p95Match[1]);
        if (p99Match) summary.latency.p99 = parseFloat(p99Match[1]);
      }
    });
    
    return { summary };
  }
});