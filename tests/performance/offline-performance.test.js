/**
 * Offline Performance Testing
 * Tests application performance and functionality when offline
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

describe('Offline Performance Tests', () => {
  let page;
  let browser;
  let context;

  beforeAll(async () => {
    const { chromium } = require('playwright');
    browser = await chromium.launch({
      headless: process.env.CI !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  describe('Service Worker and Cache Performance', () => {
    test('Service worker installation and cache performance', async () => {
      // Navigate to app and wait for service worker registration
      await page.goto('http://localhost:3000');
      
      // Check if service worker is supported and registered
      const swSupport = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });

      if (!swSupport) {
        console.warn('⚠️ Service Worker not supported in test environment');
        return;
      }

      // Wait for service worker registration
      const swRegistered = await page.evaluate(async () => {
        try {
          const registration = await navigator.serviceWorker.ready;
          return registration !== null;
        } catch (error) {
          console.log('Service Worker registration error:', error);
          return false;
        }
      });

      console.log(`Service Worker registered: ${swRegistered}`);

      // Measure cache loading performance
      const cachePerformance = await page.evaluate(async () => {
        if (!('caches' in window)) {
          return { supported: false };
        }

        const startTime = performance.now();
        
        try {
          const cacheNames = await caches.keys();
          const cacheData = {};
          
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            cacheData[cacheName] = {
              requestCount: requests.length,
              urls: requests.slice(0, 5).map(req => req.url), // Sample URLs
            };
          }
          
          const endTime = performance.now();
          
          return {
            supported: true,
            loadTime: endTime - startTime,
            cacheNames,
            cacheData,
            totalCaches: cacheNames.length,
          };
        } catch (error) {
          return {
            supported: true,
            error: error.message,
          };
        }
      });

      console.log('Cache Performance:', cachePerformance);

      if (cachePerformance.supported && !cachePerformance.error) {
        // Cache loading should be fast
        expect(cachePerformance.loadTime).toBeLessThan(1000);
      }
    });

    test('Offline cache hit ratio and performance', async () => {
      // First, visit pages to populate cache
      const testUrls = [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/projects',
      ];

      console.log('📥 Populating cache with initial visits...');
      for (const url of testUrls) {
        await page.goto(url);
        await page.waitForTimeout(2000); // Allow caching
      }

      // Go offline
      await context.setOffline(true);
      console.log('🔌 Network offline - testing cache performance');

      const offlineResults = [];

      for (const url of testUrls) {
        const startTime = Date.now();
        
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded' });
          const endTime = Date.now();
          const loadTime = endTime - startTime;

          // Check if page loaded successfully from cache
          const pageTitle = await page.title();
          const hasContent = await page.evaluate(() => {
            return document.body.innerText.length > 100;
          });

          offlineResults.push({
            url,
            loadTime,
            success: hasContent && pageTitle !== '',
            pageTitle,
            contentLength: hasContent ? await page.evaluate(() => document.body.innerText.length) : 0,
          });

          console.log(`✅ ${url}: ${loadTime}ms, content: ${hasContent}`);

        } catch (error) {
          offlineResults.push({
            url,
            success: false,
            error: error.message,
          });
          console.log(`❌ ${url}: ${error.message}`);
        }
      }

      // Analyze offline performance
      const successfulLoads = offlineResults.filter(r => r.success);
      const avgLoadTime = successfulLoads.length > 0 ? 
        successfulLoads.reduce((sum, r) => sum + r.loadTime, 0) / successfulLoads.length : 0;

      console.log(`📊 Offline Performance Summary:`);
      console.log(`  Success rate: ${successfulLoads.length}/${testUrls.length}`);
      console.log(`  Average load time: ${avgLoadTime.toFixed(2)}ms`);

      // At least half of the pages should work offline
      expect(successfulLoads.length).toBeGreaterThanOrEqual(testUrls.length * 0.5);

      // Offline load times should be reasonable (cache should be fast)
      if (successfulLoads.length > 0) {
        expect(avgLoadTime).toBeLessThan(3000);
      }
    });
  });

  describe('Progressive Web App Features', () => {
    test('PWA manifest and offline capabilities', async () => {
      await page.goto('http://localhost:3000');

      // Check for PWA manifest
      const manifestLink = await page.$('link[rel="manifest"]');
      const hasManifest = manifestLink !== null;

      if (hasManifest) {
        const manifestHref = await manifestLink.getAttribute('href');
        console.log(`📱 PWA Manifest found: ${manifestHref}`);

        // Fetch and validate manifest
        const manifestResponse = await page.evaluate(async (href) => {
          try {
            const response = await fetch(href);
            const manifest = await response.json();
            return { success: true, manifest };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }, manifestHref);

        if (manifestResponse.success) {
          const manifest = manifestResponse.manifest;
          console.log('📱 PWA Manifest validation:');
          console.log(`  Name: ${manifest.name || manifest.short_name}`);
          console.log(`  Theme color: ${manifest.theme_color}`);
          console.log(`  Display: ${manifest.display}`);
          console.log(`  Icons: ${manifest.icons?.length || 0}`);

          // Validate required PWA fields
          expect(manifest.name || manifest.short_name).toBeTruthy();
          expect(manifest.start_url).toBeTruthy();
          expect(manifest.display).toBeTruthy();
          
          if (manifest.icons) {
            expect(manifest.icons.length).toBeGreaterThan(0);
          }
        }
      }

      // Test offline functionality
      await context.setOffline(true);
      
      const offlineCapabilities = await page.evaluate(() => {
        return {
          onlineStatus: navigator.onLine,
          serviceWorkerSupported: 'serviceWorker' in navigator,
          cacheSupported: 'caches' in window,
          indexedDBSupported: 'indexedDB' in window,
        };
      });

      console.log('🔌 Offline Capabilities:', offlineCapabilities);

      // Should detect offline status
      expect(offlineCapabilities.onlineStatus).toBe(false);
    });

    test('Background sync and offline queue functionality', async () => {
      await page.goto('http://localhost:3000');

      // Check for background sync support
      const backgroundSyncSupport = await page.evaluate(() => {
        return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
      });

      console.log(`⏰ Background Sync supported: ${backgroundSyncSupport}`);

      if (backgroundSyncSupport) {
        // Simulate offline actions that should be queued
        await context.setOffline(true);

        // Try to perform actions that would normally require network
        const offlineActions = await page.evaluate(() => {
          const actions = [];
          
          // Simulate form submissions or data updates
          try {
            // This would normally be handled by the app's offline queue
            const mockData = { action: 'update', timestamp: Date.now() };
            localStorage.setItem('offline-queue', JSON.stringify([mockData]));
            actions.push('Data queued for background sync');
          } catch (error) {
            actions.push(`Queue error: ${error.message}`);
          }

          return actions;
        });

        console.log('📤 Offline Actions Queued:', offlineActions);

        // Go back online
        await context.setOffline(false);
        
        // Allow time for background sync to process
        await page.waitForTimeout(3000);

        // Check if queued actions were processed
        const syncResults = await page.evaluate(() => {
          try {
            const queue = localStorage.getItem('offline-queue');
            return {
              queueEmpty: !queue || JSON.parse(queue).length === 0,
              queueContent: queue ? JSON.parse(queue) : [],
            };
          } catch (error) {
            return { error: error.message };
          }
        });

        console.log('🔄 Background Sync Results:', syncResults);
      }
    });
  });

  describe('Offline Performance Metrics', () => {
    test('Cache-first vs network-first performance comparison', async () => {
      const testUrl = 'http://localhost:3000';
      const measurements = [];

      // First load (network-first, populates cache)
      console.log('🌐 Network-first load (cold cache)...');
      const networkFirstStart = Date.now();
      await page.goto(testUrl);
      await page.waitForLoadState('networkidle');
      const networkFirstTime = Date.now() - networkFirstStart;

      measurements.push({
        type: 'network-first',
        loadTime: networkFirstTime,
        cacheState: 'cold',
      });

      // Second load (cache-first, warm cache)
      console.log('💾 Cache-first load (warm cache)...');
      const cacheFirstStart = Date.now();
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      const cacheFirstTime = Date.now() - cacheFirstStart;

      measurements.push({
        type: 'cache-first',
        loadTime: cacheFirstTime,
        cacheState: 'warm',
      });

      // Offline load (cache-only)
      console.log('🔌 Offline load (cache-only)...');
      await context.setOffline(true);
      const offlineStart = Date.now();
      try {
        await page.reload();
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        const offlineTime = Date.now() - offlineStart;

        measurements.push({
          type: 'cache-only',
          loadTime: offlineTime,
          cacheState: 'offline',
        });
      } catch (error) {
        measurements.push({
          type: 'cache-only',
          loadTime: null,
          cacheState: 'offline',
          error: error.message,
        });
      }

      // Analysis
      console.log('📊 Load Time Comparison:');
      measurements.forEach(m => {
        if (m.loadTime) {
          console.log(`  ${m.type}: ${m.loadTime}ms (${m.cacheState})`);
        } else {
          console.log(`  ${m.type}: Failed - ${m.error}`);
        }
      });

      // Calculate performance improvements
      const networkTime = measurements.find(m => m.type === 'network-first')?.loadTime;
      const cacheTime = measurements.find(m => m.type === 'cache-first')?.loadTime;
      const offlineTime = measurements.find(m => m.type === 'cache-only')?.loadTime;

      if (networkTime && cacheTime) {
        const cacheImprovement = ((networkTime - cacheTime) / networkTime) * 100;
        console.log(`🚀 Cache improvement: ${cacheImprovement.toFixed(2)}% faster`);
        
        // Cache should provide meaningful improvement
        expect(cacheImprovement).toBeGreaterThan(10);
      }

      if (offlineTime) {
        console.log(`⚡ Offline load successful: ${offlineTime}ms`);
        
        // Offline load should be reasonably fast
        expect(offlineTime).toBeLessThan(5000);
      }

      // Save performance report
      const report = {
        timestamp: new Date().toISOString(),
        testUrl,
        measurements,
        analysis: {
          networkTime,
          cacheTime,
          offlineTime,
          cacheImprovement: networkTime && cacheTime ? 
            ((networkTime - cacheTime) / networkTime) * 100 : null,
        },
      };

      const reportsDir = path.join(__dirname, '../performance-reports');
      fs.mkdirSync(reportsDir, { recursive: true });
      fs.writeFileSync(
        path.join(reportsDir, 'offline-performance-report.json'),
        JSON.stringify(report, null, 2)
      );
    });

    test('Storage performance and quota management', async () => {
      await page.goto('http://localhost:3000');

      const storageAnalysis = await page.evaluate(async () => {
        const results = {
          timestamp: Date.now(),
          storage: {},
          quota: {},
          performance: {},
        };

        // Check storage API support
        results.storage.apiSupport = {
          localStorage: 'localStorage' in window,
          sessionStorage: 'sessionStorage' in window,
          indexedDB: 'indexedDB' in window,
          caches: 'caches' in window,
          storageManager: 'storage' in navigator,
        };

        // Measure localStorage performance
        if (results.storage.apiSupport.localStorage) {
          const startTime = performance.now();
          
          // Write test data
          for (let i = 0; i < 100; i++) {
            localStorage.setItem(`test-${i}`, JSON.stringify({ data: `test-data-${i}`, timestamp: Date.now() }));
          }
          
          const writeTime = performance.now() - startTime;
          
          // Read test data
          const readStartTime = performance.now();
          for (let i = 0; i < 100; i++) {
            const data = localStorage.getItem(`test-${i}`);
            JSON.parse(data);
          }
          const readTime = performance.now() - readStartTime;
          
          // Cleanup
          for (let i = 0; i < 100; i++) {
            localStorage.removeItem(`test-${i}`);
          }
          
          results.performance.localStorage = {
            write: writeTime,
            read: readTime,
            itemsPerSecond: {
              write: (100 / writeTime) * 1000,
              read: (100 / readTime) * 1000,
            },
          };
        }

        // Check storage quota if supported
        if (results.storage.apiSupport.storageManager) {
          try {
            const estimate = await navigator.storage.estimate();
            results.quota = {
              total: estimate.quota,
              used: estimate.usage,
              available: estimate.quota - estimate.usage,
              usagePercentage: (estimate.usage / estimate.quota) * 100,
            };
          } catch (error) {
            results.quota.error = error.message;
          }
        }

        // Check IndexedDB performance if supported
        if (results.storage.apiSupport.indexedDB) {
          try {
            const dbName = 'performance-test-db';
            const request = indexedDB.open(dbName, 1);
            
            const db = await new Promise((resolve, reject) => {
              request.onerror = () => reject(request.error);
              request.onsuccess = () => resolve(request.result);
              request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const objectStore = db.createObjectStore('test', { keyPath: 'id' });
              };
            });

            const transaction = db.transaction(['test'], 'readwrite');
            const objectStore = transaction.objectStore('test');
            
            const writeStartTime = performance.now();
            
            // Write test data
            for (let i = 0; i < 50; i++) {
              objectStore.add({ id: i, data: `test-data-${i}`, timestamp: Date.now() });
            }
            
            await new Promise((resolve) => {
              transaction.oncomplete = resolve;
            });
            
            const writeTime = performance.now() - writeStartTime;
            
            // Read test data
            const readTransaction = db.transaction(['test'], 'readonly');
            const readObjectStore = readTransaction.objectStore('test');
            const readStartTime = performance.now();
            
            for (let i = 0; i < 50; i++) {
              readObjectStore.get(i);
            }
            
            await new Promise((resolve) => {
              readTransaction.oncomplete = resolve;
            });
            
            const readTime = performance.now() - readStartTime;
            
            results.performance.indexedDB = {
              write: writeTime,
              read: readTime,
              itemsPerSecond: {
                write: (50 / writeTime) * 1000,
                read: (50 / readTime) * 1000,
              },
            };

            // Cleanup
            db.close();
            indexedDB.deleteDatabase(dbName);
            
          } catch (error) {
            results.performance.indexedDB = { error: error.message };
          }
        }

        return results;
      });

      console.log('💾 Storage Performance Analysis:');
      console.log(`API Support:`, storageAnalysis.storage.apiSupport);
      
      if (storageAnalysis.quota.total) {
        console.log(`Storage Quota: ${(storageAnalysis.quota.usagePercentage || 0).toFixed(2)}% used`);
        console.log(`Available: ${(storageAnalysis.quota.available / 1024 / 1024).toFixed(2)} MB`);
      }

      if (storageAnalysis.performance.localStorage) {
        const ls = storageAnalysis.performance.localStorage;
        console.log(`LocalStorage: ${ls.itemsPerSecond.write.toFixed(0)} writes/sec, ${ls.itemsPerSecond.read.toFixed(0)} reads/sec`);
      }

      if (storageAnalysis.performance.indexedDB && !storageAnalysis.performance.indexedDB.error) {
        const idb = storageAnalysis.performance.indexedDB;
        console.log(`IndexedDB: ${idb.itemsPerSecond.write.toFixed(0)} writes/sec, ${idb.itemsPerSecond.read.toFixed(0)} reads/sec`);
      }

      // Performance assertions
      if (storageAnalysis.performance.localStorage) {
        // LocalStorage should handle reasonable throughput
        expect(storageAnalysis.performance.localStorage.itemsPerSecond.write).toBeGreaterThan(1000);
        expect(storageAnalysis.performance.localStorage.itemsPerSecond.read).toBeGreaterThan(2000);
      }

      if (storageAnalysis.quota.usagePercentage) {
        // Should not be using too much storage
        expect(storageAnalysis.quota.usagePercentage).toBeLessThan(80);
      }

      // Save storage analysis report
      const reportsDir = path.join(__dirname, '../performance-reports');
      fs.mkdirSync(reportsDir, { recursive: true });
      fs.writeFileSync(
        path.join(reportsDir, 'storage-performance-report.json'),
        JSON.stringify(storageAnalysis, null, 2)
      );
    });
  });
});