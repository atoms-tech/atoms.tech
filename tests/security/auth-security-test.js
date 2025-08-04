#!/usr/bin/env node

/**
 * Authentication & Authorization Security Tests
 * Tests for common auth vulnerabilities and implementation issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AuthSecurityTester {
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
        this.srcPath = path.join(__dirname, '../../src');
        this.reportDir = path.join(__dirname, '../../test-results/security');
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

    // Test for hardcoded credentials
    async testHardcodedCredentials() {
        const suspiciousPatterns = [
            /password\s*[=:]\s*['"]\w+['"]|password\s*[=:]\s*\w+/gi,
            /secret\s*[=:]\s*['"]\w+['"]|secret\s*[=:]\s*\w+/gi,
            /token\s*[=:]\s*['"]\w+['"]|token\s*[=:]\s*\w+/gi,
            /api[_-]?key\s*[=:]\s*['"]\w+['"]|api[_-]?key\s*[=:]\s*\w+/gi,
            /private[_-]?key\s*[=:]\s*['"]\w+['"]|private[_-]?key\s*[=:]\s*\w+/gi
        ];

        const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);
        const findings = [];

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.srcPath, file);
            
            suspiciousPatterns.forEach((pattern, index) => {
                const matches = content.match(pattern);
                if (matches) {
                    // Exclude environment variable references and common safe patterns
                    const filteredMatches = matches.filter(match => 
                        !match.includes('process.env') &&
                        !match.includes('password: ""') &&
                        !match.includes('password: \'\'') &&
                        !match.includes('password: null') &&
                        !match.includes('password: undefined')
                    );
                    
                    if (filteredMatches.length > 0) {
                        findings.push({
                            file: relativePath,
                            pattern: pattern.toString(),
                            matches: filteredMatches
                        });
                    }
                }
            });
        });

        if (findings.length > 0) {
            throw new Error(`Found ${findings.length} potential hardcoded credentials`);
        }

        return {
            message: 'No hardcoded credentials found',
            filesScanned: files.length,
            patterns: suspiciousPatterns.length
        };
    }

    // Test session management implementation
    async testSessionManagement() {
        const issues = [];
        
        // Check for proper session handling in auth files
        const authFiles = [
            path.join(this.srcPath, 'hooks/useAuth.ts'),
            path.join(this.srcPath, 'app/(auth)/auth/actions.ts'),
            path.join(this.srcPath, 'lib/supabase/middleware.ts')
        ];

        authFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                const relativePath = path.relative(this.srcPath, file);

                // Check for session timeout implementation
                if (!content.includes('timeout') && !content.includes('expir')) {
                    issues.push({
                        file: relativePath,
                        issue: 'No explicit session timeout handling found'
                    });
                }

                // Check for secure session storage
                if (content.includes('localStorage') || content.includes('sessionStorage')) {
                    issues.push({
                        file: relativePath,
                        issue: 'Potential insecure session storage in browser storage'
                    });
                }

                // Check for proper logout implementation
                if (content.includes('signOut') || content.includes('logout')) {
                    if (!content.includes('clear') && !content.includes('remove')) {
                        issues.push({
                            file: relativePath,
                            issue: 'Logout may not properly clear session data'
                        });
                    }
                }
            }
        });

        return {
            status: issues.length > 0 ? 'warning' : 'passed',
            message: issues.length > 0 ? 
                `Found ${issues.length} session management concerns` : 
                'Session management looks secure',
            issues,
            filesChecked: authFiles.filter(f => fs.existsSync(f)).length
        };
    }

    // Test for insecure authentication patterns
    async testInsecureAuthPatterns() {
        const insecurePatterns = [
            {
                pattern: /auth\s*===?\s*['"]?\w+['"]?/gi,
                description: 'Simple string comparison for authentication'
            },
            {
                pattern: /password\s*===?\s*['"]?\w+['"]?/gi,
                description: 'Plain text password comparison'
            },
            {
                pattern: /btoa\s*\(.*password.*\)|atob\s*\(/gi,
                description: 'Base64 encoding used for password (not encryption)'
            },
            {
                pattern: /md5\s*\(.*password.*\)|sha1\s*\(.*password.*\)/gi,
                description: 'Weak hashing algorithms for passwords'
            }
        ];

        const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);
        const findings = [];

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.srcPath, file);
            
            insecurePatterns.forEach(({ pattern, description }) => {
                const matches = content.match(pattern);
                if (matches) {
                    findings.push({
                        file: relativePath,
                        description,
                        matches: matches.slice(0, 3) // Limit to first 3 matches
                    });
                }
            });
        });

        if (findings.length > 0) {
            throw new Error(`Found ${findings.length} insecure authentication patterns`);
        }

        return {
            message: 'No insecure authentication patterns found',
            filesScanned: files.length,
            patternsChecked: insecurePatterns.length
        };
    }

    // Test authorization implementation
    async testAuthorizationImplementation() {
        const issues = [];
        
        // Check for permission checking in components and API routes
        const permissionFile = path.join(this.srcPath, 'lib/auth/permissions.ts');
        
        if (!fs.existsSync(permissionFile)) {
            issues.push({
                type: 'missing',
                description: 'No centralized permission system found'
            });
        } else {
            const content = fs.readFileSync(permissionFile, 'utf8');
            
            // Check for role-based access control
            if (!content.includes('role') && !content.includes('permission')) {
                issues.push({
                    type: 'incomplete',
                    description: 'Permission system may be incomplete'
                });
            }
        }

        // Check API routes for authorization
        const apiPath = path.join(this.srcPath, 'app/(protected)/api');
        if (fs.existsSync(apiPath)) {
            const apiFiles = this.getAllFiles(apiPath, ['.ts']);
            let unprotectedRoutes = 0;

            apiFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                if (!content.includes('auth') && !content.includes('user') && !content.includes('session')) {
                    unprotectedRoutes++;
                }
            });

            if (unprotectedRoutes > 0) {
                issues.push({
                    type: 'unprotected',
                    description: `${unprotectedRoutes} API routes may lack authorization checks`
                });
            }
        }

        return {
            status: issues.length > 0 ? 'warning' : 'passed',
            message: issues.length > 0 ? 
                `Found ${issues.length} authorization concerns` : 
                'Authorization implementation looks secure',
            issues
        };
    }

    // Test for JWT token security
    async testJwtSecurity() {
        const issues = [];
        const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);

        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(this.srcPath, file);

            // Check for JWT without proper validation
            if (content.includes('jwt') || content.includes('token')) {
                // Look for unsafe JWT usage
                if (content.includes('jwt.decode') && !content.includes('verify')) {
                    issues.push({
                        file: relativePath,
                        issue: 'JWT decoding without verification'
                    });
                }

                // Check for JWT storage in localStorage
                if (content.includes('localStorage') && content.includes('token')) {
                    issues.push({
                        file: relativePath,
                        issue: 'JWT token stored in localStorage (vulnerable to XSS)'
                    });
                }
            }
        });

        // Check for proper JWT configuration
        const jwtIssues = [];
        const configFiles = [
            path.join(__dirname, '../../next.config.js'),
            path.join(__dirname, '../../.env.example')
        ];

        configFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('JWT_SECRET') && content.includes('your-secret-here')) {
                    jwtIssues.push({
                        file: path.basename(file),
                        issue: 'Default JWT secret detected'
                    });
                }
            }
        });

        return {
            status: issues.length > 0 || jwtIssues.length > 0 ? 'warning' : 'passed',
            message: `JWT security analysis completed`,
            codeIssues: issues,
            configIssues: jwtIssues,
            filesScanned: files.length
        };
    }

    // Test password policy enforcement
    async testPasswordPolicy() {
        const authFiles = [
            path.join(this.srcPath, 'app/(auth)/signup/page.tsx'),
            path.join(this.srcPath, 'app/(auth)/auth/actions.ts')
        ];

        const policyChecks = [];
        let hasPasswordValidation = false;

        authFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                const relativePath = path.relative(this.srcPath, file);

                // Check for password validation
                if (content.includes('password') && (
                    content.includes('length') || 
                    content.includes('regex') || 
                    content.includes('pattern') ||
                    content.includes('validation')
                )) {
                    hasPasswordValidation = true;
                    policyChecks.push({
                        file: relativePath,
                        hasValidation: true
                    });
                }
            }
        });

        return {
            status: hasPasswordValidation ? 'passed' : 'warning',
            message: hasPasswordValidation ? 
                'Password validation detected' : 
                'No client-side password validation found (may rely on Supabase)',
            checks: policyChecks,
            note: 'Supabase Auth handles server-side password requirements'
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

        const reportPath = path.join(this.reportDir, 'auth-security-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

        console.log(`\n📊 Authentication Security Test Summary:`);
        console.log(`Total Tests: ${this.results.summary.total}`);
        console.log(`Passed: ${this.results.summary.passed}`);
        console.log(`Warnings: ${this.results.summary.warnings}`);
        console.log(`Failed: ${this.results.summary.failed}`);
        console.log(`\n📝 Report saved to: ${reportPath}`);

        return this.results;
    }

    async run() {
        console.log('🚀 Starting Authentication Security Testing...\n');

        await this.runTest('Hardcoded Credentials', () => this.testHardcodedCredentials());
        await this.runTest('Session Management', () => this.testSessionManagement());
        await this.runTest('Insecure Auth Patterns', () => this.testInsecureAuthPatterns());
        await this.runTest('Authorization Implementation', () => this.testAuthorizationImplementation());
        await this.runTest('JWT Security', () => this.testJwtSecurity());
        await this.runTest('Password Policy', () => this.testPasswordPolicy());

        console.log('\n🔍 Generating authentication security report...');
        await this.generateReport();

        const hasFailures = this.results.summary.failed > 0;
        if (hasFailures) {
            console.log('\n❌ Authentication security tests completed with failures');
            process.exit(1);
        } else {
            console.log('\n✅ Authentication security tests completed successfully');
            process.exit(0);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new AuthSecurityTester();
    tester.run().catch(error => {
        console.error('Authentication security tester failed:', error);
        process.exit(1);
    });
}

module.exports = AuthSecurityTester;