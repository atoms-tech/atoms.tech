/**
 * Component Performance Tests
 * Tests for React component render performance and optimization
 */

import React, { Profiler, ProfilerOnRenderCallback } from 'react';
import { render, screen, act } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { TestProviders } from '@/test-utils';

// Mock components to test performance
const PerformanceTestProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Performance measurement utilities
const measureComponentPerformance = (
  component: React.ReactElement,
  testName: string,
  iterations: number = 100
) => {
  const renderTimes: number[] = [];
  let totalRenderTime = 0;
  let renderCount = 0;

  const onRender: ProfilerOnRenderCallback = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
    interactions: Set<{ id: number; name: string; timestamp: number }>
  ) => {
    renderTimes.push(actualDuration);
    totalRenderTime += actualDuration;
    renderCount++;
  };

  const wrappedComponent = (
    <Profiler id={testName} onRender={onRender}>
      <PerformanceTestProviders>
        {component}
      </PerformanceTestProviders>
    </Profiler>
  );

  // Perform multiple renders to get average
  for (let i = 0; i < iterations; i++) {
    render(wrappedComponent);
  }

  const avgRenderTime = totalRenderTime / renderCount;
  const maxRenderTime = Math.max(...renderTimes);
  const minRenderTime = Math.min(...renderTimes);

  return {
    avgRenderTime,
    maxRenderTime,
    minRenderTime,
    totalRenderTime,
    renderCount,
    renderTimes,
  };
};

// Memory usage measurement
const measureMemoryUsage = (callback: () => void) => {
  const initialMemory = process.memoryUsage();
  
  callback();
  
  const finalMemory = process.memoryUsage();
  
  return {
    heapUsedDelta: finalMemory.heapUsed - initialMemory.heapUsed,
    heapTotalDelta: finalMemory.heapTotal - initialMemory.heapTotal,
    externalDelta: finalMemory.external - initialMemory.external,
    arrayBuffersDelta: finalMemory.arrayBuffers - initialMemory.arrayBuffers,
    initial: initialMemory,
    final: finalMemory,
  };
};

// Mock data generators
const generateLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    title: `Item ${i}`,
    description: `Description for item ${i}`,
    timestamp: new Date().toISOString(),
    metadata: {
      category: `Category ${i % 10}`,
      priority: i % 3,
      tags: [`tag${i % 5}`, `tag${(i + 1) % 5}`],
    },
  }));
};

