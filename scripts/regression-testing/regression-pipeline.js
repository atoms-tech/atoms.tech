#!/usr/bin/env node

/**
 * Continuous Regression Testing Pipeline
 * 
 * Automated regression testing pipeline that runs continuously
 * and integrates with CI/CD systems
 * 
 * Features:
 * - Automated test scheduling
 * - Regression detection and alerting
 * - Performance monitoring
 * - Integration with Git hooks
 * - Slack/Teams notifications
 * - Automated rollback triggers
 * - Test result dashboards
 */

import { EventEmitter } from 'events';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import RegressionTestSuite from './regression-test-suite.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RegressionPipeline extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Pipeline configuration
            schedule: {
                enabled: true,
                interval: 60000, // 1 minute
                onCommit: true,
                onPush: true,
                onPR: true,
                onSchedule: true
            },
            
            // Test execution settings
            execution: {
                parallel: true,
                maxConcurrency: 4,
                timeout: 600000, // 10 minutes
                retries: 2,
                failFast: false
            },
            
            // Notification settings
            notifications: {
                enabled: true,
                channels: {
                    slack: { enabled: false, webhook: '' },
                    teams: { enabled: false, webhook: '' },
                    email: { enabled: false, recipients: [] },
                    console: { enabled: true }
                },
                onRegression: true,
                onFailure: true,
                onSuccess: false,
                onRecovery: true
            },
            
            // Rollback settings
            rollback: {
                enabled: false,
                automatic: false,
                thresholds: {
                    regressionCount: 5,
                    failureRate: 0.5,
                    performanceDegradation: 0.3
                }
            },
            
            // Storage settings
            storage: {
                results: 'test-results/regression/pipeline',
                artifacts: 'test-results/regression/artifacts',
                logs: 'test-results/regression/logs',
                reports: 'test-results/regression/reports'
            },
            
            ...options
        };
        
        this.pipeline = {
            running: false,
            currentExecution: null,
            executionCount: 0,
            lastExecution: null,
            nextExecution: null,
            statistics: {
                executions: 0,
                successes: 0,
                failures: 0,
                regressions: 0,
                averageTime: 0,
                uptime: 0
            }
        };
        
        this.testSuite = new RegressionTestSuite();
        this.startTime = Date.now();
        this.executionHistory = [];
        this.activeExecutions = new Map();
    }
    
    /**
     * Start the regression testing pipeline
     */
    async start() {
        console.log('🚀 Starting Continuous Regression Testing Pipeline...\n');
        
        try {
            await this.initialize();
            await this.setupScheduling();
            await this.setupGitHooks();
            await this.setupNotifications();
            
            this.pipeline.running = true;
            this.emit('pipeline:started');
            
            console.log('✅ Pipeline started successfully');
            console.log(`📊 Monitoring for changes every ${this.config.schedule.interval}ms`);
            
            // Start monitoring
            this.startMonitoring();
            
        } catch (error) {
            console.error(`❌ Failed to start pipeline: ${error.message}`);
            this.emit('pipeline:error', error);
            throw error;
        }
    }
    
    /**
     * Stop the regression testing pipeline
     */
    async stop() {
        console.log('🛑 Stopping Regression Testing Pipeline...');
        
        this.pipeline.running = false;
        
        // Stop all active executions
        for (const [id, execution] of this.activeExecutions) {
            await this.stopExecution(id);
        }
        
        // Clear scheduled intervals
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        this.emit('pipeline:stopped');
        console.log('✅ Pipeline stopped successfully');
    }
    
    /**
     * Initialize pipeline components
     */
    async initialize() {
        console.log('🔧 Initializing pipeline components...');
        
        // Create directories
        for (const dir of Object.values(this.config.storage)) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
        
        // Initialize test suite
        await this.testSuite.initializeTestEnvironment();
        
        // Load pipeline history
        await this.loadPipelineHistory();
        
        console.log('✅ Pipeline components initialized');
    }
    
    /**
     * Setup test scheduling
     */
    async setupScheduling() {
        console.log('⏰ Setting up test scheduling...');
        
        if (!this.config.schedule.enabled) {
            console.log('⚠️  Scheduling disabled');
            return;
        }
        
        // Schedule regular executions
        if (this.config.schedule.onSchedule) {
            this.scheduleRegularExecution();
        }
        
        console.log('✅ Test scheduling configured');
    }
    
    /**
     * Setup Git hooks for automatic testing
     */
    async setupGitHooks() {
        console.log('🔗 Setting up Git hooks...');
        
        const hooksDir = '.git/hooks';
        
        if (!fs.existsSync(hooksDir)) {
            console.log('⚠️  Git hooks directory not found');
            return;
        }
        
        // Setup pre-commit hook
        if (this.config.schedule.onCommit) {
            await this.setupPreCommitHook();
        }
        
        // Setup pre-push hook
        if (this.config.schedule.onPush) {
            await this.setupPrePushHook();
        }
        
        console.log('✅ Git hooks configured');
    }
    
    /**
     * Setup notification channels
     */
    async setupNotifications() {
        console.log('📢 Setting up notification channels...');
        
        if (!this.config.notifications.enabled) {
            console.log('⚠️  Notifications disabled');
            return;
        }
        
        // Test notification channels
        const channels = this.config.notifications.channels;
        
        if (channels.slack.enabled) {
            await this.testSlackNotification();
        }
        
        if (channels.teams.enabled) {
            await this.testTeamsNotification();
        }
        
        if (channels.email.enabled) {
            await this.testEmailNotification();
        }
        
        console.log('✅ Notification channels configured');
    }
    
    /**
     * Start monitoring for changes
     */
    startMonitoring() {
        console.log('👁️  Starting change monitoring...');
        
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.checkForChanges();
            } catch (error) {
                console.error(`❌ Monitoring error: ${error.message}`);
                this.emit('monitoring:error', error);
            }
        }, this.config.schedule.interval);
        
        this.emit('monitoring:started');
    }
    
    /**
     * Check for changes that trigger testing
     */
    async checkForChanges() {
        if (!this.pipeline.running) return;
        
        // Check for Git changes
        const hasGitChanges = await this.hasGitChanges();
        
        // Check for scheduled execution
        const isScheduledTime = await this.isScheduledTime();
        
        // Check for manual triggers
        const hasManualTrigger = await this.hasManualTrigger();
        
        if (hasGitChanges || isScheduledTime || hasManualTrigger) {
            await this.executeTests({
                trigger: hasGitChanges ? 'git' : isScheduledTime ? 'schedule' : 'manual',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Execute regression tests
     */
    async executeTests(context = {}) {
        if (!this.pipeline.running) return;
        
        const executionId = this.generateExecutionId();
        const execution = {
            id: executionId,
            context,
            startTime: Date.now(),
            status: 'running',
            results: null,
            logs: []
        };
        
        this.activeExecutions.set(executionId, execution);
        this.pipeline.currentExecution = execution;
        this.pipeline.executionCount++;
        
        console.log(`🧪 Starting regression test execution ${executionId}`);
        console.log(`📋 Trigger: ${context.trigger || 'unknown'}`);
        
        this.emit('execution:started', execution);
        
        try {
            // Execute test suite
            const results = await this.testSuite.execute({
                executionId,
                context,
                timeout: this.config.execution.timeout
            });
            
            execution.results = results;
            execution.status = results.status;
            execution.endTime = Date.now();
            execution.duration = execution.endTime - execution.startTime;
            
            // Update statistics
            this.updateStatistics(execution);
            
            // Process results
            await this.processResults(execution);
            
            // Send notifications
            await this.sendNotifications(execution);
            
            // Handle rollback if needed
            await this.handleRollback(execution);
            
            console.log(`✅ Execution ${executionId} completed in ${execution.duration}ms`);
            this.emit('execution:completed', execution);
            
        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
            execution.endTime = Date.now();
            execution.duration = execution.endTime - execution.startTime;
            
            console.error(`❌ Execution ${executionId} failed: ${error.message}`);
            this.emit('execution:failed', execution);
            
            // Send failure notification
            await this.sendFailureNotification(execution);
            
        } finally {
            this.activeExecutions.delete(executionId);
            this.pipeline.currentExecution = null;
            this.pipeline.lastExecution = execution;
            this.executionHistory.push(execution);
            
            // Save execution history
            await this.saveExecutionHistory(execution);
        }
    }
    
    /**
     * Process test results
     */
    async processResults(execution) {
        const results = execution.results;
        
        // Generate execution report
        await this.generateExecutionReport(execution);
        
        // Update dashboard
        await this.updateDashboard(execution);
        
        // Archive artifacts
        await this.archiveArtifacts(execution);
        
        // Update baseline if needed
        if (results.status === 'passed' && results.summary.regressions === 0) {
            await this.updateBaseline(execution);
        }
    }
    
    /**
     * Send appropriate notifications
     */
    async sendNotifications(execution) {
        const results = execution.results;
        const config = this.config.notifications;
        
        if (!config.enabled) return;
        
        const shouldNotify = (
            (results.status === 'regression' && config.onRegression) ||
            (results.status === 'failed' && config.onFailure) ||
            (results.status === 'passed' && config.onSuccess) ||
            (this.isRecovery(execution) && config.onRecovery)
        );
        
        if (shouldNotify) {
            const message = this.createNotificationMessage(execution);
            
            if (config.channels.console.enabled) {
                console.log(`📢 ${message.title}: ${message.summary}`);
            }
            
            if (config.channels.slack.enabled) {
                await this.sendSlackNotification(message);
            }
            
            if (config.channels.teams.enabled) {
                await this.sendTeamsNotification(message);
            }
            
            if (config.channels.email.enabled) {
                await this.sendEmailNotification(message);
            }
        }
    }
    
    /**
     * Handle automatic rollback if configured
     */
    async handleRollback(execution) {
        const config = this.config.rollback;
        
        if (!config.enabled || !config.automatic) return;
        
        const results = execution.results;
        const thresholds = config.thresholds;
        
        const shouldRollback = (
            results.summary.regressions >= thresholds.regressionCount ||
            (results.summary.failed / results.summary.total) >= thresholds.failureRate
        );
        
        if (shouldRollback) {
            console.log('🔄 Automatic rollback triggered');
            await this.performRollback(execution);
            this.emit('rollback:triggered', execution);
        }
    }
    
    /**
     * Generate execution report
     */
    async generateExecutionReport(execution) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(
            this.config.storage.reports,
            `execution-${execution.id}-${timestamp}.json`
        );
        
        const report = {
            execution: {
                id: execution.id,
                context: execution.context,
                duration: execution.duration,
                status: execution.status,
                timestamp: execution.startTime
            },
            results: execution.results,
            pipeline: {
                uptime: Date.now() - this.startTime,
                totalExecutions: this.pipeline.executionCount,
                statistics: this.pipeline.statistics
            }
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Execution report saved: ${reportPath}`);
    }
    
    /**
     * Update dashboard with latest results
     */
    async updateDashboard(execution) {
        const dashboardPath = path.join(this.config.storage.reports, 'dashboard.json');
        
        const dashboard = {
            lastUpdate: new Date().toISOString(),
            pipeline: {
                status: this.pipeline.running ? 'running' : 'stopped',
                uptime: Date.now() - this.startTime,
                executionCount: this.pipeline.executionCount,
                statistics: this.pipeline.statistics
            },
            lastExecution: {
                id: execution.id,
                status: execution.status,
                duration: execution.duration,
                regressions: execution.results?.summary?.regressions || 0,
                passRate: execution.results?.summary?.passRate || 0,
                timestamp: execution.startTime
            },
            recentExecutions: this.executionHistory.slice(-10).map(e => ({
                id: e.id,
                status: e.status,
                duration: e.duration,
                regressions: e.results?.summary?.regressions || 0,
                timestamp: e.startTime
            }))
        };
        
        fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
    }
    
    /**
     * Archive test artifacts
     */
    async archiveArtifacts(execution) {
        const artifactsDir = path.join(this.config.storage.artifacts, execution.id);
        
        if (!fs.existsSync(artifactsDir)) {
            fs.mkdirSync(artifactsDir, { recursive: true });
        }
        
        // Archive test reports
        const testResultsDir = 'test-results';
        if (fs.existsSync(testResultsDir)) {
            execSync(`cp -r ${testResultsDir}/* ${artifactsDir}/`, { stdio: 'ignore' });
        }
        
        // Archive screenshots
        const screenshotsDir = 'test-results/screenshots';
        if (fs.existsSync(screenshotsDir)) {
            execSync(`cp -r ${screenshotsDir} ${artifactsDir}/`, { stdio: 'ignore' });
        }
        
        console.log(`📦 Artifacts archived: ${artifactsDir}`);
    }
    
    /**
     * Update baseline if tests pass
     */
    async updateBaseline(execution) {
        console.log('📊 Updating baseline with successful test results...');
        
        const baselinePath = path.join(this.config.storage.results, 'baseline.json');
        const newBaseline = {
            timestamp: new Date().toISOString(),
            executionId: execution.id,
            commit: await this.getCurrentCommit(),
            results: execution.results,
            statistics: this.pipeline.statistics
        };
        
        fs.writeFileSync(baselinePath, JSON.stringify(newBaseline, null, 2));
        console.log('✅ Baseline updated successfully');
    }
    
    // Helper methods
    generateExecutionId() {
        return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    updateStatistics(execution) {
        const stats = this.pipeline.statistics;
        
        stats.executions++;
        
        if (execution.status === 'passed') {
            stats.successes++;
        } else if (execution.status === 'failed') {
            stats.failures++;
        } else if (execution.status === 'regression') {
            stats.regressions++;
        }
        
        // Update average time
        stats.averageTime = (stats.averageTime * (stats.executions - 1) + execution.duration) / stats.executions;
        
        // Update uptime
        stats.uptime = Date.now() - this.startTime;
    }
    
    isRecovery(execution) {
        return (
            execution.status === 'passed' &&
            this.pipeline.lastExecution &&
            this.pipeline.lastExecution.status !== 'passed'
        );
    }
    
    createNotificationMessage(execution) {
        const results = execution.results;
        const status = execution.status;
        
        return {
            title: `Regression Test ${status.toUpperCase()}`,
            summary: `${results.summary.total} tests, ${results.summary.regressions} regressions`,
            details: {
                executionId: execution.id,
                duration: execution.duration,
                trigger: execution.context.trigger,
                passRate: results.summary.passRate,
                regressions: results.summary.regressions,
                timestamp: new Date(execution.startTime).toLocaleString()
            },
            color: status === 'passed' ? 'good' : status === 'regression' ? 'warning' : 'danger'
        };
    }
    
    async hasGitChanges() {
        try {
            const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
            return output.trim().length > 0;
        } catch (error) {
            return false;
        }
    }
    
    async isScheduledTime() {
        // Simple time-based scheduling - can be enhanced with cron-like patterns
        const now = Date.now();
        const lastExecution = this.pipeline.lastExecution?.startTime || 0;
        return (now - lastExecution) >= this.config.schedule.interval;
    }
    
    async hasManualTrigger() {
        // Check for manual trigger file
        const triggerFile = path.join(this.config.storage.results, 'manual-trigger');
        if (fs.existsSync(triggerFile)) {
            fs.unlinkSync(triggerFile);
            return true;
        }
        return false;
    }
    
    async getCurrentCommit() {
        try {
            return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        } catch (error) {
            return 'unknown';
        }
    }
    
    async stopExecution(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (execution) {
            execution.status = 'stopped';
            execution.endTime = Date.now();
            execution.duration = execution.endTime - execution.startTime;
            console.log(`🛑 Stopped execution ${executionId}`);
        }
    }
    
    async loadPipelineHistory() {
        // Load previous pipeline history
        const historyPath = path.join(this.config.storage.results, 'pipeline-history.json');
        if (fs.existsSync(historyPath)) {
            const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            this.pipeline.statistics = history.statistics || this.pipeline.statistics;
            this.executionHistory = history.executions || [];
        }
    }
    
    async saveExecutionHistory(execution) {
        const historyPath = path.join(this.config.storage.results, 'pipeline-history.json');
        const history = {
            statistics: this.pipeline.statistics,
            executions: this.executionHistory.slice(-100), // Keep last 100 executions
            lastUpdate: new Date().toISOString()
        };
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    }
    
    scheduleRegularExecution() {
        setInterval(async () => {
            if (this.pipeline.running) {
                await this.executeTests({ trigger: 'schedule' });
            }
        }, this.config.schedule.interval);
    }
    
    async setupPreCommitHook() {
        const hookPath = '.git/hooks/pre-commit';
        const hookContent = `#!/bin/sh
# Regression test pre-commit hook
node scripts/regression-testing/regression-pipeline.js --trigger=commit
`;
        fs.writeFileSync(hookPath, hookContent);
        fs.chmodSync(hookPath, '755');
    }
    
    async setupPrePushHook() {
        const hookPath = '.git/hooks/pre-push';
        const hookContent = `#!/bin/sh
# Regression test pre-push hook
node scripts/regression-testing/regression-pipeline.js --trigger=push
`;
        fs.writeFileSync(hookPath, hookContent);
        fs.chmodSync(hookPath, '755');
    }
    
    async testSlackNotification() {
        // Test Slack notification
        console.log('📱 Testing Slack notification...');
    }
    
    async testTeamsNotification() {
        // Test Teams notification
        console.log('👥 Testing Teams notification...');
    }
    
    async testEmailNotification() {
        // Test email notification
        console.log('📧 Testing email notification...');
    }
    
    async sendSlackNotification(message) {
        // Send Slack notification
        console.log(`📱 Slack: ${message.title}`);
    }
    
    async sendTeamsNotification(message) {
        // Send Teams notification
        console.log(`👥 Teams: ${message.title}`);
    }
    
    async sendEmailNotification(message) {
        // Send email notification
        console.log(`📧 Email: ${message.title}`);
    }
    
    async sendFailureNotification(execution) {
        console.log(`❌ Pipeline execution failed: ${execution.id}`);
    }
    
    async performRollback(execution) {
        console.log('🔄 Performing automatic rollback...');
        // Implement rollback logic here
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const pipeline = new RegressionPipeline();
    
    // Handle CLI arguments
    const args = process.argv.slice(2);
    const trigger = args.find(arg => arg.startsWith('--trigger='))?.split('=')[1];
    
    if (trigger) {
        // Single execution mode
        pipeline.executeTests({ trigger }).then(() => {
            process.exit(0);
        }).catch(() => {
            process.exit(1);
        });
    } else {
        // Continuous mode
        pipeline.start().then(() => {
            console.log('🚀 Pipeline running in continuous mode...');
            
            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n🛑 Shutting down pipeline...');
                await pipeline.stop();
                process.exit(0);
            });
            
            process.on('SIGTERM', async () => {
                console.log('\n🛑 Shutting down pipeline...');
                await pipeline.stop();
                process.exit(0);
            });
            
        }).catch((error) => {
            console.error('❌ Failed to start pipeline:', error.message);
            process.exit(1);
        });
    }
}

export default RegressionPipeline;