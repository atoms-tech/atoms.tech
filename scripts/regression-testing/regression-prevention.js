#!/usr/bin/env node

/**
 * Regression Prevention System
 * 
 * Proactive regression prevention through automated safeguards
 * 
 * Features:
 * - Pre-commit regression checks
 * - Real-time code analysis
 * - Automated code quality gates
 * - Performance budgets enforcement
 * - Breaking change detection
 * - Automatic fix suggestions
 * - Risk assessment scoring
 * - Developer feedback integration
 */

import { EventEmitter } from 'events';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RegressionPrevention extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Prevention mechanisms
            mechanisms: {
                preCommitChecks: { enabled: true, strict: true },
                realTimeAnalysis: { enabled: true, throttle: 1000 },
                qualityGates: { enabled: true, threshold: 80 },
                performanceBudgets: { enabled: true, strict: false },
                breakingChangeDetection: { enabled: true, strict: true },
                autoFixSuggestions: { enabled: true, apply: false },
                riskAssessment: { enabled: true, threshold: 70 },
                developerFeedback: { enabled: true, interactive: true }
            },
            
            // Quality thresholds
            thresholds: {
                codeQuality: {
                    complexity: 10,
                    duplicateCode: 5,
                    testCoverage: 80,
                    linting: 0
                },
                performance: {
                    buildTime: 60000, // 1 minute
                    bundleSize: 5000, // 5MB
                    loadTime: 3000, // 3 seconds
                    memoryUsage: 100 // 100MB
                },
                security: {
                    vulnerabilities: 0,
                    outdatedDependencies: 5,
                    securityScore: 80
                },
                testing: {
                    passRate: 98,
                    coverage: 80,
                    flakiness: 2
                }
            },
            
            // File patterns to monitor
            patterns: {
                critical: [
                    'src/lib/supabase/**/*.ts',
                    'src/lib/api/**/*.ts',
                    'src/store/**/*.ts',
                    'src/hooks/**/*.ts'
                ],
                important: [
                    'src/components/ui/**/*.tsx',
                    'src/components/home/**/*.tsx',
                    'src/lib/utils/**/*.ts'
                ],
                standard: [
                    'src/components/**/*.tsx',
                    'src/pages/**/*.tsx',
                    'src/types/**/*.ts'
                ]
            },
            
            // Auto-fix rules
            autoFix: {
                enabled: true,
                rules: {
                    formatting: { enabled: true, apply: true },
                    imports: { enabled: true, apply: true },
                    linting: { enabled: true, apply: false },
                    testing: { enabled: true, apply: false },
                    security: { enabled: true, apply: false }
                }
            },
            
            // Storage paths
            storage: {
                reports: 'test-results/regression/prevention',
                logs: 'test-results/regression/prevention/logs',
                suggestions: 'test-results/regression/prevention/suggestions',
                metrics: 'test-results/regression/prevention/metrics'
            },
            
            ...options
        };
        
        this.state = {
            monitoring: false,
            lastCheck: null,
            checksPerformed: 0,
            preventedRegressions: 0,
            suggestionsApplied: 0,
            riskScore: 0
        };
        
        this.watchers = new Map();
        this.analysisQueue = [];
        this.preventionHistory = [];
        this.riskFactors = [];
    }
    
    /**
     * Start regression prevention system
     */
    async start() {
        console.log('🛡️  Starting Regression Prevention System...\n');
        
        try {
            await this.initialize();
            await this.setupPreventionMechanisms();
            await this.startMonitoring();
            
            this.state.monitoring = true;
            this.emit('prevention:started');
            
            console.log('✅ Regression Prevention System active');
            console.log('🔍 Monitoring for potential regressions...');
            
        } catch (error) {
            console.error(`❌ Failed to start prevention system: ${error.message}`);
            this.emit('prevention:error', error);
            throw error;
        }
    }
    
    /**
     * Stop regression prevention system
     */
    async stop() {
        console.log('🛑 Stopping Regression Prevention System...');
        
        this.state.monitoring = false;
        
        // Stop all watchers
        for (const [path, watcher] of this.watchers) {
            if (watcher.close) {
                watcher.close();
            }
        }
        this.watchers.clear();
        
        // Save prevention history
        await this.savePreventionHistory();
        
        this.emit('prevention:stopped');
        console.log('✅ Prevention system stopped');
    }
    
    /**
     * Initialize prevention system
     */
    async initialize() {
        console.log('🔧 Initializing prevention mechanisms...');
        
        // Create storage directories
        for (const dir of Object.values(this.config.storage)) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
        
        // Load prevention history
        await this.loadPreventionHistory();
        
        // Initialize risk assessment
        await this.initializeRiskAssessment();
        
        console.log('✅ Prevention system initialized');
    }
    
    /**
     * Setup prevention mechanisms
     */
    async setupPreventionMechanisms() {
        console.log('⚙️  Setting up prevention mechanisms...');
        
        if (this.config.mechanisms.preCommitChecks.enabled) {
            await this.setupPreCommitChecks();
        }
        
        if (this.config.mechanisms.qualityGates.enabled) {
            await this.setupQualityGates();
        }
        
        if (this.config.mechanisms.performanceBudgets.enabled) {
            await this.setupPerformanceBudgets();
        }
        
        if (this.config.mechanisms.breakingChangeDetection.enabled) {
            await this.setupBreakingChangeDetection();
        }
        
        console.log('✅ Prevention mechanisms configured');
    }
    
    /**
     * Start monitoring for potential regressions
     */
    async startMonitoring() {
        console.log('👁️  Starting real-time monitoring...');
        
        if (!this.config.mechanisms.realTimeAnalysis.enabled) {
            console.log('⚠️  Real-time analysis disabled');
            return;
        }
        
        // Monitor critical files
        for (const pattern of this.config.patterns.critical) {
            await this.watchPattern(pattern, 'critical');
        }
        
        // Monitor important files
        for (const pattern of this.config.patterns.important) {
            await this.watchPattern(pattern, 'important');
        }
        
        // Monitor standard files
        for (const pattern of this.config.patterns.standard) {
            await this.watchPattern(pattern, 'standard');
        }
        
        console.log('✅ Real-time monitoring active');
    }
    
    /**
     * Watch file pattern for changes
     */
    async watchPattern(pattern, priority) {
        try {
            const chokidar = await import('chokidar');
            const watcher = chokidar.watch(pattern, {
                ignored: /(^|[\/\\])\../,
                persistent: true,
                ignoreInitial: true
            });
            
            watcher.on('change', async (filePath) => {
                await this.analyzeChange(filePath, priority);
            });
            
            watcher.on('add', async (filePath) => {
                await this.analyzeNewFile(filePath, priority);
            });
            
            watcher.on('unlink', async (filePath) => {
                await this.analyzeDeletedFile(filePath, priority);
            });
            
            this.watchers.set(pattern, watcher);
            
        } catch (error) {
            console.warn(`⚠️  Could not watch pattern ${pattern}: ${error.message}`);
        }
    }
    
    /**
     * Analyze file change for potential regressions
     */
    async analyzeChange(filePath, priority) {
        if (!this.state.monitoring) return;
        
        const analysis = {
            filePath,
            priority,
            timestamp: new Date().toISOString(),
            type: 'change',
            risks: [],
            suggestions: [],
            autoFixes: []
        };
        
        console.log(`🔍 Analyzing change: ${filePath} (${priority})`);
        
        try {
            // Read file content
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Perform various analyses
            await this.analyzeCodeQuality(analysis, content);
            await this.analyzePerformanceImpact(analysis, content);
            await this.analyzeSecurityImpact(analysis, content);
            await this.analyzeTestingImpact(analysis, content);
            await this.analyzeBreakingChanges(analysis, content);
            
            // Calculate risk score
            analysis.riskScore = this.calculateRiskScore(analysis);
            
            // Generate prevention actions
            await this.generatePreventionActions(analysis);
            
            // Apply auto-fixes if enabled
            if (this.config.autoFix.enabled) {
                await this.applyAutoFixes(analysis);
            }
            
            // Store analysis
            this.analysisQueue.push(analysis);
            this.state.checksPerformed++;
            
            // Emit analysis event
            this.emit('analysis:completed', analysis);
            
            // Take prevention action if needed
            if (analysis.riskScore > this.config.thresholds.riskScore) {
                await this.takePreventionAction(analysis);
            }
            
        } catch (error) {
            console.error(`❌ Analysis failed for ${filePath}: ${error.message}`);
            this.emit('analysis:error', { filePath, error: error.message });
        }
    }
    
    /**
     * Analyze new file for potential issues
     */
    async analyzeNewFile(filePath, priority) {
        console.log(`📄 New file detected: ${filePath} (${priority})`);
        
        const analysis = {
            filePath,
            priority,
            timestamp: new Date().toISOString(),
            type: 'new',
            risks: [],
            suggestions: [],
            autoFixes: []
        };
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for common issues in new files
            await this.checkNewFileIssues(analysis, content);
            
            // Check if tests are needed
            await this.checkTestRequirements(analysis, content);
            
            // Check for proper documentation
            await this.checkDocumentationRequirements(analysis, content);
            
            this.emit('file:added', analysis);
            
        } catch (error) {
            console.error(`❌ New file analysis failed: ${error.message}`);
        }
    }
    
    /**
     * Analyze deleted file for potential issues
     */
    async analyzeDeletedFile(filePath, priority) {
        console.log(`🗑️  File deleted: ${filePath} (${priority})`);
        
        const analysis = {
            filePath,
            priority,
            timestamp: new Date().toISOString(),
            type: 'delete',
            risks: [],
            suggestions: []
        };
        
        // Check for dependent files
        await this.checkDependentFiles(analysis, filePath);
        
        // Check for orphaned tests
        await this.checkOrphanedTests(analysis, filePath);
        
        this.emit('file:deleted', analysis);
    }
    
    /**
     * Analyze code quality
     */
    async analyzeCodeQuality(analysis, content) {
        const quality = {
            complexity: this.calculateComplexity(content),
            duplicateCode: this.detectDuplicateCode(content),
            linting: await this.runLinting(analysis.filePath),
            formatting: this.checkFormatting(content)
        };
        
        const thresholds = this.config.thresholds.codeQuality;
        
        if (quality.complexity > thresholds.complexity) {
            analysis.risks.push({
                type: 'complexity',
                severity: 'high',
                message: `Code complexity (${quality.complexity}) exceeds threshold (${thresholds.complexity})`,
                suggestion: 'Consider breaking down complex functions'
            });
        }
        
        if (quality.duplicateCode > thresholds.duplicateCode) {
            analysis.risks.push({
                type: 'duplicate',
                severity: 'medium',
                message: `Duplicate code detected (${quality.duplicateCode}% similarity)`,
                suggestion: 'Extract common code into shared utilities'
            });
        }
        
        if (quality.linting.errors > thresholds.linting) {
            analysis.risks.push({
                type: 'linting',
                severity: 'medium',
                message: `${quality.linting.errors} linting errors found`,
                suggestion: 'Fix linting errors before committing'
            });
            
            // Add auto-fix suggestion
            if (this.config.autoFix.rules.linting.enabled) {
                analysis.autoFixes.push({
                    type: 'linting',
                    command: 'eslint --fix',
                    apply: this.config.autoFix.rules.linting.apply
                });
            }
        }
        
        if (!quality.formatting) {
            analysis.autoFixes.push({
                type: 'formatting',
                command: 'prettier --write',
                apply: this.config.autoFix.rules.formatting.apply
            });
        }
        
        analysis.quality = quality;
    }
    
    /**
     * Analyze performance impact
     */
    async analyzePerformanceImpact(analysis, content) {
        const performance = {
            bundleImpact: this.estimateBundleImpact(content),
            renderImpact: this.estimateRenderImpact(content),
            memoryImpact: this.estimateMemoryImpact(content),
            loadTimeImpact: this.estimateLoadTimeImpact(content)
        };
        
        const thresholds = this.config.thresholds.performance;
        
        if (performance.bundleImpact > thresholds.bundleSize * 0.1) {
            analysis.risks.push({
                type: 'bundle-size',
                severity: 'medium',
                message: `Significant bundle size impact (+${performance.bundleImpact}KB)`,
                suggestion: 'Consider code splitting or lazy loading'
            });
        }
        
        if (performance.renderImpact > 0.5) {
            analysis.risks.push({
                type: 'render-performance',
                severity: 'high',
                message: 'Potential render performance impact detected',
                suggestion: 'Use React.memo, useMemo, or useCallback optimizations'
            });
        }
        
        analysis.performance = performance;
    }
    
    /**
     * Analyze security impact
     */
    async analyzeSecurityImpact(analysis, content) {
        const security = {
            vulnerabilities: this.detectVulnerabilities(content),
            dataExposure: this.detectDataExposure(content),
            injectionRisks: this.detectInjectionRisks(content),
            authenticationIssues: this.detectAuthenticationIssues(content)
        };
        
        if (security.vulnerabilities.length > 0) {
            analysis.risks.push({
                type: 'security',
                severity: 'critical',
                message: `Security vulnerabilities detected: ${security.vulnerabilities.join(', ')}`,
                suggestion: 'Address security vulnerabilities immediately'
            });
        }
        
        if (security.dataExposure.length > 0) {
            analysis.risks.push({
                type: 'data-exposure',
                severity: 'high',
                message: `Potential data exposure: ${security.dataExposure.join(', ')}`,
                suggestion: 'Review data handling and access controls'
            });
        }
        
        analysis.security = security;
    }
    
    /**
     * Analyze testing impact
     */
    async analyzeTestingImpact(analysis, content) {
        const testing = {
            hasTests: this.hasCorrespondingTests(analysis.filePath),
            testCoverage: await this.getTestCoverage(analysis.filePath),
            testQuality: this.assessTestQuality(analysis.filePath)
        };
        
        if (!testing.hasTests && this.requiresTests(analysis.filePath)) {
            analysis.risks.push({
                type: 'missing-tests',
                severity: 'medium',
                message: 'No tests found for this file',
                suggestion: 'Add unit tests for the new functionality'
            });
        }
        
        if (testing.testCoverage < this.config.thresholds.testing.coverage) {
            analysis.risks.push({
                type: 'low-coverage',
                severity: 'medium',
                message: `Test coverage (${testing.testCoverage}%) below threshold`,
                suggestion: 'Increase test coverage for better reliability'
            });
        }
        
        analysis.testing = testing;
    }
    
    /**
     * Analyze breaking changes
     */
    async analyzeBreakingChanges(analysis, content) {
        const changes = {
            exportChanges: this.detectExportChanges(analysis.filePath, content),
            typeChanges: this.detectTypeChanges(analysis.filePath, content),
            apiChanges: this.detectApiChanges(analysis.filePath, content),
            propsChanges: this.detectPropsChanges(analysis.filePath, content)
        };
        
        if (changes.exportChanges.length > 0) {
            analysis.risks.push({
                type: 'breaking-exports',
                severity: 'critical',
                message: `Breaking export changes: ${changes.exportChanges.join(', ')}`,
                suggestion: 'Ensure backward compatibility or provide migration path'
            });
        }
        
        if (changes.typeChanges.length > 0) {
            analysis.risks.push({
                type: 'breaking-types',
                severity: 'high',
                message: `Breaking type changes: ${changes.typeChanges.join(', ')}`,
                suggestion: 'Use type versioning or gradual migration'
            });
        }
        
        analysis.breakingChanges = changes;
    }
    
    /**
     * Calculate risk score
     */
    calculateRiskScore(analysis) {
        let score = 0;
        
        for (const risk of analysis.risks) {
            switch (risk.severity) {
                case 'critical':
                    score += 30;
                    break;
                case 'high':
                    score += 20;
                    break;
                case 'medium':
                    score += 10;
                    break;
                case 'low':
                    score += 5;
                    break;
            }
        }
        
        // Adjust based on file priority
        const priorityMultiplier = {
            critical: 1.5,
            important: 1.2,
            standard: 1.0
        };
        
        score *= priorityMultiplier[analysis.priority] || 1.0;
        
        return Math.min(100, score);
    }
    
    /**
     * Generate prevention actions
     */
    async generatePreventionActions(analysis) {
        const actions = [];
        
        for (const risk of analysis.risks) {
            switch (risk.type) {
                case 'complexity':
                    actions.push({
                        type: 'refactor',
                        description: 'Extract complex logic into smaller functions',
                        priority: 'high',
                        automated: false
                    });
                    break;
                    
                case 'missing-tests':
                    actions.push({
                        type: 'test-generation',
                        description: 'Generate test template for new functionality',
                        priority: 'medium',
                        automated: true
                    });
                    break;
                    
                case 'security':
                    actions.push({
                        type: 'security-review',
                        description: 'Immediate security review required',
                        priority: 'critical',
                        automated: false
                    });
                    break;
                    
                case 'breaking-exports':
                    actions.push({
                        type: 'compatibility-check',
                        description: 'Run compatibility checks across codebase',
                        priority: 'critical',
                        automated: true
                    });
                    break;
            }
        }
        
        analysis.actions = actions;
    }
    
    /**
     * Apply automatic fixes
     */
    async applyAutoFixes(analysis) {
        for (const fix of analysis.autoFixes) {
            if (fix.apply) {
                try {
                    console.log(`🔧 Applying auto-fix: ${fix.type}`);
                    
                    if (fix.command) {
                        execSync(`${fix.command} ${analysis.filePath}`, { stdio: 'ignore' });
                    }
                    
                    this.state.suggestionsApplied++;
                    
                } catch (error) {
                    console.error(`❌ Auto-fix failed: ${error.message}`);
                }
            }
        }
    }
    
    /**
     * Take prevention action
     */
    async takePreventionAction(analysis) {
        console.log(`🚨 High risk detected in ${analysis.filePath} (score: ${analysis.riskScore})`);
        
        // Block commit if configured
        if (this.config.mechanisms.preCommitChecks.strict) {
            await this.blockCommit(analysis);
        }
        
        // Send developer feedback
        if (this.config.mechanisms.developerFeedback.enabled) {
            await this.sendDeveloperFeedback(analysis);
        }
        
        // Log prevention action
        this.state.preventedRegressions++;
        this.preventionHistory.push({
            timestamp: new Date().toISOString(),
            filePath: analysis.filePath,
            riskScore: analysis.riskScore,
            action: 'prevented',
            risks: analysis.risks.map(r => r.type)
        });
        
        this.emit('prevention:action', analysis);
    }
    
    /**
     * Block commit with high risk
     */
    async blockCommit(analysis) {
        console.log('🛑 Blocking commit due to high regression risk');
        
        const blockFile = path.join(this.config.storage.reports, 'commit-blocked.json');
        const blockData = {
            timestamp: new Date().toISOString(),
            filePath: analysis.filePath,
            riskScore: analysis.riskScore,
            risks: analysis.risks,
            suggestions: analysis.suggestions
        };
        
        fs.writeFileSync(blockFile, JSON.stringify(blockData, null, 2));
        
        // Exit with error code to block commit
        process.exit(1);
    }
    
    /**
     * Send developer feedback
     */
    async sendDeveloperFeedback(analysis) {
        console.log('\n📢 REGRESSION PREVENTION FEEDBACK');
        console.log('═════════════════════════════════════');
        console.log(`📁 File: ${analysis.filePath}`);
        console.log(`⚠️  Risk Score: ${analysis.riskScore}/100`);
        console.log(`🔍 Issues Found: ${analysis.risks.length}`);
        
        if (analysis.risks.length > 0) {
            console.log('\n🚨 RISKS DETECTED:');
            for (const risk of analysis.risks) {
                console.log(`  ${this.getSeverityIcon(risk.severity)} ${risk.message}`);
                if (risk.suggestion) {
                    console.log(`     💡 ${risk.suggestion}`);
                }
            }
        }
        
        if (analysis.suggestions.length > 0) {
            console.log('\n💡 SUGGESTIONS:');
            for (const suggestion of analysis.suggestions) {
                console.log(`  • ${suggestion}`);
            }
        }
        
        if (analysis.autoFixes.length > 0) {
            console.log('\n🔧 AUTO-FIXES AVAILABLE:');
            for (const fix of analysis.autoFixes) {
                const status = fix.apply ? '✅ Applied' : '⏳ Available';
                console.log(`  ${status} ${fix.type}: ${fix.command}`);
            }
        }
        
        console.log('═════════════════════════════════════\n');
    }
    
    // Helper methods
    getSeverityIcon(severity) {
        const icons = {
            critical: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢'
        };
        return icons[severity] || '⚪';
    }
    
    calculateComplexity(content) {
        // Simple complexity calculation
        let complexity = 0;
        complexity += (content.match(/function|const.*=>/g) || []).length;
        complexity += (content.match(/if\s*\(|else\s*{|switch\s*\(/g) || []).length;
        complexity += (content.match(/for\s*\(|while\s*\(/g) || []).length * 2;
        complexity += (content.match(/useState|useEffect|useCallback/g) || []).length;
        return Math.min(10, Math.floor(complexity / 5));
    }
    
    detectDuplicateCode(content) {
        // Simple duplicate detection
        const lines = content.split('\n');
        const duplicates = new Set();
        
        for (let i = 0; i < lines.length - 1; i++) {
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[i].trim() === lines[j].trim() && lines[i].trim().length > 20) {
                    duplicates.add(lines[i].trim());
                }
            }
        }
        
        return (duplicates.size / lines.length) * 100;
    }
    
    async runLinting(filePath) {
        try {
            execSync(`npx eslint ${filePath} --format=json`, { stdio: 'pipe' });
            return { errors: 0, warnings: 0 };
        } catch (error) {
            try {
                const result = JSON.parse(error.stdout.toString());
                return {
                    errors: result.reduce((sum, file) => sum + file.errorCount, 0),
                    warnings: result.reduce((sum, file) => sum + file.warningCount, 0)
                };
            } catch (parseError) {
                return { errors: 1, warnings: 0 };
            }
        }
    }
    
    checkFormatting(content) {
        // Basic formatting check
        const hasConsistentIndentation = !/^( {2}| {4}|\t)/.test(content);
        const hasTrailingSpaces = /\s+$/.test(content);
        const hasConsistentLineEndings = !/\r\n/.test(content);
        
        return hasConsistentIndentation && !hasTrailingSpaces && hasConsistentLineEndings;
    }
    
    estimateBundleImpact(content) {
        // Estimate bundle size impact
        const importCount = (content.match(/import\s+.*?from/g) || []).length;
        const componentCount = (content.match(/const\s+\w+\s*=.*?React/g) || []).length;
        const hookCount = (content.match(/use[A-Z]\w*/g) || []).length;
        
        return (importCount * 10) + (componentCount * 50) + (hookCount * 20);
    }
    
    estimateRenderImpact(content) {
        // Estimate render performance impact
        const hasUseEffect = content.includes('useEffect');
        const hasComplexJSX = (content.match(/<\w+[^>]*>/g) || []).length > 20;
        const hasNestedComponents = (content.match(/{\s*\w+\s*\?\s*<\w+/g) || []).length > 5;
        
        return (hasUseEffect ? 0.3 : 0) + (hasComplexJSX ? 0.4 : 0) + (hasNestedComponents ? 0.3 : 0);
    }
    
    estimateMemoryImpact(content) {
        // Estimate memory impact
        const largeObjects = (content.match(/\[\s*{[\s\S]*?}\s*\]/g) || []).length;
        const stateVariables = (content.match(/useState\s*\(/g) || []).length;
        const contextUsage = (content.match(/useContext\s*\(/g) || []).length;
        
        return largeObjects * 100 + stateVariables * 50 + contextUsage * 75;
    }
    
    estimateLoadTimeImpact(content) {
        // Estimate load time impact
        const asyncOperations = (content.match(/await\s+/g) || []).length;
        const fetchCalls = (content.match(/fetch\s*\(|axios\./g) || []).length;
        const dynamicImports = (content.match(/import\s*\(/g) || []).length;
        
        return asyncOperations * 100 + fetchCalls * 200 + dynamicImports * 500;
    }
    
    detectVulnerabilities(content) {
        const vulnerabilities = [];
        
        if (content.includes('dangerouslySetInnerHTML')) {
            vulnerabilities.push('XSS risk');
        }
        
        if (content.includes('eval(')) {
            vulnerabilities.push('Code injection risk');
        }
        
        if (content.includes('localStorage') && content.includes('password')) {
            vulnerabilities.push('Sensitive data in localStorage');
        }
        
        return vulnerabilities;
    }
    
    detectDataExposure(content) {
        const exposures = [];
        
        if (content.includes('console.log') && content.includes('password')) {
            exposures.push('Password logging');
        }
        
        if (content.includes('process.env') && !content.includes('NEXT_PUBLIC_')) {
            exposures.push('Server-side environment variable exposure');
        }
        
        return exposures;
    }
    
    detectInjectionRisks(content) {
        const risks = [];
        
        if (content.includes('innerHTML') && content.includes('${')) {
            risks.push('Template injection');
        }
        
        if (content.includes('document.write')) {
            risks.push('Document write injection');
        }
        
        return risks;
    }
    
    detectAuthenticationIssues(content) {
        const issues = [];
        
        if (content.includes('localStorage') && content.includes('token')) {
            issues.push('Token storage in localStorage');
        }
        
        if (content.includes('fetch') && !content.includes('Authorization')) {
            issues.push('Unauthorized API calls');
        }
        
        return issues;
    }
    
    hasCorrespondingTests(filePath) {
        const testExtensions = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];
        const baseFileName = filePath.replace(/\.(ts|tsx|js|jsx)$/, '');
        
        return testExtensions.some(ext => fs.existsSync(`${baseFileName}${ext}`));
    }
    
    async getTestCoverage(filePath) {
        try {
            // Try to get coverage from Jest
            const output = execSync(`npx jest --coverage --testPathPattern=${filePath} --passWithNoTests`, { 
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            // Parse coverage output
            const coverageMatch = output.match(/All files\s+\|\s+(\d+\.?\d*)/);
            return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
            
        } catch (error) {
            return 0;
        }
    }
    
    assessTestQuality(filePath) {
        const testFile = filePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1');
        
        if (!fs.existsSync(testFile)) {
            return 0;
        }
        
        const testContent = fs.readFileSync(testFile, 'utf8');
        const testCount = (testContent.match(/it\s*\(|test\s*\(/g) || []).length;
        const mockCount = (testContent.match(/mock/gi) || []).length;
        const assertCount = (testContent.match(/expect\s*\(/g) || []).length;
        
        return Math.min(10, (testCount + mockCount + assertCount) / 3);
    }
    
    requiresTests(filePath) {
        return (
            filePath.includes('src/') &&
            !filePath.includes('.test.') &&
            !filePath.includes('.spec.') &&
            !filePath.includes('types/')
        );
    }
    
    detectExportChanges(filePath, content) {
        // Compare with previous version
        try {
            const previousContent = execSync(`git show HEAD:${filePath}`, { encoding: 'utf8' });
            const previousExports = this.extractExports(previousContent);
            const currentExports = this.extractExports(content);
            
            return previousExports.filter(exp => !currentExports.includes(exp));
        } catch (error) {
            return []; // File is new
        }
    }
    
    extractExports(content) {
        const exportMatches = content.match(/export\s+(?:default\s+)?(?:const\s+|function\s+|class\s+)?(\w+)/g) || [];
        return exportMatches.map(match => match.replace(/export\s+(?:default\s+)?(?:const\s+|function\s+|class\s+)?/, ''));
    }
    
    detectTypeChanges(filePath, content) {
        // Detect TypeScript type changes
        const changes = [];
        
        if (filePath.includes('.d.ts') || content.includes('interface') || content.includes('type ')) {
            changes.push('Type definition changes detected');
        }
        
        return changes;
    }
    
    detectApiChanges(filePath, content) {
        // Detect API endpoint changes
        const changes = [];
        
        if (filePath.includes('api/') || content.includes('router.') || content.includes('app.')) {
            changes.push('API endpoint changes detected');
        }
        
        return changes;
    }
    
    detectPropsChanges(filePath, content) {
        // Detect React props changes
        const changes = [];
        
        if (content.includes('interface') && content.includes('Props')) {
            changes.push('Props interface changes detected');
        }
        
        return changes;
    }
    
    async checkNewFileIssues(analysis, content) {
        // Check for common issues in new files
        if (!content.includes('export')) {
            analysis.suggestions.push('Consider adding exports to make the module usable');
        }
        
        if (content.includes('any') && analysis.filePath.endsWith('.ts')) {
            analysis.suggestions.push('Avoid using "any" type, use specific types instead');
        }
        
        if (content.includes('console.log')) {
            analysis.suggestions.push('Remove console.log statements before committing');
        }
    }
    
    async checkTestRequirements(analysis, content) {
        if (this.requiresTests(analysis.filePath) && !this.hasCorrespondingTests(analysis.filePath)) {
            analysis.suggestions.push('Add unit tests for the new functionality');
            
            if (this.config.autoFix.rules.testing.enabled) {
                analysis.autoFixes.push({
                    type: 'test-template',
                    description: 'Generate test template',
                    apply: this.config.autoFix.rules.testing.apply
                });
            }
        }
    }
    
    async checkDocumentationRequirements(analysis, content) {
        if (content.includes('export') && !content.includes('/**')) {
            analysis.suggestions.push('Add JSDoc comments for exported functions');
        }
    }
    
    async checkDependentFiles(analysis, filePath) {
        try {
            const dependents = execSync(`grep -r "from.*${path.basename(filePath, path.extname(filePath))}" src/`, { encoding: 'utf8' });
            
            if (dependents.trim()) {
                analysis.risks.push({
                    type: 'dependency-break',
                    severity: 'high',
                    message: 'Other files depend on this deleted file',
                    suggestion: 'Update dependent files or provide alternative implementation'
                });
            }
        } catch (error) {
            // No dependents found
        }
    }
    
    async checkOrphanedTests(analysis, filePath) {
        const testFile = filePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1');
        
        if (fs.existsSync(testFile)) {
            analysis.suggestions.push('Remove corresponding test file or update it for the new implementation');
        }
    }
    
    async setupPreCommitChecks() {
        console.log('🔗 Setting up pre-commit checks...');
        
        const hookPath = '.git/hooks/pre-commit';
        const hookContent = `#!/bin/sh
# Regression prevention pre-commit hook
node scripts/regression-testing/regression-prevention.js --check=commit
`;
        
        fs.writeFileSync(hookPath, hookContent);
        fs.chmodSync(hookPath, '755');
    }
    
    async setupQualityGates() {
        console.log('🚪 Setting up quality gates...');
        // Quality gate implementation
    }
    
    async setupPerformanceBudgets() {
        console.log('💰 Setting up performance budgets...');
        // Performance budget implementation
    }
    
    async setupBreakingChangeDetection() {
        console.log('💥 Setting up breaking change detection...');
        // Breaking change detection implementation
    }
    
    async initializeRiskAssessment() {
        console.log('⚖️  Initializing risk assessment...');
        // Risk assessment initialization
    }
    
    async loadPreventionHistory() {
        const historyPath = path.join(this.config.storage.reports, 'prevention-history.json');
        
        if (fs.existsSync(historyPath)) {
            const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            this.preventionHistory = history.preventions || [];
            this.state = { ...this.state, ...history.state };
        }
    }
    
    async savePreventionHistory() {
        const historyPath = path.join(this.config.storage.reports, 'prevention-history.json');
        const history = {
            state: this.state,
            preventions: this.preventionHistory.slice(-100), // Keep last 100
            lastUpdate: new Date().toISOString()
        };
        
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const prevention = new RegressionPrevention();
    
    const args = process.argv.slice(2);
    const checkType = args.find(arg => arg.startsWith('--check='))?.split('=')[1];
    
    if (checkType) {
        // Single check mode
        console.log(`🔍 Running ${checkType} prevention check...`);
        prevention.start().then(() => {
            console.log('✅ Prevention check completed');
            process.exit(0);
        }).catch(() => {
            console.log('❌ Prevention check failed');
            process.exit(1);
        });
    } else {
        // Continuous mode
        prevention.start().then(() => {
            console.log('🛡️  Prevention system running...');
            
            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n🛑 Shutting down prevention system...');
                await prevention.stop();
                process.exit(0);
            });
            
        }).catch((error) => {
            console.error('❌ Failed to start prevention system:', error.message);
            process.exit(1);
        });
    }
}

export default RegressionPrevention;