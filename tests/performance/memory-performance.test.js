/**
 * Memory Performance Tests
 * Comprehensive memory usage analysis and leak detection
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

describe('Memory Performance Tests', () => {
  let initialMemory;
  let memorySnapshots = [];

  beforeEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    initialMemory = process.memoryUsage();
    memorySnapshots = [];
  });

  afterEach(() => {
    // Log memory usage summary
    const finalMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      external: finalMemory.external - initialMemory.external,
      arrayBuffers: finalMemory.arrayBuffers - initialMemory.arrayBuffers,
    };

    console.log('Memory Usage Summary:', {
      heapUsedDelta: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotalDelta: `${(memoryDelta.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      externalDelta: `${(memoryDelta.external / 1024 / 1024).toFixed(2)}MB`,
      arrayBuffersDelta: `${(memoryDelta.arrayBuffers / 1024 / 1024).toFixed(2)}MB`,
    });
  });

  const takeMemorySnapshot = (label) => {
    const snapshot = {
      label,
      timestamp: Date.now(),
      memory: process.memoryUsage(),
    };
    memorySnapshots.push(snapshot);
    return snapshot;
  };

  const analyzeMemoryGrowth = () => {
    if (memorySnapshots.length < 2) return null;

    const growth = [];
    for (let i = 1; i < memorySnapshots.length; i++) {
      const prev = memorySnapshots[i - 1];
      const current = memorySnapshots[i];
      
      growth.push({
        from: prev.label,
        to: current.label,
        heapUsedGrowth: current.memory.heapUsed - prev.memory.heapUsed,
        heapTotalGrowth: current.memory.heapTotal - prev.memory.heapTotal,
        externalGrowth: current.memory.external - prev.memory.external,
        arrayBuffersGrowth: current.memory.arrayBuffers - prev.memory.arrayBuffers,
        timeDelta: current.timestamp - prev.timestamp,
      });
    }

    return growth;
  };

  const createMemoryIntensiveTask = (size = 1000) => {
    const data = [];
    for (let i = 0; i < size; i++) {
      data.push({
        id: i,
        content: `Content for item ${i}`,
        metadata: {
          timestamp: Date.now(),
          random: Math.random(),
          tags: Array.from({ length: 10 }, (_, j) => `tag-${j}`),
        },
        largeString: 'x'.repeat(1000), // 1KB string
      });
    }
    return data;
  };

  describe('Baseline Memory Tests', () => {
    test('Initial memory usage is reasonable', () => {
      const memory = process.memoryUsage();
      const heapUsedMB = memory.heapUsed / 1024 / 1024;
      const heapTotalMB = memory.heapTotal / 1024 / 1024;

      console.log('Initial Memory Usage:', {
        heapUsedMB: heapUsedMB.toFixed(2),
        heapTotalMB: heapTotalMB.toFixed(2),
        externalMB: (memory.external / 1024 / 1024).toFixed(2),
        arrayBuffersMB: (memory.arrayBuffers / 1024 / 1024).toFixed(2),
      });

      // Initial memory should be reasonable
      expect(heapUsedMB).toBeLessThan(100); // < 100MB initial heap
      expect(heapTotalMB).toBeLessThan(200); // < 200MB total heap
    });

    test('Memory usage after garbage collection', () => {
      takeMemorySnapshot('before-gc');
      
      // Create some temporary objects
      const tempData = createMemoryIntensiveTask(5000);
      takeMemorySnapshot('after-allocation');
      
      // Clear references
      tempData.length = 0;
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      takeMemorySnapshot('after-gc');
      
      const growth = analyzeMemoryGrowth();
      console.log('Garbage Collection Analysis:', growth);
      
      // Memory should be freed after GC
      const beforeGC = memorySnapshots[0].memory.heapUsed;
      const afterGC = memorySnapshots[2].memory.heapUsed;
      const memoryFreed = (beforeGC - afterGC) / 1024 / 1024;
      
      // Some memory should be freed (allowing for some growth)
      expect(afterGC).toBeLessThan(beforeGC + 10 * 1024 * 1024); // Within 10MB of original
    });
  });

  describe('Memory Leak Detection', () => {
    test('No memory leaks in repeated operations', () => {
      const iterations = 100;
      const snapshots = [];
      
      for (let i = 0; i < iterations; i++) {
        // Perform memory-intensive operation
        const data = createMemoryIntensiveTask(100);
        
        // Process data
        const processed = data.map(item => ({
          ...item,
          processed: true,
        }));
        
        // Clear references
        data.length = 0;
        processed.length = 0;
        
        // Take snapshot every 10 iterations
        if (i % 10 === 0) {
          snapshots.push({
            iteration: i,
            memory: process.memoryUsage(),
          });
        }
      }
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      // Analyze memory growth over iterations
      const firstSnapshot = snapshots[0];
      const lastSnapshot = snapshots[snapshots.length - 1];
      const heapGrowth = lastSnapshot.memory.heapUsed - firstSnapshot.memory.heapUsed;
      const heapGrowthMB = heapGrowth / 1024 / 1024;
      
      console.log('Memory Leak Detection:', {
        iterations,
        heapGrowthMB: heapGrowthMB.toFixed(2),
        snapshots: snapshots.length,
        firstHeapMB: (firstSnapshot.memory.heapUsed / 1024 / 1024).toFixed(2),
        lastHeapMB: (lastSnapshot.memory.heapUsed / 1024 / 1024).toFixed(2),
      });
      
      // Memory growth should be minimal
      expect(heapGrowthMB).toBeLessThan(20); // < 20MB growth over 100 iterations
    });

    test('Event listener memory leaks', () => {
      const EventEmitter = require('events');
      const emitter = new EventEmitter();
      
      takeMemorySnapshot('before-listeners');
      
      // Add many event listeners
      const listeners = [];
      for (let i = 0; i < 1000; i++) {
        const listener = () => {
          // Simulate processing
          const data = { id: i, timestamp: Date.now() };
          return data;
        };
        listeners.push(listener);
        emitter.on('test', listener);
      }
      
      takeMemorySnapshot('after-listeners');
      
      // Emit events
      for (let i = 0; i < 100; i++) {
        emitter.emit('test');
      }
      
      takeMemorySnapshot('after-emissions');
      
      // Remove listeners
      listeners.forEach(listener => {
        emitter.off('test', listener);
      });
      
      takeMemorySnapshot('after-cleanup');
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      takeMemorySnapshot('after-gc');
      
      const growth = analyzeMemoryGrowth();
      console.log('Event Listener Memory Analysis:', growth);
      
      // Memory should be freed after cleanup
      const beforeListeners = memorySnapshots[0].memory.heapUsed;
      const afterCleanup = memorySnapshots[4].memory.heapUsed;
      const memoryDelta = (afterCleanup - beforeListeners) / 1024 / 1024;
      
      expect(memoryDelta).toBeLessThan(5); // < 5MB difference after cleanup
    });

    test('Closure memory leaks', () => {
      takeMemorySnapshot('before-closures');
      
      const closures = [];
      
      // Create closures that capture large objects
      for (let i = 0; i < 1000; i++) {
        const largeObject = createMemoryIntensiveTask(10);
        
        const closure = () => {
          return largeObject.length;
        };
        
        closures.push(closure);
      }
      
      takeMemorySnapshot('after-closures');
      
      // Clear closure references
      closures.length = 0;
      
      takeMemorySnapshot('after-cleanup');
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      takeMemorySnapshot('after-gc');
      
      const growth = analyzeMemoryGrowth();
      console.log('Closure Memory Analysis:', growth);
      
      // Memory should be freed after cleanup
      const beforeClosures = memorySnapshots[0].memory.heapUsed;
      const afterGC = memorySnapshots[3].memory.heapUsed;
      const memoryFreed = (beforeClosures - afterGC) / 1024 / 1024;
      
      // Most memory should be freed
      expect(afterGC).toBeLessThan(beforeClosures + 20 * 1024 * 1024); // Within 20MB
    });
  });

  describe('Memory Usage Patterns', () => {
    test('Memory usage during data processing', () => {
      const dataSizes = [100, 500, 1000, 5000, 10000];
      const processingResults = [];
      
      for (const size of dataSizes) {
        takeMemorySnapshot(`before-${size}`);
        
        // Create and process data
        const data = createMemoryIntensiveTask(size);
        const processed = data
          .filter(item => item.id % 2 === 0)
          .map(item => ({
            ...item,
            processed: true,
            hash: item.id.toString(16),
          }))
          .sort((a, b) => a.id - b.id);
        
        takeMemorySnapshot(`after-${size}`);
        
        processingResults.push({
          size,
          originalDataLength: data.length,
          processedDataLength: processed.length,
          memoryUsage: process.memoryUsage(),
        });
        
        // Clear references
        data.length = 0;
        processed.length = 0;
      }
      
      console.log('Data Processing Memory Usage:');
      processingResults.forEach(result => {
        console.log(`Size ${result.size}: ${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      });
      
      // Memory usage should scale reasonably with data size
      const smallSize = processingResults[0];
      const largeSize = processingResults[processingResults.length - 1];
      const memorySizeRatio = largeSize.memoryUsage.heapUsed / smallSize.memoryUsage.heapUsed;
      const dataSizeRatio = largeSize.size / smallSize.size;
      
      // Memory should scale roughly linearly with data size (within reasonable bounds)
      expect(memorySizeRatio).toBeLessThan(dataSizeRatio * 2); // Memory growth should be reasonable
    });

    test('Memory usage during concurrent operations', async () => {
      const concurrentTasks = 50;
      const taskPromises = [];
      
      takeMemorySnapshot('before-concurrent');
      
      // Create concurrent memory-intensive tasks
      for (let i = 0; i < concurrentTasks; i++) {
        const taskPromise = new Promise((resolve) => {
          setTimeout(() => {
            const data = createMemoryIntensiveTask(100);
            const result = data.reduce((sum, item) => sum + item.id, 0);
            resolve(result);
          }, Math.random() * 100);
        });
        
        taskPromises.push(taskPromise);
      }
      
      takeMemorySnapshot('during-concurrent');
      
      // Wait for all tasks to complete
      await Promise.all(taskPromises);
      
      takeMemorySnapshot('after-concurrent');
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      takeMemorySnapshot('after-gc');
      
      const growth = analyzeMemoryGrowth();
      console.log('Concurrent Operations Memory Analysis:', growth);
      
      // Memory should be freed after tasks complete
      const beforeConcurrent = memorySnapshots[0].memory.heapUsed;
      const afterGC = memorySnapshots[3].memory.heapUsed;
      const memoryDelta = (afterGC - beforeConcurrent) / 1024 / 1024;
      
      expect(memoryDelta).toBeLessThan(30); // < 30MB difference after concurrent tasks
    });
  });

  describe('Memory Profiling', () => {
    test('Memory allocation patterns', () => {
      const allocations = [];
      
      // Simulate different allocation patterns
      const patterns = [
        { name: 'small-frequent', size: 10, count: 1000 },
        { name: 'medium-batch', size: 100, count: 100 },
        { name: 'large-single', size: 1000, count: 10 },
      ];
      
      patterns.forEach(pattern => {
        takeMemorySnapshot(`before-${pattern.name}`);
        
        const startTime = performance.now();
        const data = [];
        
        for (let i = 0; i < pattern.count; i++) {
          data.push(createMemoryIntensiveTask(pattern.size));
        }
        
        const endTime = performance.now();
        takeMemorySnapshot(`after-${pattern.name}`);
        
        allocations.push({
          pattern: pattern.name,
          allocationTime: endTime - startTime,
          memoryUsage: process.memoryUsage(),
          totalObjects: pattern.count * pattern.size,
        });
        
        // Clear references
        data.length = 0;
      });
      
      console.log('Memory Allocation Patterns:');
      allocations.forEach(allocation => {
        console.log(`${allocation.pattern}: ${allocation.allocationTime.toFixed(2)}ms, ${(allocation.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      });
      
      // All allocation patterns should complete within reasonable time
      allocations.forEach(allocation => {
        expect(allocation.allocationTime).toBeLessThan(5000); // < 5 seconds
      });
    });

    test('Memory fragmentation analysis', () => {
      const fragmentationTest = [];
      
      // Create fragmentation by allocating and deallocating in patterns
      for (let cycle = 0; cycle < 10; cycle++) {
        takeMemorySnapshot(`cycle-${cycle}-start`);
        
        // Allocate large chunks
        const largeChunks = [];
        for (let i = 0; i < 10; i++) {
          largeChunks.push(createMemoryIntensiveTask(500));
        }
        
        takeMemorySnapshot(`cycle-${cycle}-allocated`);
        
        // Deallocate every other chunk
        for (let i = 0; i < largeChunks.length; i += 2) {
          largeChunks[i].length = 0;
        }
        
        takeMemorySnapshot(`cycle-${cycle}-partial-dealloc`);
        
        // Allocate small chunks
        const smallChunks = [];
        for (let i = 0; i < 20; i++) {
          smallChunks.push(createMemoryIntensiveTask(50));
        }
        
        takeMemorySnapshot(`cycle-${cycle}-small-allocated`);
        
        // Clear all references
        largeChunks.length = 0;
        smallChunks.length = 0;
        
        takeMemorySnapshot(`cycle-${cycle}-end`);
        
        fragmentationTest.push({
          cycle,
          finalMemory: process.memoryUsage(),
        });
      }
      
      console.log('Memory Fragmentation Analysis:');
      fragmentationTest.forEach(test => {
        console.log(`Cycle ${test.cycle}: ${(test.finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      });
      
      // Memory usage should stabilize and not grow excessively
      const firstCycle = fragmentationTest[0];
      const lastCycle = fragmentationTest[fragmentationTest.length - 1];
      const memoryGrowth = (lastCycle.finalMemory.heapUsed - firstCycle.finalMemory.heapUsed) / 1024 / 1024;
      
      expect(memoryGrowth).toBeLessThan(50); // < 50MB growth over fragmentation cycles
    });
  });

  describe('Memory Monitoring', () => {
    test('Memory usage thresholds', () => {
      const thresholds = {
        heapUsed: 150 * 1024 * 1024, // 150MB
        heapTotal: 300 * 1024 * 1024, // 300MB
        external: 50 * 1024 * 1024, // 50MB
        arrayBuffers: 20 * 1024 * 1024, // 20MB
      };
      
      const memory = process.memoryUsage();
      
      console.log('Memory Threshold Check:', {
        heapUsedMB: (memory.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memory.heapTotal / 1024 / 1024).toFixed(2),
        externalMB: (memory.external / 1024 / 1024).toFixed(2),
        arrayBuffersMB: (memory.arrayBuffers / 1024 / 1024).toFixed(2),
      });
      
      // Check all thresholds
      Object.keys(thresholds).forEach(key => {
        expect(memory[key]).toBeLessThan(thresholds[key]);
      });
    });

    test('Memory growth rate analysis', () => {
      const measurements = [];
      const measurementInterval = 100; // ms
      const totalMeasurements = 50;
      
      let measurementCount = 0;
      
      const measureMemory = () => {
        measurements.push({
          timestamp: Date.now(),
          memory: process.memoryUsage(),
        });
        
        measurementCount++;
        
        if (measurementCount < totalMeasurements) {
          setTimeout(measureMemory, measurementInterval);
        }
      };
      
      // Start measurements
      measureMemory();
      
      // Wait for measurements to complete
      return new Promise((resolve) => {
        const checkComplete = () => {
          if (measurementCount >= totalMeasurements) {
            // Analyze growth rate
            const growthRates = [];
            
            for (let i = 1; i < measurements.length; i++) {
              const prev = measurements[i - 1];
              const current = measurements[i];
              const timeDelta = current.timestamp - prev.timestamp;
              const heapDelta = current.memory.heapUsed - prev.memory.heapUsed;
              
              growthRates.push({
                timeDelta,
                heapDelta,
                growthRate: heapDelta / timeDelta, // bytes per ms
              });
            }
            
            const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate.growthRate, 0) / growthRates.length;
            const maxGrowthRate = Math.max(...growthRates.map(rate => rate.growthRate));
            
            console.log('Memory Growth Rate Analysis:', {
              measurements: measurements.length,
              avgGrowthRateKBPerSec: (avgGrowthRate * 1000 / 1024).toFixed(2),
              maxGrowthRateKBPerSec: (maxGrowthRate * 1000 / 1024).toFixed(2),
            });
            
            // Growth rate should be reasonable
            expect(avgGrowthRate * 1000 / 1024).toBeLessThan(100); // < 100KB/sec average growth
            expect(maxGrowthRate * 1000 / 1024).toBeLessThan(1000); // < 1MB/sec max growth
            
            resolve();
          } else {
            setTimeout(checkComplete, measurementInterval);
          }
        };
        
        checkComplete();
      });
    }, 10000); // 10 second timeout
  });
});