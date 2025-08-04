#!/usr/bin/env node

/**
 * Security Headers Testing
 * Tests for proper implementation of security headers
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class SecurityHeadersTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
        this.reportDir = path.join(__dirname, '../../test-results/security');
        this.targetUrl = process.env.TEST_TARGET_URL || 'http://localhost:3000';
        
        // Security headers to test
        this.requiredHeaders = {
            'content-security-policy': {
                required: true,
                severity: 'high',
                description: 'Prevents XSS and data injection attacks'
            },
            'x-frame-options': {
                required: true,
                severity: 'high',
                description: 'Prevents clickjacking attacks'
            },
            'x-content-type-options': {
                required: true,
                severity: 'medium',
                description: 'Prevents MIME-type sniffing'
            },
            'referrer-policy': {
                required: true,
                severity: 'medium',
                description: 'Controls referrer information sent'
            },
            'permissions-policy': {
                required: false,
                severity: 'low',
                description: 'Controls browser feature access'
            },
            'strict-transport-security': {
                required: false, // Only for HTTPS
                severity: 'high',
                description: 'Forces HTTPS connections'
            },
            'x-xss-protection': {
                required: false,
                severity: 'low',
                description: 'Legacy XSS protection (deprecated)'
            }
        };
    }

    async runTest(testName, testFunction) {
        console.log(`🔍 Testing ${testName}...`);
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.results.tests.push({
                name: testName,
                status: result.status || 'passed',
                duration,
                details: result
            });
            
            if (result.status === 'warning') {
                this.results.summary.warnings++;
            } else {
                this.results.summary.passed++;
            }
            
            console.log(`✅ ${testName} ${result.status || 'passed'} (${duration}ms)`);
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.tests.push({
                name: testName,
                status: 'failed',
                duration,
                error: error.message,
                details: error.details || null
            });
            
            this.results.summary.failed++;
            console.log(`❌ ${testName} failed (${duration}ms): ${error.message}`);
        }
        
        this.results.summary.total++;
    }

    // Test Next.js configuration for security headers
    async testNextJsSecurityHeaders() {
        const nextConfigPath = path.join(__dirname, '../../next.config.js');
        const nextConfigMjsPath = path.join(__dirname, '../../next.config.mjs');
        
        const configPath = fs.existsSync(nextConfigPath) ? nextConfigPath : 
                          fs.existsSync(nextConfigMjsPath) ? nextConfigMjsPath : null;

        if (!configPath) {
            return {
                status: 'warning',
                message: 'No Next.js config file found',
                recommendations: ['Create next.config.js with security headers']
            };
        }

        const configContent = fs.readFileSync(configPath, 'utf8');
        const findings = {
            configured: [],
            missing: [],
            issues: []
        };

        // Check for security headers configuration
        Object.keys(this.requiredHeaders).forEach(header => {
            const headerConfig = this.requiredHeaders[header];
            if (configContent.includes(header) || configContent.includes(this.headerToPascalCase(header))) {
                findings.configured.push({
                    header,
                    severity: headerConfig.severity,
                    description: headerConfig.description
                });
            } else if (headerConfig.required) {
                findings.missing.push({
                    header,
                    severity: headerConfig.severity,
                    description: headerConfig.description
                });
            }
        });

        // Check for helmet usage
        const helmetUsed = configContent.includes('helmet') || 
                          configContent.includes('@helmet-csp') ||
                          configContent.includes('securityHeaders');

        if (!helmetUsed && findings.missing.length > 0) {
            findings.issues.push('Consider using helmet or manual header configuration');
        }

        const status = findings.missing.length > 0 ? 'warning' : 'passed';
        
        return {
            status,
            message: `Security headers configuration analysis`,
            configured: findings.configured,
            missing: findings.missing,
            issues: findings.issues,
            recommendations: this.getHeaderRecommendations(findings.missing)
        };
    }

    // Test actual HTTP response headers
    async testLiveHeadersResponse() {
        if (!this.targetUrl.startsWith('http')) {
            return {
                status: 'warning',
                message: 'No target URL specified for live testing',
                note: 'Set TEST_TARGET_URL environment variable'
            };
        }

        try {
            const headers = await this.fetchHeaders(this.targetUrl);
            const analysis = this.analyzeResponseHeaders(headers);
            
            const criticalMissing = analysis.missing.filter(h => 
                this.requiredHeaders[h.header].severity === 'high'
            );

            const status = criticalMissing.length > 0 ? 'failed' : 
                          analysis.missing.length > 0 ? 'warning' : 'passed';

            return {
                status,
                message: `Live header analysis for ${this.targetUrl}`,
                present: analysis.present,
                missing: analysis.missing,
                recommendations: analysis.recommendations
            };

        } catch (error) {
            return {
                status: 'warning',
                message: 'Could not test live headers',
                error: error.message,
                note: 'Start the application server to test live headers'
            };
        }
    }

    // Test Content Security Policy implementation
    async testContentSecurityPolicy() {
        const findings = {
            configured: false,
            issues: [],
            recommendations: []
        };

        // Check Next.js config
        const configFiles = [
            path.join(__dirname, '../../next.config.js'),
            path.join(__dirname, '../../next.config.mjs')
        ];

        for (const configPath of configFiles) {
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                
                if (content.includes('Content-Security-Policy') || content.includes('contentSecurityPolicy')) {
                    findings.configured = true;
                    
                    // Check for unsafe CSP directives
                    if (content.includes("'unsafe-inline'")) {
                        findings.issues.push("'unsafe-inline' directive found - reduces CSP effectiveness");
                    }
                    
                    if (content.includes("'unsafe-eval'")) {
                        findings.issues.push("'unsafe-eval' directive found - allows dangerous eval()");
                    }
                    
                    if (content.includes('*') && !content.includes("'*'")) {
                        findings.issues.push('Wildcard (*) directive found - overly permissive');
                    }
                }
                break;
            }
        }

        // Check for CSP in HTML meta tags
        const layoutFiles = [
            path.join(__dirname, '../../src/app/layout.tsx'),
            path.join(__dirname, '../../src/pages/_app.tsx'),
            path.join(__dirname, '../../src/pages/_document.tsx')
        ];

        layoutFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('Content-Security-Policy')) {
                    findings.configured = true;
                }
            }
        });

        if (!findings.configured) {
            findings.recommendations.push('Implement Content Security Policy');
            findings.recommendations.push('Start with a restrictive policy and gradually relax as needed');
        }

        if (findings.issues.length > 0) {
            findings.recommendations.push('Review and tighten CSP directives');
        }

        const status = !findings.configured ? 'warning' : 
                      findings.issues.length > 0 ? 'warning' : 'passed';

        return {
            status,
            message: 'Content Security Policy analysis',
            configured: findings.configured,
            issues: findings.issues,
            recommendations: findings.recommendations
        };
    }

    // Test for secure cookie configuration
    async testSecureCookieConfiguration() {
        const cookieIssues = [];
        const srcPath = path.join(__dirname, '../../src');
        const files = this.getAllFiles(srcPath, ['.ts', '.tsx', '.js', '.jsx']);

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(srcPath, file);

            // Check for cookie setting without secure flags
            const cookieSetRegex = /\.set\s*\(\s*['"`][\w-]+['"`]\s*,\s*[^,)]+(?:\s*,\s*\{[^}]*\})?/g;
            const matches = content.match(cookieSetRegex);

            if (matches) {
                matches.forEach(match => {
                    if (!match.includes('secure') || !match.includes('httpOnly')) {
                        cookieIssues.push({
                            file: relativePath,
                            issue: 'Cookie set without secure flags',
                            code: match.trim()
                        });
                    }
                });
            }

            // Check for document.cookie usage
            if (content.includes('document.cookie')) {
                cookieIssues.push({
                    file: relativePath,
                    issue: 'Direct document.cookie usage (consider using secure cookie library)',
                    severity: 'medium'
                });
            }
        });

        // Check middleware for cookie security
        const middlewarePath = path.join(__dirname, '../../src/middleware.ts');
        if (fs.existsSync(middlewarePath)) {
            const content = fs.readFileSync(middlewarePath, 'utf8');
            if (!content.includes('secure') && !content.includes('httpOnly')) {
                cookieIssues.push({
                    file: 'middleware.ts',
                    issue: 'Middleware may not set secure cookie flags',
                    severity: 'high'
                });
            }
        }

        const status = cookieIssues.length > 0 ? 'warning' : 'passed';

        return {
            status,
            message: 'Secure cookie configuration analysis',
            issues: cookieIssues,
            filesScanned: files.length,
            recommendations: cookieIssues.length > 0 ? [
                'Always set httpOnly flag for session cookies',
                'Set secure flag for HTTPS environments',
                'Use sameSite attribute to prevent CSRF'
            ] : []
        };
    }

    async fetchHeaders(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            const request = client.get(url, (response) => {
                resolve(response.headers);
            });

            request.on('error', reject);
            request.setTimeout(5000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    analyzeResponseHeaders(headers) {
        const present = [];
        const missing = [];
        const recommendations = [];

        Object.keys(this.requiredHeaders).forEach(header => {
            const headerConfig = this.requiredHeaders[header];
            const headerValue = headers[header] || headers[header.toLowerCase()];

            if (headerValue) {
                present.push({
                    header,
                    value: headerValue,
                    severity: headerConfig.severity,
                    description: headerConfig.description
                });
            } else if (headerConfig.required) {
                missing.push({
                    header,
                    severity: headerConfig.severity,
                    description: headerConfig.description
                });
            }
        });

        // Generate recommendations
        if (missing.length > 0) {
            recommendations.push('Configure missing security headers in Next.js config');
            recommendations.push('Consider using a security headers middleware');
        }

        return { present, missing, recommendations };
    }

    headerToPascalCase(header) {
        return header.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join('-');
    }

    getHeaderRecommendations(missingHeaders) {
        const recommendations = [];
        
        missingHeaders.forEach(({ header, severity }) => {
            switch (header) {
                case 'content-security-policy':
                    recommendations.push('Implement CSP to prevent XSS attacks');
                    break;
                case 'x-frame-options':
                    recommendations.push('Add X-Frame-Options to prevent clickjacking');
                    break;
                case 'x-content-type-options':
                    recommendations.push('Set X-Content-Type-Options: nosniff');
                    break;
                case 'referrer-policy':
                    recommendations.push('Configure referrer policy for privacy');
                    break;
                case 'strict-transport-security':
                    recommendations.push('Enable HSTS for HTTPS sites');
                    break;
            }
        });

        return recommendations;
    }

    getAllFiles(dirPath, extensions = []) {
        const files = [];
        if (!fs.existsSync(dirPath)) return files;

        const items = fs.readdirSync(dirPath);

        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                files.push(...this.getAllFiles(fullPath, extensions));
            } else if (extensions.length === 0 || extensions.some(ext => fullPath.endsWith(ext))) {
                files.push(fullPath);
            }
        });

        return files;
    }

    async generateReport() {
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }

        const reportPath = path.join(this.reportDir, 'security-headers-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

        console.log(`\n📊 Security Headers Test Summary:`);
        console.log(`Total Tests: ${this.results.summary.total}`);
        console.log(`Passed: ${this.results.summary.passed}`);
        console.log(`Warnings: ${this.results.summary.warnings}`);
        console.log(`Failed: ${this.results.summary.failed}`);
        console.log(`\n📝 Report saved to: ${reportPath}`);

        return this.results;
    }

    async run() {
        console.log('🚀 Starting Security Headers Testing...\n');

        await this.runTest('Next.js Security Headers Config', () => this.testNextJsSecurityHeaders());
        await this.runTest('Live Headers Response', () => this.testLiveHeadersResponse());
        await this.runTest('Content Security Policy', () => this.testContentSecurityPolicy());
        await this.runTest('Secure Cookie Configuration', () => this.testSecureCookieConfiguration());

        console.log('\n🔍 Generating security headers report...');
        await this.generateReport();

        const hasFailures = this.results.summary.failed > 0;
        if (hasFailures) {
            console.log('\n❌ Security headers tests completed with failures');
            process.exit(1);
        } else {
            console.log('\n✅ Security headers tests completed successfully');
            process.exit(0);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new SecurityHeadersTester();
    tester.run().catch(error => {
        console.error('Security headers tester failed:', error);
        process.exit(1);
    });
}

module.exports = SecurityHeadersTester;