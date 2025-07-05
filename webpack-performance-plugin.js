/**
 * Webpack Performance Plugin for Large String Optimization
 * This plugin addresses the PackFileCacheStrategy warning about large strings
 * by implementing Buffer-based serialization for large files
 */

class WebpackPerformancePlugin {
    constructor(options = {}) {
        this.options = {
            maxStringSize: options.maxStringSize || 100 * 1024, // 100KB
            enableBufferSerialization: options.enableBufferSerialization !== false,
            excludePatterns: options.excludePatterns || [
                /node_modules/,
                /\.test\./,
                /\.spec\./
            ],
            ...options
        };
    }

    apply(compiler) {
        compiler.hooks.compilation.tap('WebpackPerformancePlugin', (compilation) => {
            // Optimize module serialization for large files
            compilation.hooks.afterOptimizeModules.tap('WebpackPerformancePlugin', (modules) => {
                for (const module of modules) {
                    if (this.shouldOptimizeModule(module)) {
                        this.optimizeModuleForSerialization(module);
                    }
                }
            });
        });

        // Configure cache serialization
        if (this.options.enableBufferSerialization) {
            compiler.hooks.initialize.tap('WebpackPerformancePlugin', () => {
                if (compiler.options.cache && compiler.options.cache.type === 'filesystem') {
                    // Optimize cache serialization for large strings
                    const originalSerializer = compiler.options.cache.serializer;
                    
                    compiler.options.cache.serializer = {
                        serialize: (obj, context) => {
                            if (this.isLargeString(obj)) {
                                // Convert large strings to Buffer for better serialization performance
                                const buffer = Buffer.from(obj);
                                return { __isBuffer: true, data: buffer };
                            }
                            return originalSerializer ? originalSerializer.serialize(obj, context) : obj;
                        },
                        deserialize: (obj, context) => {
                            if (obj && obj.__isBuffer) {
                                return obj.data.toString();
                            }
                            return originalSerializer ? originalSerializer.deserialize(obj, context) : obj;
                        }
                    };
                }
            });
        }
    }

    shouldOptimizeModule(module) {
        if (!module.resource) return false;
        
        // Skip excluded patterns
        if (this.options.excludePatterns.some(pattern => pattern.test(module.resource))) {
            return false;
        }

        // Target large TypeScript type files and database schemas
        return (
            module.resource.includes('database.types.ts') ||
            module.resource.includes('.types.ts') ||
            module.resource.includes('schema.ts') ||
            (module.size && module.size() > this.options.maxStringSize)
        );
    }

    optimizeModuleForSerialization(module) {
        if (module._source && module._source._value) {
            const source = module._source._value;
            if (this.isLargeString(source)) {
                // Mark for optimized serialization
                module._optimizedForSerialization = true;
                
                // Split large type definitions into smaller chunks
                if (module.resource && module.resource.includes('.types.ts')) {
                    this.optimizeTypeDefinitions(module);
                }
            }
        }
    }

    optimizeTypeDefinitions(module) {
        if (!module._source || !module._source._value) return;
        
        const source = module._source._value;
        
        // Split large interface/type definitions
        const optimizedSource = source.replace(
            /export\s+(interface|type)\s+(\w+)\s*=\s*{([^}]+({[^}]*}[^}]*)*[^}]*)}/g,
            (match, keyword, name, body) => {
                if (match.length > 10000) { // > 10KB
                    // Break down large interfaces into smaller chunks
                    const chunks = this.splitInterfaceBody(body);
                    if (chunks.length > 1) {
                        return chunks.map((chunk, index) => 
                            `export ${keyword} ${name}_Part${index} = {${chunk}}`
                        ).join('\n') + 
                        `\nexport ${keyword} ${name} = ${chunks.map((_, i) => `${name}_Part${i}`).join(' & ')};`;
                    }
                }
                return match;
            }
        );
        
        if (optimizedSource !== source) {
            module._source._value = optimizedSource;
        }
    }

    splitInterfaceBody(body) {
        const lines = body.split('\n');
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;
        const maxChunkSize = 5000; // 5KB per chunk
        
        for (const line of lines) {
            if (currentSize + line.length > maxChunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.join('\n'));
                currentChunk = [line];
                currentSize = line.length;
            } else {
                currentChunk.push(line);
                currentSize += line.length;
            }
        }
        
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n'));
        }
        
        return chunks.length > 1 ? chunks : [body];
    }

    isLargeString(obj) {
        return typeof obj === 'string' && obj.length > this.options.maxStringSize;
    }
}

module.exports = WebpackPerformancePlugin;