describe('Component Performance Tests', () => {
  beforeEach(() => {
    // Clear any existing performance marks
    performance.clearMarks();
    performance.clearMeasures();
  });

  describe('Basic Component Render Performance', () => {
    test('HomePage component renders within performance budget', async () => {
      // Mock HomePage component since we don't have the exact import
      const HomePage = () => (
        <div>
          <h1>Home Page</h1>
          <div>Welcome to Atoms.tech</div>
        </div>
      );

      const results = measureComponentPerformance(
        <HomePage />,
        'HomePage',
        50
      );

      // Performance budgets
      expect(results.avgRenderTime).toBeLessThan(16); // < 16ms for 60fps
      expect(results.maxRenderTime).toBeLessThan(50); // < 50ms max
      expect(results.renderCount).toBeGreaterThan(0);

      console.log('HomePage Performance:', {
        avgRenderTime: `${results.avgRenderTime.toFixed(2)}ms`,
        maxRenderTime: `${results.maxRenderTime.toFixed(2)}ms`,
        renderCount: results.renderCount,
      });
    });

    test('Complex table component performance', async () => {
      const TableComponent = ({ data }: { data: any[] }) => (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id || `row-${index}`}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{item.description}</td>
                <td>{item.metadata.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      const data = generateLargeDataset(100);
      const results = measureComponentPerformance(
        <TableComponent data={data} />,
        'TableComponent',
        20
      );

      // Performance budgets for complex components
      expect(results.avgRenderTime).toBeLessThan(100); // < 100ms for complex table
      expect(results.maxRenderTime).toBeLessThan(200); // < 200ms max

      console.log('Table Component Performance:', {
        avgRenderTime: `${results.avgRenderTime.toFixed(2)}ms`,
        maxRenderTime: `${results.maxRenderTime.toFixed(2)}ms`,
        dataSize: data.length,
      });
    });

    test('Virtual scrolling performance', async () => {
      const VirtualList = ({ items }: { items: any[] }) => {
        const [visibleItems, setVisibleItems] = React.useState(items.slice(0, 10));

        return (
          <div style={{ height: '300px', overflow: 'auto' }}>
            {visibleItems.map((item, index) => (
              <div key={item.id || `item-${index}`} style={{ height: '50px', padding: '10px' }}>
                {item.title}
              </div>
            ))}
          </div>
        );
      };

      const data = generateLargeDataset(1000);
      const results = measureComponentPerformance(
        <VirtualList items={data} />,
        'VirtualList',
        30
      );

      // Virtual scrolling should be fast even with large datasets
      expect(results.avgRenderTime).toBeLessThan(50); // < 50ms
      expect(results.maxRenderTime).toBeLessThan(100); // < 100ms max

      console.log('Virtual List Performance:', {
        avgRenderTime: `${results.avgRenderTime.toFixed(2)}ms`,
        maxRenderTime: `${results.maxRenderTime.toFixed(2)}ms`,
        dataSize: data.length,
      });
    });
  });

  describe('Memory Usage Tests', () => {
    test('Component memory usage stays within bounds', () => {
      const TestComponent = ({ data }: { data: any[] }) => (
        <div>
          {data.map((item, index) => (
            <div key={item.id || `item-${index}`}>{item.title}</div>
          ))}
        </div>
      );

      const data = generateLargeDataset(500);
      
      const memoryUsage = measureMemoryUsage(() => {
        for (let i = 0; i < 10; i++) {
          render(<TestComponent data={data} />);
        }
      });

      // Memory usage should be reasonable
      const heapUsedMB = memoryUsage.heapUsedDelta / (1024 * 1024);
      expect(heapUsedMB).toBeLessThan(50); // < 50MB

      console.log('Memory Usage:', {
        heapUsedDelta: `${heapUsedMB.toFixed(2)}MB`,
        heapTotalDelta: `${(memoryUsage.heapTotalDelta / (1024 * 1024)).toFixed(2)}MB`,
      });
    });

    test('Memory leak detection', () => {
      const LeakTestComponent = () => {
        const [data, setData] = React.useState<{ id: number; value: number }[]>([]);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setData(prev => [...prev, { id: Date.now(), value: Math.random() }]);
          }, 100);
          
          return () => clearInterval(interval);
        }, []);

        return (
          <div>
            {data.map((item, index) => (
              <div key={item.id || `item-${index}`}>{item.value}</div>
            ))}
          </div>
        );
      };

      const initialMemory = process.memoryUsage();
      
      // Render and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<LeakTestComponent />);
        setTimeout(() => unmount(), 100);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const heapGrowthMB = heapGrowth / (1024 * 1024);

      // Memory growth should be minimal after GC
      expect(heapGrowthMB).toBeLessThan(10); // < 10MB growth

      console.log('Memory Leak Test:', {
        heapGrowth: `${heapGrowthMB.toFixed(2)}MB`,
        initialHeap: `${(initialMemory.heapUsed / (1024 * 1024)).toFixed(2)}MB`,
        finalHeap: `${(finalMemory.heapUsed / (1024 * 1024)).toFixed(2)}MB`,
      });
    });
  });

  describe('Large Dataset Performance', () => {
    test('Handles 10,000 items efficiently', () => {
      const LargeDataComponent = ({ items }: { items: { id: number; title: string }[] }) => {
        const [filter, setFilter] = React.useState('');
        
        const filteredItems = React.useMemo(() => {
          return items.filter(item => 
            item.title.toLowerCase().includes(filter.toLowerCase())
          );
        }, [items, filter]);

        return (
          <div>
            <input 
              type="text" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter items..."
            />
            <div>
              {filteredItems.slice(0, 100).map((item, index) => (
                <div key={item.id || `item-${index}`}>{item.title}</div>
              ))}
            </div>
          </div>
        );
      };

      const largeDataset = generateLargeDataset(10000);
      
      const results = measureComponentPerformance(
        <LargeDataComponent items={largeDataset} />,
        'LargeDataComponent',
        10
      );

      // Should handle large datasets efficiently
      expect(results.avgRenderTime).toBeLessThan(200); // < 200ms
      expect(results.maxRenderTime).toBeLessThan(500); // < 500ms max

      console.log('Large Dataset Performance:', {
        avgRenderTime: `${results.avgRenderTime.toFixed(2)}ms`,
        maxRenderTime: `${results.maxRenderTime.toFixed(2)}ms`,
        dataSize: largeDataset.length,
      });
    });

    test('Virtualization performance with React Window', () => {
      // Mock React Window FixedSizeList
      const FixedSizeList = ({ height, itemCount, itemSize, children }: any) => {
        const visibleStart = 0;
        const visibleEnd = Math.min(itemCount, Math.ceil(height / itemSize));
        
        return (
          <div style={{ height, overflow: 'auto' }}>
            {Array.from({ length: visibleEnd - visibleStart }, (_, i) => {
              const index = visibleStart + i;
              return children({ index, style: { height: itemSize } });
            })}
          </div>
        );
      };

      const VirtualizedComponent = ({ items }: { items: any[] }) => {
        const Row = ({ index, style }: any) => (
          <div style={style}>
            {items[index]?.title || 'Loading...'}
          </div>
        );

        return (
          <FixedSizeList
            height={400}
            itemCount={items.length}
            itemSize={50}
          >
            {Row}
          </FixedSizeList>
        );
      };

      const largeDataset = generateLargeDataset(50000);
      
      const results = measureComponentPerformance(
        <VirtualizedComponent items={largeDataset} />,
        'VirtualizedComponent',
        15
      );

      // Virtualization should handle massive datasets efficiently
      expect(results.avgRenderTime).toBeLessThan(100); // < 100ms
      expect(results.maxRenderTime).toBeLessThan(250); // < 250ms max

      console.log('Virtualized Performance:', {
        avgRenderTime: `${results.avgRenderTime.toFixed(2)}ms`,
        maxRenderTime: `${results.maxRenderTime.toFixed(2)}ms`,
        dataSize: largeDataset.length,
      });
    });
  });

  describe('React Optimization Tests', () => {
    test('React.memo optimization effectiveness', () => {
      let renderCount = 0;
      
      const ExpensiveComponent = React.memo(({ data }: { data: any }) => {
        renderCount++;
        return <div>{data.title}</div>;
      });

      const ParentComponent = () => {
        const [count, setCount] = React.useState(0);
        const [data] = React.useState({ title: 'Test' });

        return (
          <div>
            <button onClick={() => setCount(c => c + 1)}>
              Count: {count}
            </button>
            <ExpensiveComponent data={data} />
          </div>
        );
      };

      const { rerender } = render(<ParentComponent />);
      
      // Rerender multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<ParentComponent />);
      }

      // Component should only render once due to React.memo
      expect(renderCount).toBe(1);

      console.log('React.memo effectiveness:', {
        renderCount,
        expectedRenders: 1,
      });
    });

    test('useMemo optimization effectiveness', () => {
      let expensiveCalculationCount = 0;
      
      const ComponentWithMemo = ({ items }: { items: any[] }) => {
        const [filter, setFilter] = React.useState('');
        
        const expensiveCalculation = React.useMemo(() => {
          expensiveCalculationCount++;
          return items.reduce((sum, item) => sum + item.id, 0);
        }, [items]);

        return (
          <div>
            <input 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div>Sum: {expensiveCalculation}</div>
          </div>
        );
      };

      const data = generateLargeDataset(1000);
      const { rerender } = render(<ComponentWithMemo items={data} />);
      
      // Multiple rerenders with same data
      for (let i = 0; i < 3; i++) {
        rerender(<ComponentWithMemo items={data} />);
      }

      // Expensive calculation should only run once
      expect(expensiveCalculationCount).toBe(1);

      console.log('useMemo effectiveness:', {
        calculationCount: expensiveCalculationCount,
        expectedCalculations: 1,
      });
    });

    test('useCallback optimization effectiveness', () => {
      let callbackCreationCount = 0;
      const callbacks = new Set();
      
      const ComponentWithCallback = ({ items }: { items: any[] }) => {
        const [filter, setFilter] = React.useState('');
        
        const handleClick = React.useCallback(() => {
          callbackCreationCount++;
          // Expensive operation
          return items.length;
        }, [items]);

        // Track unique callback instances
        callbacks.add(handleClick);

        return (
          <div>
            <input 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button onClick={handleClick}>
              Process {items.length} items
            </button>
          </div>
        );
      };

      const data = generateLargeDataset(100);
      const { rerender } = render(<ComponentWithCallback items={data} />);
      
      // Multiple rerenders with same data
      for (let i = 0; i < 3; i++) {
        rerender(<ComponentWithCallback items={data} />);
      }

      // Should create only one callback instance
      expect(callbacks.size).toBe(1);

      console.log('useCallback effectiveness:', {
        uniqueCallbacks: callbacks.size,
        expectedCallbacks: 1,
      });
    });
  });

  describe('Performance Regression Tests', () => {
    test('Performance baseline comparison', () => {
      const BaselineComponent = ({ data }: { data: any[] }) => (
        <div>
          {data.map((item, index) => (
            <div key={item.id || `item-${index}`}>{item.title}</div>
          ))}
        </div>
      );

      const data = generateLargeDataset(1000);
      
      const results = measureComponentPerformance(
        <BaselineComponent data={data} />,
        'BaselineComponent',
        20
      );

      // Store baseline metrics for comparison
      const baselineMetrics = {
        avgRenderTime: results.avgRenderTime,
        maxRenderTime: results.maxRenderTime,
        dataSize: data.length,
        timestamp: new Date().toISOString(),
      };

      // Performance should be consistent
      expect(results.avgRenderTime).toBeLessThan(50);
      expect(results.maxRenderTime).toBeLessThan(100);

      console.log('Baseline Performance:', baselineMetrics);
    });
  });
});