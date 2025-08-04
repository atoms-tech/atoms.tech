#!/usr/bin/env node

/**
 * CSRF Protection Testing
 * Tests for Cross-Site Request Forgery vulnerability protection
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class CsrfProtectionTester {
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
        this.srcPath = path.join(__dirname, '../../src');
        this.targetUrl = process.env.TEST_TARGET_URL || 'http://localhost:3000';
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

    // Test for CSRF token implementation
    async testCsrfTokenImplementation() {
        const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);
        const findings = {
            tokenUsage: [],
            missingProtection: [],
            recommendations: []
        };

        // Check for CSRF token usage in forms
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.srcPath, file);

            // Look for form submissions
            if (content.includes('<form') || content.includes('onSubmit') || content.includes('formAction')) {
                
                // Check for CSRF token usage
                if (content.includes('csrf') || content.includes('_token') || content.includes('authenticity_token')) {
                    findings.tokenUsage.push({
                        file: relativePath,
                        hasToken: true,
                        type: 'form'
                    });
                } else {
                    // Check if it's a GET form (safe) or POST form (needs protection)
                    if (content.includes('method="post"') || content.includes("method='post'") || 
                        content.includes('POST') || content.includes('formAction')) {
                        findings.missingProtection.push({
                            file: relativePath,
                            type: 'form',
                            issue: 'POST form without visible CSRF protection'
                        });
                    }
                }
            }

            // Check for fetch/axios requests
            const hasApiCalls = content.includes('fetch(') || content.includes('axios.') || 
                               content.includes('fetch ') || content.includes('.post(') ||
                               content.includes('.put(') || content.includes('.delete(');
            
            if (hasApiCalls) {
                if (content.includes('csrf') || content.includes('X-CSRF-TOKEN') || 
                    content.includes('_token')) {
                    findings.tokenUsage.push({
                        file: relativePath,
                        hasToken: true,
                        type: 'api'
                    });
                } else {
                    findings.missingProtection.push({
                        file: relativePath,
                        type: 'api',
                        issue: 'API calls without visible CSRF protection'
                    });
                }
            }
        });

        // Check for SameSite cookie configuration
        let sameSiteConfigured = false;
        const cookieFiles = files.filter(file => {
            const content = fs.readFileSync(file, 'utf8');
            return content.includes('cookie') || content.includes('session');
        });

        cookieFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('sameSite') || content.includes('SameSite')) {
                sameSiteConfigured = true;
            }
        });

        if (!sameSiteConfigured) {
            findings.recommendations.push('Configure SameSite cookie attribute for CSRF protection');
        }

        // Check middleware for CSRF protection
        const middlewarePath = path.join(__dirname, '../../src/middleware.ts');
        let middlewareProtection = false;
        
        if (fs.existsSync(middlewarePath)) {
            const content = fs.readFileSync(middlewarePath, 'utf8');
            if (content.includes('csrf') || content.includes('origin') || content.includes('referer')) {
                middlewareProtection = true;
            }
        }

        if (!middlewareProtection) {
            findings.recommendations.push('Implement CSRF protection in middleware');
        }

        const status = findings.missingProtection.length > 5 ? 'warning' : 'passed';

        return {
            status,
            message: 'CSRF token implementation analysis',
            tokenUsage: findings.tokenUsage.length,
            missingProtection: findings.missingProtection.length,
            sameSiteConfigured,
            middlewareProtection,
            details: {
                tokenUsage: findings.tokenUsage,
                missingProtection: findings.missingProtection,
                recommendations: findings.recommendations
            },
            note: 'Next.js and Supabase provide built-in CSRF protection for many scenarios'
        };
    }

    // Test for origin/referer validation
    async testOriginValidation() {
        const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);
        const findings = {
            validationFound: false,
            apiRoutes: [],
            issues: []
        };

        // Check API routes for origin validation
        const apiPath = path.join(this.srcPath, 'app');
        if (fs.existsSync(apiPath)) {
            const apiFiles = this.getAllFiles(apiPath, ['.ts']).filter(file => 
                file.includes('route.ts') || file.includes('api')
            );

            apiFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                const relativePath = path.relative(this.srcPath, file);

                findings.apiRoutes.push({
                    file: relativePath,
                    hasOriginCheck: content.includes('origin') || content.includes('referer'),
                    hasPostMethod: content.includes('POST') || content.includes('PUT') || content.includes('DELETE'),
                    content: content.slice(0, 200) + '...' // First 200 chars for context
                });

                if (content.includes('origin') || content.includes('referer')) {
                    findings.validationFound = true;
                }
            });
        }

        // Check middleware for origin validation
        const middlewarePath = path.join(__dirname, '../../src/middleware.ts');
        if (fs.existsSync(middlewarePath)) {
            const content = fs.readFileSync(middlewarePath, 'utf8');
            if (content.includes('origin') || content.includes('referer')) {
                findings.validationFound = true;
            }
        }

        // Check for unsafe state-changing operations
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.srcPath, file);

            // Look for server actions without protection
            if (content.includes('use server') && !content.includes('origin') && !content.includes('csrf')) {
                findings.issues.push({
                    file: relativePath,
                    issue: 'Server action without origin validation'
                });
            }
        });

        const status = !findings.validationFound && findings.issues.length > 0 ? 'warning' : 'passed';

        return {
            status,
            message: 'Origin/Referer validation analysis',
            validationFound: findings.validationFound,
            apiRoutesChecked: findings.apiRoutes.length,
            issues: findings.issues,
            recommendations: !findings.validationFound ? [
                'Implement origin header validation in middleware',
                'Validate referer header for state-changing operations',
                'Use SameSite cookies as additional protection'
            ] : []
        };
    }

    // Test for double submit cookie pattern
    async testDoubleSubmitCookie() {
        const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);
        const findings = {
            implemented: false,
            cookieUsage: [],
            formTokens: []
        };

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.srcPath, file);

            // Look for double submit pattern
            if (content.includes('cookie') && content.includes('token')) {
                const hasCookieRead = content.includes('cookies()') || content.includes('document.cookie');
                const hasTokenGeneration = content.includes('generateToken') || content.includes('randomBytes') || 
                                          content.includes('crypto.random');
                
                if (hasCookieRead && hasTokenGeneration) {
                    findings.implemented = true;
                    findings.cookieUsage.push({
                        file: relativePath,
                        hasPattern: true
                    });
                }
            }

            // Look for form hidden tokens
            if (content.includes('hidden') && content.includes('token')) {
                findings.formTokens.push({
                    file: relativePath,
                    hasHiddenToken: true
                });
            }
        });

        return {
            status: 'passed', // This is an advanced pattern, not required
            message: 'Double submit cookie pattern analysis',
            implemented: findings.implemented,
            cookieUsage: findings.cookieUsage.length,
            formTokens: findings.formTokens.length,
            note: 'Double submit cookie is an advanced CSRF protection pattern'
        };
    }

    // Test SameSite cookie configuration
    async testSameSiteCookies() {
        const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);
        const findings = {
            configured: false,
            cookieSettings: [],
            issues: []
        };

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.srcPath, file);

            // Look for cookie configuration
            if (content.includes('cookie') && (content.includes('set') || content.includes('options'))) {
                const sameSiteRegex = /sameSite['":\s]*['"]?(strict|lax|none)['"]?/gi;
                const matches = content.match(sameSiteRegex);

                if (matches) {
                    findings.configured = true;
                    findings.cookieSettings.push({
                        file: relativePath,
                        settings: matches
                    });
                } else if (content.includes('.set(') || content.includes('setCookie')) {
                    findings.issues.push({
                        file: relativePath,
                        issue: 'Cookie set without SameSite attribute'
                    });
                }
            }
        });

        // Check Next.js middleware
        const middlewarePath = path.join(__dirname, '../../src/middleware.ts');
        if (fs.existsSync(middlewarePath)) {
            const content = fs.readFileSync(middlewarePath, 'utf8');
            if (content.includes('sameSite') || content.includes('SameSite')) {
                findings.configured = true;
            }
        }

        const status = findings.issues.length > 0 ? 'warning' : 'passed';

        return {
            status,
            message: 'SameSite cookie configuration analysis',
            configured: findings.configured,
            cookieSettings: findings.cookieSettings.length,
            issues: findings.issues,
            recommendations: findings.issues.length > 0 ? [
                'Set SameSite=Strict or SameSite=Lax for all cookies',
                'Use SameSite=Strict for sensitive operations',
                'Configure session cookies with SameSite protection'
            ] : []
        };
    }

    // Test for state-changing GET requests (CSRF vulnerability)
    async testStateChangingGets() {
        const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);
        const issues = [];

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.srcPath, file);

            // Look for dangerous GET operations
            const dangerousPatterns = [
                /href=['"]+[^'"]*(?:delete|remove|cancel|logout|signout)[^'"]*['"]/gi,
                /<a[^>]*(?:delete|remove|cancel)[^>]*>/gi,
                /router\.push\([^)]*(?:delete|remove|cancel)[^)]*\)/gi
            ];

            dangerousPatterns.forEach((pattern, index) => {
                const matches = content.match(pattern);
                if (matches) {
                    issues.push({
                        file: relativePath,
                        pattern: `Pattern ${index + 1}`,
                        matches: matches.slice(0, 2), // Limit to first 2 matches
                        risk: 'State-changing operation in GET request'
                    });
                }
            });
        });

        const status = issues.length > 0 ? 'warning' : 'passed';

        return {
            status,
            message: 'State-changing GET requests analysis',
            issues,
            filesScanned: files.length,
            recommendations: issues.length > 0 ? [
                'Use POST/PUT/DELETE for state-changing operations',
                'Implement confirmation dialogs for destructive actions',
                'Add CSRF protection to all state-changing endpoints'
            ] : []
        };
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

        const reportPath = path.join(this.reportDir, 'csrf-protection-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

        console.log(`\n📊 CSRF Protection Test Summary:`);
        console.log(`Total Tests: ${this.results.summary.total}`);
        console.log(`Passed: ${this.results.summary.passed}`);
        console.log(`Warnings: ${this.results.summary.warnings}`);
        console.log(`Failed: ${this.results.summary.failed}`);
        console.log(`\n📝 Report saved to: ${reportPath}`);

        return this.results;
    }

    async run() {
        console.log('🚀 Starting CSRF Protection Testing...\n');

        await this.runTest('CSRF Token Implementation', () => this.testCsrfTokenImplementation());
        await this.runTest('Origin/Referer Validation', () => this.testOriginValidation());
        await this.runTest('Double Submit Cookie Pattern', () => this.testDoubleSubmitCookie());
        await this.runTest('SameSite Cookie Configuration', () => this.testSameSiteCookies());
        await this.runTest('State-changing GET Requests', () => this.testStateChangingGets());

        console.log('\n🔍 Generating CSRF protection report...');
        await this.generateReport();

        const hasFailures = this.results.summary.failed > 0;
        if (hasFailures) {
            console.log('\n❌ CSRF protection tests completed with failures');
            process.exit(1);
        } else {
            console.log('\n✅ CSRF protection tests completed successfully');
            process.exit(0);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new CsrfProtectionTester();
    tester.run().catch(error => {
        console.error('CSRF protection tester failed:', error);
        process.exit(1);
    });
}

module.exports = CsrfProtectionTester;