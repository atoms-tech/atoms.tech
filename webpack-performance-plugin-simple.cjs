/**
 * Simple Webpack Performance Plugin for Large String Optimization
 */

class SimpleWebpackPerformancePlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('SimpleWebpackPerformancePlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'SimpleWebpackPerformancePlugin',
                    stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
                },
                (assets) => {
                    // Log large assets that might cause serialization issues
                    Object.keys(assets).forEach(name => {
                        const asset = assets[name];
                        const size = asset.size();
                        if (size > 100 * 1024) { // 100KB
                            console.log(`[Performance] Large asset detected: ${name} (${Math.round(size/1024)}KB)`);
                        }
                    });
                }
            );
        });
    }
}

module.exports = SimpleWebpackPerformancePlugin;