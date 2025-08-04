/**
 * Core Web Vitals Performance Tests
 * Comprehensive testing of LCP, FID, CLS, and INP metrics
 */

const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

describe('Core Web Vitals Performance Tests', () => {
  let browser;
  let page;
  
  const testUrls = [
    { path: '/', name: 'Landing Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/signup', name: 'Signup Page' },
    { path: '/home', name: 'Home Dashboard' }
  ];
  
  const webVitalsThresholds = {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    inp: { good: 200, needsImprovement: 500 }
  };

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set viewport and device metrics
    await page.setViewport({ width: 1200, height: 800 });
    
    // Inject Web Vitals collection script
    await page.evaluateOnNewDocument(() => {
      window.webVitalsData = {};
      
      // Mock web-vitals library for testing
      window.getCLS = (callback) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              callback({
                name: 'CLS',
                value: entry.value,
                entries: [entry]
              });
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      };
      
      window.getLCP = (callback) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          callback({
            name: 'LCP',
            value: lastEntry.startTime,
            entries: [lastEntry]
          });
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      };
      
      window.getFID = (callback) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            callback({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              entries: [entry]
            });
          }
        });
        observer.observe({ entryTypes: ['first-input'] });
      };
      
      window.getINP = (callback) => {
        // Simplified INP calculation for testing
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const duration = entry.processingEnd - entry.startTime;
            callback({
              name: 'INP',
              value: duration,
              entries: [entry]
            });
          }
        });
        observer.observe({ entryTypes: ['event'] });
      };
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Largest Contentful Paint (LCP)', () => {
    testUrls.forEach(({ path, name }) => {
      test(`${name} should have good LCP (< 2.5s)`, async () => {
        const startTime = performance.now();
        
        await page.goto(`http://localhost:3000${path}`, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        
        // Wait for LCP to be captured
        const lcpData = await page.evaluate(() => {
          return new Promise((resolve) => {
            let lcpValue = null;
            
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              lcpValue = lastEntry.startTime;
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Timeout after 5 seconds
            setTimeout(() => {
              observer.disconnect();
              resolve({
                lcp: lcpValue,
                url: window.location.pathname,
                timestamp: Date.now()
              });
            }, 5000);
          });
        });
        
        const loadTime = performance.now() - startTime;
        
        expect(lcpData.lcp).toBeDefined();
        expect(lcpData.lcp).toBeLessThan(webVitalsThresholds.lcp.good);
        
        // Additional assertions
        expect(loadTime).toBeLessThan(10000); // Page should load within 10s
        
        console.log(`✅ ${name} LCP: ${lcpData.lcp?.toFixed(0)}ms (Load: ${loadTime.toFixed(0)}ms)`);
      }, 60000);
    });
  });

  describe('Cumulative Layout Shift (CLS)', () => {
    testUrls.forEach(({ path, name }) => {
      test(`${name} should have minimal CLS (< 0.1)`, async () => {
        await page.goto(`http://localhost:3000${path}`, {
          waitUntil: 'networkidle0'
        });
        
        // Monitor layout shifts for 3 seconds after load
        const clsData = await page.evaluate(() => {
          return new Promise((resolve) => {
            let clsValue = 0;
            const shifts = [];
            
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                  clsValue += entry.value;
                  shifts.push({
                    value: entry.value,
                    startTime: entry.startTime,
                    sources: entry.sources?.map(source => ({
                      element: source.node?.tagName,
                      previousRect: source.previousRect,
                      currentRect: source.currentRect
                    })) || []
                  });
                }
              }
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
            
            setTimeout(() => {
              observer.disconnect();
              resolve({
                cls: clsValue,
                shifts: shifts,
                url: window.location.pathname
              });
            }, 3000);
          });
        });
        
        expect(clsData.cls).toBeLessThan(webVitalsThresholds.cls.good);
        
        // Log layout shift sources if any
        if (clsData.shifts.length > 0) {
          console.log(`⚠️ ${name} Layout Shifts:`, clsData.shifts);
        }
        
        console.log(`✅ ${name} CLS: ${clsData.cls.toFixed(3)}`);
      }, 30000);
    });
  });

  describe('First Input Delay (FID) / Interaction to Next Paint (INP)', () => {
    testUrls.forEach(({ path, name }) => {
      test(`${name} should have good interactivity`, async () => {
        await page.goto(`http://localhost:3000${path}`, {
          waitUntil: 'networkidle0'
        });
        
        // Simulate user interactions and measure response times
        const interactionData = await page.evaluate(() => {
          return new Promise((resolve) => {
            const interactions = [];
            
            // Set up event timing observer
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'event' || entry.entryType === 'first-input') {
                  const delay = entry.processingStart - entry.startTime;
                  interactions.push({
                    type: entry.name || 'interaction',
                    delay: delay,
                    duration: entry.duration || delay,
                    startTime: entry.startTime
                  });
                }
              }
            });
            
            try {
              observer.observe({ entryTypes: ['event', 'first-input'] });
            } catch (e) {
              // Fallback for browsers that don't support these entry types
            }
            
            // Simulate clicks on interactive elements
            const clickableElements = document.querySelectorAll('button, a, [onclick], [role="button"]');
            let clickIndex = 0;
            
            const simulateInteraction = () => {
              if (clickIndex < clickableElements.length && clickIndex < 3) {
                const element = clickableElements[clickIndex];
                const rect = element.getBoundingClientRect();
                
                if (rect.width > 0 && rect.height > 0) {
                  const clickEvent = new PointerEvent('click', {
                    bubbles: true,
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2
                  });
                  
                  const startTime = performance.now();
                  element.dispatchEvent(clickEvent);
                  
                  // Measure time to next paint (simplified)
                  requestAnimationFrame(() => {
                    const endTime = performance.now();
                    interactions.push({
                      type: 'simulated-click',
                      delay: 0,
                      duration: endTime - startTime,
                      startTime: startTime,
                      element: element.tagName
                    });
                  });
                }
                
                clickIndex++;
                setTimeout(simulateInteraction, 500);
              } else {
                // Finish after interactions or timeout
                setTimeout(() => {
                  observer.disconnect();
                  resolve({
                    interactions: interactions,
                    url: window.location.pathname
                  });
                }, 1000);
              }
            };
            
            // Start simulating interactions after a brief delay
            setTimeout(simulateInteraction, 1000);
          });
        });
        
        // Analyze interaction performance
        const delays = interactionData.interactions.map(i => i.delay).filter(d => d > 0);
        const durations = interactionData.interactions.map(i => i.duration).filter(d => d > 0);
        
        if (delays.length > 0) {
          const maxDelay = Math.max(...delays);
          const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
          
          expect(maxDelay).toBeLessThan(webVitalsThresholds.fid.good);
          expect(avgDelay).toBeLessThan(webVitalsThresholds.fid.good / 2);
          
          console.log(`✅ ${name} Interaction Delays - Max: ${maxDelay.toFixed(1)}ms, Avg: ${avgDelay.toFixed(1)}ms`);
        }
        
        if (durations.length > 0) {
          const maxDuration = Math.max(...durations);
          const avgDuration = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
          
          expect(maxDuration).toBeLessThan(webVitalsThresholds.inp.good);
          
          console.log(`✅ ${name} Interaction Durations - Max: ${maxDuration.toFixed(1)}ms, Avg: ${avgDuration.toFixed(1)}ms`);
        }
      }, 45000);
    });
  });

  describe('Time to First Byte (TTFB)', () => {
    testUrls.forEach(({ path, name }) => {
      test(`${name} should have fast TTFB (< 800ms)`, async () => {
        const response = await page.goto(`http://localhost:3000${path}`, {
          waitUntil: 'domcontentloaded'
        });
        
        // Get navigation timing
        const navigationTiming = await page.evaluate(() => {
          const timing = performance.getEntriesByType('navigation')[0];
          return {
            ttfb: timing.responseStart - timing.requestStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
            loadComplete: timing.loadEventEnd - timing.loadEventStart,
            dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
            tcpConnection: timing.connectEnd - timing.connectStart
          };
        });
        
        expect(navigationTiming.ttfb).toBeLessThan(800); // TTFB should be under 800ms
        expect(navigationTiming.domContentLoaded).toBeLessThan(3000); // DOM ready in 3s
        expect(response.status()).toBe(200);
        
        console.log(`✅ ${name} TTFB: ${navigationTiming.ttfb.toFixed(1)}ms`);
        console.log(`   DOM Content Loaded: ${navigationTiming.domContentLoaded.toFixed(1)}ms`);
      });
    });
  });

  describe('Resource Performance', () => {
    test('should not have render-blocking resources exceeding limits', async () => {
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0'
      });
      
      const resourceData = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const renderBlocking = resources.filter(resource => 
          resource.renderBlockingStatus === 'blocking' ||
          (resource.initiatorType === 'link' && resource.name.includes('.css')) ||
          (resource.initiatorType === 'script' && !resource.name.includes('async'))
        );
        
        return {
          totalResources: resources.length,
          renderBlockingCount: renderBlocking.length,
          renderBlockingSize: renderBlocking.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
          largeResources: resources.filter(r => (r.transferSize || 0) > 100000) // > 100KB
        };
      });
      
      expect(resourceData.renderBlockingCount).toBeLessThan(10); // Max 10 render-blocking resources
      expect(resourceData.renderBlockingSize).toBeLessThan(200000); // Max 200KB render-blocking
      expect(resourceData.largeResources.length).toBeLessThan(5); // Max 5 large resources
      
      console.log(`✅ Render-blocking resources: ${resourceData.renderBlockingCount} (${(resourceData.renderBlockingSize / 1024).toFixed(1)}KB)`);
      
      if (resourceData.largeResources.length > 0) {
        console.log(`⚠️ Large resources detected:`, resourceData.largeResources.map(r => ({
          url: r.name,
          size: Math.round(r.transferSize / 1024) + 'KB'
        })));
      }
    });
  });

  describe('Mobile Performance', () => {
    beforeEach(async () => {
      // Simulate mobile device
      await page.emulate({
        name: 'iPhone 12',
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      // Simulate slower network conditions
      await page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 40 // 40ms RTT
      });
    });

    test('should maintain good Core Web Vitals on mobile', async () => {
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0',
        timeout: 45000
      });
      
      // Collect mobile-specific metrics
      const mobileMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const metrics = {};
          
          // LCP observer
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            metrics.lcp = entries[entries.length - 1]?.startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // CLS observer
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            metrics.cls = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
          
          setTimeout(() => {
            lcpObserver.disconnect();
            clsObserver.disconnect();
            
            // Get navigation timing
            const navigation = performance.getEntriesByType('navigation')[0];
            metrics.ttfb = navigation.responseStart - navigation.requestStart;
            metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
            
            resolve(metrics);
          }, 5000);
        });
      });
      
      // Mobile-adjusted thresholds (more lenient)
      expect(mobileMetrics.lcp).toBeLessThan(3000); // 3s for mobile
      expect(mobileMetrics.cls).toBeLessThan(0.1);
      expect(mobileMetrics.ttfb).toBeLessThan(1200); // 1.2s TTFB for mobile
      expect(mobileMetrics.domContentLoaded).toBeLessThan(5000); // 5s DOM ready
      
      console.log(`✅ Mobile Metrics - LCP: ${mobileMetrics.lcp?.toFixed(0)}ms, CLS: ${mobileMetrics.cls?.toFixed(3)}, TTFB: ${mobileMetrics.ttfb?.toFixed(0)}ms`);
    }, 60000);
  });
});