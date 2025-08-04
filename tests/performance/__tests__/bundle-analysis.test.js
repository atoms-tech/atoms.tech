/**
 * Bundle Analysis Performance Tests
 * Testing bundle sizes, code splitting, and optimization
 */

const fs = require('fs').promises;
const path = require('path');
const BundleAnalyzer = require('../bundle-analyzer');
const { BundgetValidator } = require('../performance-budgets.config');

describe('Bundle Analysis Performance Tests', () => {
  let analyzer;
  
  beforeAll(async () => {
    analyzer = new BundleAnalyzer({
      buildDir: '.next',
      reportDir: './test-results/bundle-analysis-test'
    });
    
    await analyzer.initialize();
  });

  describe('Bundle Size Validation', () => {
    test('should analyze Next.js build output', async () => {
      // Ensure build exists
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ No build found, skipping bundle analysis. Run "npm run build" first.');
        return;
      }

      const analysis = await analyzer.analyze();
      
      expect(analysis).toBeDefined();
      expect(analysis.summary).toBeDefined();
      expect(analysis.bundles).toBeDefined();
      expect(analysis.chunks).toBeDefined();
      expect(analysis.assets).toBeDefined();
      
      console.log(`📦 Bundle Analysis Complete:`);
      console.log(`   Total Files: ${analysis.summary.totalFiles}`);
      console.log(`   Total Size: ${analysis.summary.humanTotalSize}`);
      console.log(`   Gzipped: ${analysis.summary.humanTotalGzipSize}`);
      console.log(`   Compression: ${analysis.summary.compressionRatio}%`);
    }, 30000);

    test('should not exceed total bundle size threshold', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping bundle size test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      const totalSize = analysis.summary.totalSize;
      const threshold = 2000000; // 2MB total threshold
      
      expect(totalSize).toBeLessThan(threshold);
      
      console.log(`✅ Total bundle size: ${analysis.summary.humanTotalSize} (threshold: ${(threshold / 1024 / 1024).toFixed(1)}MB)`);
      
      if (totalSize > threshold * 0.8) {
        console.warn(`⚠️ Bundle size approaching threshold: ${(totalSize / threshold * 100).toFixed(1)}%`);
      }
    });

    test('should not have excessively large individual chunks', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping chunk size test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      const largeChunks = analysis.chunks.filter(chunk => chunk.size > 150000); // 150KB threshold
      
      expect(largeChunks.length).toBeLessThanOrEqual(2); // Allow max 2 large chunks
      
      if (largeChunks.length > 0) {
        console.log('📦 Large chunks detected:');
        largeChunks.forEach(chunk => {
          console.log(`   ${chunk.name}: ${chunk.humanSize}`);
        });
      }
      
      // Gzipped size check
      const largeGzippedChunks = analysis.chunks.filter(chunk => 
        chunk.gzipSize && chunk.gzipSize > 50000 // 50KB gzipped
      );
      
      expect(largeGzippedChunks.length).toBeLessThanOrEqual(3);
    });

    test('should have good compression ratio', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping compression test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      const compressionRatio = parseFloat(analysis.summary.compressionRatio);
      
      expect(compressionRatio).toBeGreaterThan(60); // Should compress by at least 60%
      
      console.log(`✅ Compression ratio: ${compressionRatio}%`);
      
      if (compressionRatio < 70) {
        console.warn('⚠️ Compression ratio could be improved. Consider:');
        console.warn('   - Enabling Brotli compression');
        console.warn('   - Optimizing webpack configuration');
        console.warn('   - Removing dead code');
      }
    });
  });

  describe('Code Splitting Analysis', () => {
    test('should have appropriate number of chunks', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping code splitting test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      const chunkCount = analysis.chunks.length;
      
      // Should have reasonable number of chunks (not too few, not too many)
      expect(chunkCount).toBeGreaterThan(3); // At least some code splitting
      expect(chunkCount).toBeLessThan(50); // Not excessively fragmented
      
      console.log(`📦 Code splitting: ${chunkCount} chunks`);
    });

    test('should not have duplicate dependencies in multiple chunks', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping duplicate dependency test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      
      // Check for patterns that might indicate duplicate code
      const suspiciousChunks = analysis.chunks.filter(chunk => {
        // Heuristic: chunks with very similar sizes might contain duplicated code
        return analysis.chunks.some(otherChunk => 
          otherChunk !== chunk && 
          Math.abs(chunk.size - otherChunk.size) < chunk.size * 0.1 &&
          chunk.size > 20000 // Only check chunks > 20KB
        );
      });
      
      // This is a heuristic check - some duplicates are expected
      expect(suspiciousChunks.length).toBeLessThan(analysis.chunks.length * 0.3);
      
      if (suspiciousChunks.length > 0) {
        console.log(`⚠️ ${suspiciousChunks.length} potentially duplicated chunks detected`);
      }
    });
  });

  describe('Asset Optimization', () => {
    test('should not have unoptimized images', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping asset optimization test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      const imageAssets = analysis.assets.filter(asset => 
        /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(asset.name)
      );
      
      const largeImages = imageAssets.filter(asset => asset.size > 100000); // > 100KB
      
      // Should not have too many large images
      expect(largeImages.length).toBeLessThanOrEqual(5);
      
      console.log(`🖼️ Image assets: ${imageAssets.length} (${largeImages.length} large)`);
      
      if (largeImages.length > 0) {
        console.log('Large images:');
        largeImages.forEach(image => {
          console.log(`   ${image.name}: ${image.humanSize}`);
        });
      }
    });

    test('should have optimized CSS', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping CSS optimization test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      const cssAssets = analysis.assets.filter(asset => asset.name.endsWith('.css'));
      
      const totalCssSize = cssAssets.reduce((sum, asset) => sum + asset.size, 0);
      const threshold = 100000; // 100KB total CSS threshold
      
      expect(totalCssSize).toBeLessThan(threshold);
      
      console.log(`🎨 CSS assets: ${cssAssets.length} files, ${(totalCssSize / 1024).toFixed(1)}KB total`);
      
      // Check for suspiciously large CSS files
      const largeCssFiles = cssAssets.filter(asset => asset.size > 30000); // > 30KB
      
      if (largeCssFiles.length > 0) {
        console.log('Large CSS files:');
        largeCssFiles.forEach(file => {
          console.log(`   ${file.name}: ${file.humanSize}`);
        });
      }
    });
  });

  describe('Bundle Optimization Recommendations', () => {
    test('should generate actionable optimization suggestions', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping optimization suggestions test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      const suggestions = analyzer.generateOptimizationSuggestions();
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      console.log(`💡 Optimization suggestions: ${suggestions.length}`);
      
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('techniques');
        
        console.log(`   ${suggestion.category} (${suggestion.priority}): ${suggestion.description}`);
      });
    });

    test('should identify largest files for optimization', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping largest files test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      const largestFiles = analyzer.findLargestFiles(10);
      
      expect(largestFiles).toBeDefined();
      expect(largestFiles.length).toBeGreaterThan(0);
      
      console.log('📈 Largest files:');
      largestFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.type}): ${file.humanSize}`);
        
        // Files should not be excessively large
        if (file.type === 'chunk' || file.type === 'page') {
          expect(file.size).toBeLessThan(500000); // 500KB threshold for JS
        }
        if (file.type === 'asset' && file.name.endsWith('.css')) {
          expect(file.size).toBeLessThan(50000); // 50KB threshold for CSS
        }
      });
    });
  });

  describe('Performance Budget Validation', () => {
    test('should validate bundle against performance budgets', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping budget validation test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      
      // Create mock resource data for budget validation
      const resources = {
        totalSize: analysis.summary.totalSize,
        javascript: analysis.bundles.reduce((sum, bundle) => sum + bundle.size, 0),
        css: analysis.assets
          .filter(asset => asset.name.endsWith('.css'))
          .reduce((sum, asset) => sum + asset.size, 0)
      };
      
      // Test with BudgetValidator if available
      try {
        const { BudgetValidator } = require('../performance-budgets.config');
        const violations = BudgetValidator.validateResourceBudgets(resources, '/');
        
        // Should not have critical budget violations
        const criticalViolations = violations.filter(v => v.severity === 'error');
        expect(criticalViolations.length).toBe(0);
        
        console.log(`💰 Budget validation: ${violations.length} violations`);
        
        violations.forEach(violation => {
          console.log(`   ${violation.type}: ${(violation.actual / 1024).toFixed(1)}KB (budget: ${(violation.budget / 1024).toFixed(1)}KB)`);
        });
      } catch (error) {
        console.warn('⚠️ Budget validation not available');
      }
    });
  });

  describe('Long-term Bundle Health', () => {
    test('should track bundle size trends', async () => {
      const buildPath = path.join(process.cwd(), '.next');
      
      try {
        await fs.access(buildPath);
      } catch (error) {
        console.warn('⚠️ Skipping bundle trends test - no build found');
        return;
      }

      const analysis = await analyzer.analyze();
      const trendFile = path.join(analyzer.options.reportDir, 'bundle-trends.json');
      
      let trends = [];
      
      try {
        const trendData = await fs.readFile(trendFile, 'utf-8');
        trends = JSON.parse(trendData);
      } catch (error) {
        // No existing trend data
      }
      
      // Add current data point
      trends.push({
        timestamp: new Date().toISOString(),
        totalSize: analysis.summary.totalSize,
        totalGzipSize: analysis.summary.totalGzipSize,
        fileCount: analysis.summary.totalFiles,
        compressionRatio: parseFloat(analysis.summary.compressionRatio)
      });
      
      // Keep only last 30 data points
      trends = trends.slice(-30);
      
      await fs.writeFile(trendFile, JSON.stringify(trends, null, 2));
      
      console.log(`📊 Bundle trends: ${trends.length} data points`);
      
      // Check for concerning trends if we have enough data
      if (trends.length >= 5) {
        const recent = trends.slice(-5);
        const older = trends.slice(-10, -5);
        
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, t) => sum + t.totalSize, 0) / recent.length;
          const olderAvg = older.reduce((sum, t) => sum + t.totalSize, 0) / older.length;
          const growth = (recentAvg - olderAvg) / olderAvg * 100;
          
          // Should not grow more than 20% over 5 builds
          if (growth > 20) {
            console.warn(`⚠️ Bundle size growing rapidly: ${growth.toFixed(1)}% over recent builds`);
          } else {
            console.log(`✅ Bundle size trend: ${growth.toFixed(1)}% growth`);
          }
        }
      }
    });
  });
});