#!/usr/bin/env node

/**
 * Regression Testing Configuration
 * 
 * Centralized configuration for all regression testing components
 */

export const regressionConfig = {
    // Global settings
    global: {
        enabled: true,
        environment: process.env.NODE_ENV || 'development',
        logLevel: 'info',
        maxConcurrency: 4,
        timeout: 300000, // 5 minutes
        retries: 2
    },
    
    // Test suite configuration
    testSuite: {
        types: {
            unit: {
                enabled: true,
                priority: 'high',
                timeout: 30000,
                pattern: 'src/**/*.test.{ts,tsx,js,jsx}',
                coverage: {
                    enabled: true,
                    threshold: 80,
                    reports: ['text', 'html', 'json']
                }
            },
            integration: {
                enabled: true,
                priority: 'high',
                timeout: 60000,
                pattern: 'tests/integration/**/*.test.{ts,tsx}',
                setup: 'tests/integration/setup.tsx'
            },
            e2e: {
                enabled: true,
                priority: 'medium',
                timeout: 120000,
                pattern: 'tests/e2e/**/*.spec.{ts,js}',
                browsers: ['chromium', 'firefox', 'webkit'],
                headless: true
            },
            performance: {
                enabled: true,
                priority: 'medium',
                timeout: 180000,
                pattern: 'tests/performance/**/*.test.{ts,js}',
                thresholds: {
                    lighthouse: {
                        performance: 90,
                        accessibility: 90,
                        bestPractices: 90,
                        seo: 90
                    },
                    bundleSize: {
                        maxSize: 5000, // KB
                        maxIncrease: 10 // %
                    },
                    loadTime: {
                        maxTime: 3000, // ms
                        maxIncrease: 20 // %
                    }
                }
            },
            visual: {
                enabled: true,
                priority: 'low',
                timeout: 60000,
                pattern: 'tests/visual/**/*.spec.{ts,js}',
                threshold: 0.2, // 20% pixel difference
                updateSnapshots: false
            },
            accessibility: {
                enabled: true,
                priority: 'medium',
                timeout: 30000,
                pattern: 'tests/accessibility/**/*.test.{ts,js}',
                rules: {
                    wcag2a: true,
                    wcag2aa: true,
                    wcag21aa: true
                }
            },
            security: {
                enabled: true,
                priority: 'high',
                timeout: 60000,
                pattern: 'tests/security/**/*.test.{ts,js}',
                checks: {
                    vulnerabilities: true,
                    dependencies: true,
                    owasp: true
                }
            }
        },
        
        // Regression detection thresholds
        thresholds: {
            passRate: 98, // 98% minimum pass rate
            maxRegressions: 0, // No regressions allowed
            maxPerformanceDegradation: 20, // 20% max performance loss
            maxCoverageDecrease: 5, // 5% max coverage decrease
            maxFailureRate: 2 // 2% max failure rate
        },
        
        // Reporting configuration
        reporting: {
            formats: ['html', 'json', 'junit'],
            destinations: {
                html: 'test-results/regression/reports/html',
                json: 'test-results/regression/reports/json',
                junit: 'test-results/regression/reports/junit'
            },
            dashboard: {
                enabled: true,
                port: 8080,
                realtime: true
            }
        }
    },
    
    // Pipeline configuration
    pipeline: {
        schedule: {
            enabled: true,
            cron: '0 */6 * * *', // Every 6 hours
            onCommit: true,
            onPush: true,
            onPR: true,
            onSchedule: true
        },
        
        triggers: {
            git: {
                enabled: true,
                branches: ['main', 'develop'],
                patterns: ['src/**/*', 'tests/**/*', 'package.json']
            },
            manual: {
                enabled: true,
                triggerFile: 'test-results/regression/manual-trigger'
            },
            webhook: {
                enabled: false,
                endpoint: '/api/regression/trigger',
                secret: process.env.REGRESSION_WEBHOOK_SECRET
            }
        },
        
        notifications: {
            enabled: true,
            channels: {
                console: { enabled: true },
                slack: {
                    enabled: false,
                    webhook: process.env.SLACK_WEBHOOK_URL,
                    channel: '#qa-alerts'
                },
                email: {
                    enabled: false,
                    smtp: {
                        host: process.env.SMTP_HOST,
                        port: process.env.SMTP_PORT,
                        secure: true,
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASS
                        }
                    },
                    recipients: ['qa-team@company.com']
                }
            },
            conditions: {
                onRegression: true,
                onFailure: true,
                onSuccess: false,
                onRecovery: true
            }
        },
        
        rollback: {
            enabled: false,
            automatic: false,
            conditions: {
                regressionCount: 5,
                failureRate: 0.5,
                performanceDegradation: 0.3
            }
        }
    },
    
    // Prevention configuration
    prevention: {
        mechanisms: {
            preCommitChecks: {
                enabled: true,
                strict: true,
                timeout: 120000
            },
            realTimeAnalysis: {
                enabled: true,
                throttle: 1000,
                patterns: [
                    'src/**/*.{ts,tsx,js,jsx}',
                    'tests/**/*.{ts,tsx,js,jsx}',
                    'package.json',
                    'yarn.lock'
                ]
            },
            qualityGates: {
                enabled: true,
                thresholds: {
                    codeQuality: 80,
                    testCoverage: 80,
                    performanceScore: 80,
                    securityScore: 80
                }
            },
            performanceBudgets: {
                enabled: true,
                budgets: {
                    bundleSize: 5000, // KB
                    buildTime: 300, // seconds
                    testTime: 600, // seconds
                    loadTime: 3 // seconds
                }
            },
            breakingChangeDetection: {
                enabled: true,
                checks: {
                    apiBreaking: true,
                    typeBreaking: true,
                    exportBreaking: true,
                    propsBreaking: true
                }
            }
        },
        
        autoFix: {
            enabled: true,
            rules: {
                formatting: { enabled: true, apply: true },
                linting: { enabled: true, apply: false },
                imports: { enabled: true, apply: true },
                testing: { enabled: true, apply: false },
                security: { enabled: true, apply: false }
            }
        },
        
        riskAssessment: {
            enabled: true,
            factors: {
                fileImportance: {
                    'src/lib/supabase/': 0.9,
                    'src/lib/api/': 0.9,
                    'src/store/': 0.8,
                    'src/components/ui/': 0.8,
                    'src/hooks/': 0.7,
                    'src/components/': 0.6
                },
                changeType: {
                    'breaking-change': 0.9,
                    'security-issue': 0.95,
                    'performance-impact': 0.7,
                    'test-removal': 0.8,
                    'api-change': 0.8
                }
            },
            thresholds: {
                block: 90,
                warn: 70,
                info: 50
            }
        }
    },
    
    // Storage configuration
    storage: {
        baseDir: 'test-results/regression',
        structure: {
            results: 'results',
            reports: 'reports',
            artifacts: 'artifacts',
            logs: 'logs',
            baselines: 'baselines',
            screenshots: 'screenshots',
            coverage: 'coverage'
        },
        retention: {
            results: 30, // days
            artifacts: 7, // days
            logs: 14, // days
            baselines: 90 // days
        },
        compression: {
            enabled: true,
            format: 'gzip',
            level: 6
        }
    },
    
    // Integration configuration
    integrations: {
        ci: {
            enabled: true,
            platforms: {
                github: {
                    enabled: true,
                    checks: true,
                    statusChecks: true,
                    comments: true
                },
                gitlab: {
                    enabled: false,
                    mergeRequests: true,
                    pipelines: true
                },
                jenkins: {
                    enabled: false,
                    buildSteps: true,
                    artifacts: true
                }
            }
        },
        
        monitoring: {
            enabled: true,
            metrics: {
                prometheus: {
                    enabled: false,
                    endpoint: '/metrics',
                    labels: ['environment', 'branch', 'test_type']
                },
                grafana: {
                    enabled: false,
                    dashboard: 'regression-testing'
                }
            }
        },
        
        databases: {
            testData: {
                enabled: true,
                reset: true,
                seed: true,
                backup: true
            }
        }
    },
    
    // Environment-specific overrides
    environments: {
        development: {
            global: {
                logLevel: 'debug',
                timeout: 600000
            },
            testSuite: {
                types: {
                    e2e: { headless: false }
                }
            },
            prevention: {
                mechanisms: {
                    preCommitChecks: { strict: false }
                }
            }
        },
        
        staging: {
            global: {
                logLevel: 'info'
            },
            testSuite: {
                types: {
                    performance: { enabled: true }
                }
            },
            pipeline: {
                schedule: {
                    cron: '0 */2 * * *' // Every 2 hours
                }
            }
        },
        
        production: {
            global: {
                logLevel: 'warn',
                maxConcurrency: 8
            },
            testSuite: {
                types: {
                    performance: { enabled: true },
                    security: { enabled: true }
                }
            },
            pipeline: {
                schedule: {
                    cron: '0 */1 * * *' // Every hour
                },
                rollback: {
                    enabled: true,
                    automatic: true
                }
            }
        }
    }
};

