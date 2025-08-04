/**
 * Bundle Analysis Tests
 * Tests for bundle size, code splitting, and optimization
 */

const fs = require('fs');
const path = require('path');
const gzipSize = require('gzip-size');
const { execSync } = require('child_process');

describe('Bundle Analysis Tests', () => {
  const BUILD_DIR = path.join(__dirname, '../../.next');
  const STATIC_DIR = path.join(BUILD_DIR, 'static');
  
  beforeAll(async () => {
    // Ensure build exists
    if (!fs.existsSync(BUILD_DIR)) {
      console.log('Building application for bundle analysis...');
      execSync('npm run build', { cwd: path.join(__dirname, '../../') });
    }
  });

  const getBundleInfo = () => {
    const buildManifest = JSON.parse(
      fs.readFileSync(path.join(BUILD_DIR, 'build-manifest.json'), 'utf8')
    );
    
    const pages = buildManifest.pages || {};
    const bundleFiles = [];
    
    // Collect all bundle files
    Object.keys(pages).forEach(page => {
      const pageFiles = pages[page];
      pageFiles.forEach(file => {
        if (file.endsWith('.js')) {
          bundleFiles.push(file);
        }
      });
    });
    
    return {
      buildManifest,
      pages,
      bundleFiles: [...new Set(bundleFiles)], // Remove duplicates
    };
  };

  const getFileSize = (filePath) => {
    try {
      const fullPath = path.join(STATIC_DIR, filePath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath);
        return {
          raw: stats.size,
          gzipped: gzipSize.sync(content),
        };
      }
    } catch (error) {
      console.warn(`Could not get size for ${filePath}:`, error.message);
    }
    return { raw: 0, gzipped: 0 };
  };

  test('Overall bundle size stays within budget', () => {
    const bundleInfo = getBundleInfo();
    let totalRawSize = 0;
    let totalGzippedSize = 0;
    
    const bundleSizes = bundleInfo.bundleFiles.map(file => {
      const size = getFileSize(file);
      totalRawSize += size.raw;
      totalGzippedSize += size.gzipped;
      
      return {
        file,
        rawSize: size.raw,
        gzippedSize: size.gzipped,
        rawSizeKB: (size.raw / 1024).toFixed(2),
        gzippedSizeKB: (size.gzipped / 1024).toFixed(2),
      };
    });

    console.log('Bundle Size Analysis:', {
      totalFiles: bundleInfo.bundleFiles.length,
      totalRawSizeKB: (totalRawSize / 1024).toFixed(2),
      totalGzippedSizeKB: (totalGzippedSize / 1024).toFixed(2),
      compressionRatio: ((1 - totalGzippedSize / totalRawSize) * 100).toFixed(2) + '%',
    });

    // Log largest bundles
    const largestBundles = bundleSizes
      .sort((a, b) => b.gzippedSize - a.gzippedSize)
      .slice(0, 10);
    
    console.log('Largest bundles (gzipped):');
    largestBundles.forEach((bundle, index) => {
      console.log(`${index + 1}. ${bundle.file}: ${bundle.gzippedSizeKB}KB`);
    });

    // Bundle size budgets
    const MAX_TOTAL_SIZE_KB = 500; // 500KB total gzipped
    const MAX_SINGLE_BUNDLE_KB = 150; // 150KB per bundle gzipped
    
    expect(totalGzippedSize / 1024).toBeLessThan(MAX_TOTAL_SIZE_KB);
    
    // Check individual bundle sizes
    bundleSizes.forEach(bundle => {
      expect(bundle.gzippedSize / 1024).toBeLessThan(MAX_SINGLE_BUNDLE_KB);
    });
  });

  test('Code splitting effectiveness', () => {
    const bundleInfo = getBundleInfo();
    const pages = bundleInfo.pages;
    
    // Check that different pages have different bundles
    const pageKeys = Object.keys(pages);
    const sharedChunks = [];
    const uniqueChunks = [];
    
    pageKeys.forEach(page => {
      const pageFiles = pages[page];
      pageFiles.forEach(file => {
        // Check if this file is shared across multiple pages
        const sharedCount = pageKeys.filter(p => pages[p].includes(file)).length;
        if (sharedCount > 1) {
          if (!sharedChunks.includes(file)) {
            sharedChunks.push(file);
          }
        } else {
          uniqueChunks.push(file);
        }
      });
    });

    console.log('Code Splitting Analysis:', {
      totalPages: pageKeys.length,
      sharedChunks: sharedChunks.length,
      uniqueChunks: uniqueChunks.length,
      splittingEffectiveness: (sharedChunks.length / (sharedChunks.length + uniqueChunks.length) * 100).toFixed(2) + '%',
    });

    // Code splitting should be effective
    expect(sharedChunks.length).toBeGreaterThan(0); // Should have shared chunks
    expect(uniqueChunks.length).toBeGreaterThan(0); // Should have page-specific chunks
    expect(sharedChunks.length / (sharedChunks.length + uniqueChunks.length)).toBeGreaterThan(0.2); // At least 20% shared
  });

  test('Third-party dependencies optimization', () => {
    const bundleInfo = getBundleInfo();
    let totalThirdPartySize = 0;
    const thirdPartyLibraries = [];
    
    // Analyze bundle content for third-party libraries
    bundleInfo.bundleFiles.forEach(file => {
      const size = getFileSize(file);
      
      // Heuristic: files with 'vendor' or 'node_modules' patterns are likely third-party
      if (file.includes('vendor') || file.includes('node_modules') || file.includes('chunks')) {
        totalThirdPartySize += size.gzipped;
        thirdPartyLibraries.push({
          file,
          size: size.gzipped,
          sizeKB: (size.gzipped / 1024).toFixed(2),
        });
      }
    });

    console.log('Third-party Dependencies Analysis:', {
      thirdPartyFiles: thirdPartyLibraries.length,
      totalThirdPartySizeKB: (totalThirdPartySize / 1024).toFixed(2),
    });

    // Third-party size should be reasonable
    const MAX_THIRD_PARTY_SIZE_KB = 300; // 300KB for third-party libraries
    expect(totalThirdPartySize / 1024).toBeLessThan(MAX_THIRD_PARTY_SIZE_KB);
  });

  test('Critical path optimization', () => {
    const bundleInfo = getBundleInfo();
    const mainPageFiles = bundleInfo.pages['/'] || [];
    
    let criticalPathSize = 0;
    const criticalResources = [];
    
    mainPageFiles.forEach(file => {
      const size = getFileSize(file);
      criticalPathSize += size.gzipped;
      criticalResources.push({
        file,
        size: size.gzipped,
        sizeKB: (size.gzipped / 1024).toFixed(2),
      });
    });

    console.log('Critical Path Analysis:', {
      criticalResources: criticalResources.length,
      criticalPathSizeKB: (criticalPathSize / 1024).toFixed(2),
    });

    // Critical path should be optimized
    const MAX_CRITICAL_PATH_SIZE_KB = 200; // 200KB for critical path
    expect(criticalPathSize / 1024).toBeLessThan(MAX_CRITICAL_PATH_SIZE_KB);
  });

  test('Dynamic imports and lazy loading', () => {
    const sourceDir = path.join(__dirname, '../../src');
    const dynamicImports = [];
    
    // Scan for dynamic imports in source code
    const scanForDynamicImports = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanForDynamicImports(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Look for dynamic import patterns
          const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
          const lazyImportRegex = /React\.lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\)/g;
          
          let match;
          while ((match = dynamicImportRegex.exec(content)) !== null) {
            dynamicImports.push({
              file: filePath,
              import: match[1],
              type: 'dynamic',
            });
          }
          
          while ((match = lazyImportRegex.exec(content)) !== null) {
            dynamicImports.push({
              file: filePath,
              import: match[1],
              type: 'lazy',
            });
          }
        }
      });
    };

    scanForDynamicImports(sourceDir);

    console.log('Dynamic Imports Analysis:', {
      totalDynamicImports: dynamicImports.length,
      lazyImports: dynamicImports.filter(imp => imp.type === 'lazy').length,
      regularDynamicImports: dynamicImports.filter(imp => imp.type === 'dynamic').length,
    });

    // Should have some dynamic imports for optimization
    expect(dynamicImports.length).toBeGreaterThan(0);
  });

  test('Tree shaking effectiveness', () => {
    const bundleInfo = getBundleInfo();
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
    );
    
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    const allDependencies = [...dependencies, ...devDependencies];
    
    // Check for common tree-shakeable libraries
    const treeShakeableLibraries = [
      'lodash',
      'react-icons',
      'date-fns',
      'ramda',
      'rxjs',
    ];
    
    const foundTreeShakeableLibs = treeShakeableLibraries.filter(lib => 
      allDependencies.some(dep => dep.includes(lib))
    );
    
    console.log('Tree Shaking Analysis:', {
      totalDependencies: allDependencies.length,
      treeShakeableLibrariesFound: foundTreeShakeableLibs.length,
      foundLibraries: foundTreeShakeableLibs,
    });

    // If tree-shakeable libraries are used, bundles should be reasonably sized
    if (foundTreeShakeableLibs.length > 0) {
      const bundleInfo = getBundleInfo();
      let totalSize = 0;
      
      bundleInfo.bundleFiles.forEach(file => {
        const size = getFileSize(file);
        totalSize += size.gzipped;
      });
      
      // With tree shaking, total bundle size should be reasonable
      const MAX_TREE_SHAKEN_SIZE_KB = 400; // 400KB with tree shaking
      expect(totalSize / 1024).toBeLessThan(MAX_TREE_SHAKEN_SIZE_KB);
    }
  });

  test('Asset optimization', () => {
    const assetsDir = path.join(__dirname, '../../public');
    const assets = [];
    
    if (fs.existsSync(assetsDir)) {
      const scanAssets = (dir) => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            scanAssets(filePath);
          } else {
            const extension = path.extname(file).toLowerCase();
            const assetTypes = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico'];
            
            if (assetTypes.includes(extension)) {
              assets.push({
                file: filePath,
                size: stat.size,
                sizeKB: (stat.size / 1024).toFixed(2),
                type: extension,
              });
            }
          }
        });
      };
      
      scanAssets(assetsDir);
    }

    console.log('Asset Optimization Analysis:', {
      totalAssets: assets.length,
      totalAssetSizeKB: assets.reduce((sum, asset) => sum + asset.size, 0) / 1024,
      assetTypes: [...new Set(assets.map(asset => asset.type))],
    });

    // Asset size budgets
    const MAX_SINGLE_ASSET_KB = 200; // 200KB per asset
    const MAX_TOTAL_ASSETS_KB = 1000; // 1MB total assets
    
    const totalAssetSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    expect(totalAssetSize / 1024).toBeLessThan(MAX_TOTAL_ASSETS_KB);
    
    // Check individual asset sizes
    assets.forEach(asset => {
      expect(asset.size / 1024).toBeLessThan(MAX_SINGLE_ASSET_KB);
    });
  });

  test('Compression and caching headers', () => {
    const bundleInfo = getBundleInfo();
    const compressionResults = [];
    
    bundleInfo.bundleFiles.forEach(file => {
      const size = getFileSize(file);
      const compressionRatio = size.gzipped / size.raw;
      
      compressionResults.push({
        file,
        rawSize: size.raw,
        gzippedSize: size.gzipped,
        compressionRatio,
        compressionPercentage: ((1 - compressionRatio) * 100).toFixed(2) + '%',
      });
    });

    const avgCompressionRatio = compressionResults.reduce((sum, result) => sum + result.compressionRatio, 0) / compressionResults.length;
    const bestCompression = compressionResults.reduce((best, current) => 
      current.compressionRatio < best.compressionRatio ? current : best
    );
    const worstCompression = compressionResults.reduce((worst, current) => 
      current.compressionRatio > worst.compressionRatio ? current : worst
    );

    console.log('Compression Analysis:', {
      avgCompressionRatio: (avgCompressionRatio * 100).toFixed(2) + '%',
      bestCompression: {
        file: bestCompression.file,
        ratio: bestCompression.compressionPercentage,
      },
      worstCompression: {
        file: worstCompression.file,
        ratio: worstCompression.compressionPercentage,
      },
    });

    // Compression should be effective
    expect(avgCompressionRatio).toBeLessThan(0.4); // Average compression should be better than 40%
    expect(bestCompression.compressionRatio).toBeLessThan(0.3); // Best compression should be better than 30%
  });

  test('Webpack bundle analyzer compatibility', () => {
    const webpackStatsPath = path.join(BUILD_DIR, 'webpack-stats.json');
    
    // Check if webpack stats exist (created by webpack-bundle-analyzer)
    if (fs.existsSync(webpackStatsPath)) {
      const stats = JSON.parse(fs.readFileSync(webpackStatsPath, 'utf8'));
      
      console.log('Webpack Bundle Analyzer Stats:', {
        hasAssets: !!stats.assets,
        hasModules: !!stats.modules,
        hasChunks: !!stats.chunks,
        version: stats.version,
      });
      
      expect(stats.assets).toBeDefined();
      expect(stats.modules).toBeDefined();
      expect(stats.chunks).toBeDefined();
    } else {
      console.log('Webpack stats not found. Run "npm run analyze" to generate bundle analysis.');
    }
  });
});