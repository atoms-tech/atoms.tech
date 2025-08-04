/**
 * Memory Performance Tests
 * Testing for memory leaks, garbage collection, and memory efficiency
 */

const puppeteer = require('puppeteer');
const MemoryLeakDetector = require('../memory-leak-detector');

describe('Memory Performance Tests', () => {
  let browser;
  let detector;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--enable-precise-memory-info',
        '--js-flags="--expose-gc"'
      ]
    });
    
    detector = new MemoryLeakDetector({
      baseUrl: 'http://localhost:3000',
      testDuration: 60000, // 1 minute for tests
      sampleInterval: 2000, // Sample every 2 seconds
      reportPath: './test-results/memory-test-analysis'
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Memory Leak Detection', () => {
    test('should not have memory leaks during navigation', async () => {
      const page = await browser.newPage();
      
      try {
        // Enable memory monitoring
        await page.evaluateOnNewDocument(() => {
          window.memorySamples = [];
          
          window.collectMemorySample = () => {
            if (performance.memory) {
              const sample = {
                timestamp: Date.now(),
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
              };
              window.memorySamples.push(sample);
              return sample;
            }
            return null;
          };
        });
        
        const routes = ['/', '/login', '/signup', '/home'];
        const memoryData = [];
        
        // Navigate through routes multiple times
        for (let cycle = 0; cycle < 3; cycle++) {
          for (const route of routes) {
            await page.goto(`http://localhost:3000${route}`, {
              waitUntil: 'networkidle0',
              timeout: 15000
            });
            
            // Force garbage collection if available
            try {
              await page.evaluate(() => {
                if (window.gc) window.gc();
              });
            } catch (e) {
              // GC not available
            }
            
            // Collect memory sample
            const sample = await page.evaluate(() => window.collectMemorySample());
            if (sample) {
              memoryData.push({ ...sample, route, cycle });
            }
            
            await page.waitForTimeout(1000);
          }
        }
        
        // Analyze memory growth
        expect(memoryData.length).toBeGreaterThan(0);
        
        const firstSample = memoryData[0];
        const lastSample = memoryData[memoryData.length - 1];
        const memoryGrowth = lastSample.used - firstSample.used;
        const growthPercentage = (memoryGrowth / firstSample.used) * 100;
        
        // Memory growth should be reasonable (less than 50% over the test)
        expect(growthPercentage).toBeLessThan(50);
        
        console.log(`🧠 Memory Analysis:`);
        console.log(`   Initial: ${Math.round(firstSample.used / 1024 / 1024)}MB`);
        console.log(`   Final: ${Math.round(lastSample.used / 1024 / 1024)}MB`);
        console.log(`   Growth: ${Math.round(memoryGrowth / 1024 / 1024)}MB (${growthPercentage.toFixed(1)}%)`);
        
        // Check for concerning spikes
        const maxMemory = Math.max(...memoryData.map(s => s.used));
        const memorySpike = (maxMemory - firstSample.used) / firstSample.used * 100;
        
        expect(memorySpike).toBeLessThan(100); // No more than 100% spike
        
        if (memorySpike > 50) {
          console.warn(`⚠️ Large memory spike detected: ${memorySpike.toFixed(1)}%`);
        }
        
      } finally {
        await page.close();
      }
    }, 60000);

    test('should clean up components properly', async () => {
      const page = await browser.newPage();
      
      try {
        await page.goto('http://localhost:3000/home', {
          waitUntil: 'networkidle0'
        });
        
        // Test component mounting and unmounting
        const componentTest = await page.evaluate(async () => {
          const samples = [];
          
          const collectSample = (label) => {
            if (performance.memory) {
              samples.push({
                timestamp: Date.now(),
                label,
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize
              });
            }
          };
          
          collectSample('initial');
          
          // Simulate component state changes and re-renders
          for (let i = 0; i < 20; i++) {
            // Create temporary DOM elements
            const container = document.createElement('div');
            container.innerHTML = Array.from({ length: 100 }, (_, j) => 
              `<div class="test-component-${i}-${j}">Test content ${i}-${j}</div>`
            ).join('');
            
            document.body.appendChild(container);
            
            // Force a layout
            container.offsetHeight;
            
            // Clean up
            setTimeout(() => {
              container.remove();
            }, 50);
            
            // Collect sample
            if (i % 5 === 0) {
              collectSample(`iteration-${i}`);
            }
            
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          collectSample('final');
          
          // Force garbage collection
          if (window.gc) window.gc();
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          collectSample('after-gc');
          
          return samples;
        });
        
        expect(componentTest.length).toBeGreaterThan(0);
        
        const initial = componentTest.find(s => s.label === 'initial');
        const final = componentTest.find(s => s.label === 'final');
        const afterGC = componentTest.find(s => s.label === 'after-gc');
        
        if (initial && final) {
          const growth = final.used - initial.used;
          const growthMB = growth / 1024 / 1024;
          
          console.log(`🔧 Component cleanup test:`);
          console.log(`   Memory growth: ${growthMB.toFixed(1)}MB`);
          
          // Should not grow more than 10MB during component operations
          expect(growthMB).toBeLessThan(10);
          
          if (afterGC) {
            const gcRecovered = final.used - afterGC.used;
            const gcRecoveredMB = gcRecovered / 1024 / 1024;
            console.log(`   GC recovered: ${gcRecoveredMB.toFixed(1)}MB`);
          }
        }
        
      } finally {
        await page.close();
      }
    }, 45000);
  });

  describe('Form Memory Management', () => {
    test('should not leak memory during form interactions', async () => {
      const page = await browser.newPage();
      
      try {
        await page.goto('http://localhost:3000/login', {
          waitUntil: 'networkidle0'
        });
        
        const formMemoryTest = await page.evaluate(async () => {
          const samples = [];
          
          const collectSample = (label) => {
            if (performance.memory) {
              samples.push({
                timestamp: Date.now(),
                label,
                used: performance.memory.usedJSHeapSize
              });
            }
          };
          
          collectSample('form-start');
          
          // Simulate form interactions
          for (let i = 0; i < 30; i++) {
            const emailInput = document.querySelector('input[type="email"]');
            const passwordInput = document.querySelector('input[type="password"]');
            
            if (emailInput && passwordInput) {
              // Fill form
              emailInput.value = `test${i}@example.com`;
              passwordInput.value = `password${i}`;
              
              // Trigger events
              emailInput.dispatchEvent(new Event('input', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
              
              // Clear form
              emailInput.value = '';
              passwordInput.value = '';
              
              emailInput.dispatchEvent(new Event('input', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            if (i % 10 === 0) {
              collectSample(`form-iteration-${i}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          collectSample('form-end');
          
          return samples;
        });
        
        const start = formMemoryTest.find(s => s.label === 'form-start');
        const end = formMemoryTest.find(s => s.label === 'form-end');
        
        if (start && end) {
          const growth = end.used - start.used;
          const growthMB = growth / 1024 / 1024;
          
          console.log(`📝 Form memory test: ${growthMB.toFixed(1)}MB growth`);
          
          // Form interactions should not cause significant memory growth
          expect(growthMB).toBeLessThan(5);
        }
        
      } finally {
        await page.close();
      }
    }, 30000);
  });

  describe('Event Listener Cleanup', () => {
    test('should clean up event listeners properly', async () => {
      const page = await browser.newPage();
      
      try {
        await page.goto('http://localhost:3000', {
          waitUntil: 'networkidle0'
        });
        
        const eventListenerTest = await page.evaluate(async () => {
          const samples = [];
          let listenerCount = 0;
          
          const collectSample = (label) => {
            if (performance.memory) {
              samples.push({
                timestamp: Date.now(),
                label,
                used: performance.memory.usedJSHeapSize,
                listenerCount
              });
            }
          };
          
          collectSample('listeners-start');
          
          // Add many event listeners
          const listeners = [];
          
          for (let i = 0; i < 100; i++) {
            const element = document.createElement('div');
            element.id = `test-element-${i}`;
            document.body.appendChild(element);
            
            const listener = () => {
              console.log(`Event ${i}`);
            };
            
            element.addEventListener('click', listener);
            listeners.push({ element, listener });
            listenerCount++;
            
            if (i % 25 === 0) {
              collectSample(`listeners-added-${i}`);
            }
          }
          
          collectSample('listeners-peak');
          
          // Remove event listeners
          listeners.forEach(({ element, listener }, i) => {
            element.removeEventListener('click', listener);
            element.remove();
            listenerCount--;
            
            if (i % 25 === 0) {
              collectSample(`listeners-removed-${i}`);
            }
          });
          
          collectSample('listeners-cleaned');
          
          // Force garbage collection
          if (window.gc) window.gc();
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          collectSample('listeners-after-gc');
          
          return samples;
        });
        
        const start = eventListenerTest.find(s => s.label === 'listeners-start');
        const peak = eventListenerTest.find(s => s.label === 'listeners-peak');
        const cleaned = eventListenerTest.find(s => s.label === 'listeners-cleaned');
        const afterGC = eventListenerTest.find(s => s.label === 'listeners-after-gc');
        
        if (start && peak && cleaned) {
          const peakGrowth = (peak.used - start.used) / 1024 / 1024;
          const finalGrowth = (cleaned.used - start.used) / 1024 / 1024;
          
          console.log(`👂 Event listener test:`);
          console.log(`   Peak growth: ${peakGrowth.toFixed(1)}MB`);
          console.log(`   Final growth: ${finalGrowth.toFixed(1)}MB`);
          
          // Should clean up most memory after removing listeners
          const cleanupEfficiency = 1 - (finalGrowth / peakGrowth);
          expect(cleanupEfficiency).toBeGreaterThan(0.7); // At least 70% cleanup
          
          if (afterGC) {
            const gcGrowth = (afterGC.used - start.used) / 1024 / 1024;
            console.log(`   After GC: ${gcGrowth.toFixed(1)}MB`);
          }
        }
        
      } finally {
        await page.close();
      }
    }, 30000);
  });

  describe('Long-term Memory Stability', () => {
    test('should maintain stable memory usage over extended operations', async () => {
      const page = await browser.newPage();
      
      try {
        await page.goto('http://localhost:3000/home', {
          waitUntil: 'networkidle0'
        });
        
        const stabilityTest = await page.evaluate(async () => {
          const samples = [];
          const operations = [
            'scroll',
            'click-navigation',
            'data-operations',
            'dom-manipulation'
          ];
          
          const collectSample = (label) => {
            if (performance.memory) {
              samples.push({
                timestamp: Date.now(),
                label,
                used: performance.memory.usedJSHeapSize
              });
            }
          };
          
          collectSample('stability-start');
          
          // Perform various operations repeatedly
          for (let cycle = 0; cycle < 5; cycle++) {
            for (const operation of operations) {
              switch (operation) {
                case 'scroll':
                  // Simulate scrolling
                  window.scrollTo(0, Math.random() * 1000);
                  break;
                  
                case 'click-navigation':
                  // Simulate clicking navigation elements
                  const navElements = document.querySelectorAll('a, button');
                  if (navElements.length > 0) {
                    const randomElement = navElements[Math.floor(Math.random() * navElements.length)];
                    randomElement.dispatchEvent(new Event('mouseover'));
                    randomElement.dispatchEvent(new Event('mouseout'));
                  }
                  break;
                  
                case 'data-operations':
                  // Simulate data operations
                  const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, data: `item-${i}` }));
                  const filtered = largeArray.filter(item => item.id % 2 === 0);
                  const mapped = filtered.map(item => ({ ...item, processed: true }));
                  // Let GC handle cleanup
                  break;
                  
                case 'dom-manipulation':
                  // Create and destroy DOM elements
                  const container = document.createElement('div');
                  container.innerHTML = Array.from({ length: 50 }, (_, i) => 
                    `<span>Dynamic content ${i}</span>`
                  ).join('');
                  document.body.appendChild(container);
                  
                  setTimeout(() => {
                    container.remove();
                  }, 100);
                  break;
              }
              
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            collectSample(`stability-cycle-${cycle}`);
            
            // Force GC periodically
            if (cycle % 2 === 0 && window.gc) {
              window.gc();
            }
          }
          
          collectSample('stability-end');
          
          return samples;
        });
        
        const start = stabilityTest.find(s => s.label === 'stability-start');
        const end = stabilityTest.find(s => s.label === 'stability-end');
        
        if (start && end) {
          const totalGrowth = (end.used - start.used) / 1024 / 1024;
          
          console.log(`🏃 Long-term stability test: ${totalGrowth.toFixed(1)}MB total growth`);
          
          // Should not grow more than 20MB over extended operations
          expect(totalGrowth).toBeLessThan(20);
          
          // Check for memory stability across cycles
          const cycleData = stabilityTest.filter(s => s.label.includes('stability-cycle-'));
          if (cycleData.length > 2) {
            const firstCycle = cycleData[0];
            const lastCycle = cycleData[cycleData.length - 1];
            const cycleGrowth = (lastCycle.used - firstCycle.used) / 1024 / 1024;
            
            console.log(`   Cycle-to-cycle growth: ${cycleGrowth.toFixed(1)}MB`);
            
            // Memory should be relatively stable across cycles
            expect(cycleGrowth).toBeLessThan(10);
          }
        }
        
      } finally {
        await page.close();
      }
    }, 60000);
  });
});