/**
 * Get configuration for current environment
 */
export function getConfig() {
    const env = process.env.NODE_ENV || 'development';
    const baseConfig = regressionConfig;
    const envConfig = baseConfig.environments[env] || {};
    
    return mergeDeep(baseConfig, envConfig);
}

/**
 * Deep merge configuration objects
 */
function mergeDeep(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    output[key] = source[key];
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    
    return output;
}

/**
 * Check if value is an object
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Validate configuration
 */
export function validateConfig(config = getConfig()) {
    const errors = [];
    
    // Check required fields
    if (!config.global) {
        errors.push('Missing global configuration');
    }
    
    if (!config.testSuite) {
        errors.push('Missing test suite configuration');
    }
    
    if (!config.storage) {
        errors.push('Missing storage configuration');
    }
    
    // Check test types
    if (config.testSuite?.types) {
        for (const [type, typeConfig] of Object.entries(config.testSuite.types)) {
            if (!typeConfig.pattern) {
                errors.push(`Missing pattern for test type: ${type}`);
            }
            
            if (!typeConfig.timeout) {
                errors.push(`Missing timeout for test type: ${type}`);
            }
        }
    }
    
    // Check thresholds
    if (config.testSuite?.thresholds) {
        const thresholds = config.testSuite.thresholds;
        
        if (thresholds.passRate < 0 || thresholds.passRate > 100) {
            errors.push('Pass rate threshold must be between 0 and 100');
        }
        
        if (thresholds.maxRegressions < 0) {
            errors.push('Max regressions threshold must be >= 0');
        }
    }
    
    // Check storage paths
    if (config.storage?.baseDir && !config.storage.baseDir.startsWith('/')) {
        // Relative paths are OK
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Get test configuration for specific type
 */
export function getTestConfig(testType) {
    const config = getConfig();
    return config.testSuite?.types?.[testType];
}

/**
 * Get pipeline configuration
 */
export function getPipelineConfig() {
    const config = getConfig();
    return config.pipeline;
}

/**
 * Get prevention configuration
 */
export function getPreventionConfig() {
    const config = getConfig();
    return config.prevention;
}

/**
 * Get storage configuration
 */
export function getStorageConfig() {
    const config = getConfig();
    return config.storage;
}

/**
 * Get integration configuration
 */
export function getIntegrationConfig() {
    const config = getConfig();
    return config.integrations;
}

// Export default configuration
export default regressionConfig;