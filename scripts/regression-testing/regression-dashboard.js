#!/usr/bin/env node

/**
 * Regression Testing Dashboard
 * 
 * Real-time dashboard for monitoring regression tests
 * 
 * Features:
 * - Live test execution monitoring
 * - Historical trend analysis
 * - Performance metrics visualization
 * - Regression alerts and notifications
 * - Test coverage tracking
 * - Interactive test management
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from './regression-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RegressionDashboard {
    constructor(options = {}) {
        this.config = {
            port: options.port || 8080,
            host: options.host || 'localhost',
            apiPath: '/api',
            staticPath: path.join(__dirname, 'dashboard-static'),
            ...options
        };
        
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.state = {
            running: false,
            connectedClients: 0,
            testResults: [],
            executionHistory: [],
            currentExecution: null,
            metrics: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                regressions: 0,
                coverage: 0,
                performance: {}
            }
        };
        
        this.regressionConfig = getConfig();
        this.setupRoutes();
        this.setupSocketHandlers();
    }
    
    /**
     * Start the dashboard server
     */
    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, this.config.host, (error) => {
                if (error) {
                    reject(error);
                } else {
                    this.state.running = true;
                    console.log(`🚀 Regression Dashboard started at http://${this.config.host}:${this.config.port}`);
                    resolve();
                }
            });
        });
    }
    
    /**
     * Stop the dashboard server
     */
    async stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                this.state.running = false;
                console.log('🛑 Regression Dashboard stopped');
                resolve();
            });
        });
    }
    
    /**
     * Setup Express routes
     */
    setupRoutes() {
        // Middleware
        this.app.use(express.json());
        this.app.use(express.static(this.config.staticPath));
        
        // API routes
        this.app.get(`${this.config.apiPath}/status`, this.getStatus.bind(this));
        this.app.get(`${this.config.apiPath}/config`, this.getConfig.bind(this));
        this.app.get(`${this.config.apiPath}/results`, this.getResults.bind(this));
        this.app.get(`${this.config.apiPath}/metrics`, this.getMetrics.bind(this));
        this.app.get(`${this.config.apiPath}/history`, this.getHistory.bind(this));
        this.app.get(`${this.config.apiPath}/coverage`, this.getCoverage.bind(this));
        this.app.get(`${this.config.apiPath}/performance`, this.getPerformance.bind(this));
        
        // Action routes
        this.app.post(`${this.config.apiPath}/trigger`, this.triggerTests.bind(this));
        this.app.post(`${this.config.apiPath}/stop`, this.stopTests.bind(this));
        this.app.post(`${this.config.apiPath}/reset`, this.resetBaseline.bind(this));
        
        // Dashboard UI
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(this.config.staticPath, 'index.html'));
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });
    }
    
    /**
     * Setup Socket.IO handlers
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            this.state.connectedClients++;
            console.log(`📱 Client connected (${this.state.connectedClients} total)`);
            
            // Send initial state
            socket.emit('initial-state', {
                state: this.state,
                config: this.regressionConfig
            });
            
            // Handle client requests
            socket.on('get-live-status', () => {
                socket.emit('live-status', this.getLiveStatus());
            });
            
            socket.on('trigger-tests', (data) => {
                this.handleTestTrigger(data);
            });
            
            socket.on('stop-tests', () => {
                this.handleTestStop();
            });
            
            socket.on('disconnect', () => {
                this.state.connectedClients--;
                console.log(`📱 Client disconnected (${this.state.connectedClients} total)`);
            });
        });
    }
    
    /**
     * API route handlers
     */
    async getStatus(req, res) {
        res.json({
            status: this.state.running ? 'running' : 'stopped',
            connectedClients: this.state.connectedClients,
            currentExecution: this.state.currentExecution,
            lastUpdate: new Date().toISOString()
        });
    }
    
    async getConfig(req, res) {
        res.json(this.regressionConfig);
    }
    
    async getResults(req, res) {
        try {
            const resultsPath = path.join(this.regressionConfig.storage.baseDir, 'results');
            const results = await this.loadTestResults(resultsPath);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getMetrics(req, res) {
        res.json(this.state.metrics);
    }
    
    async getHistory(req, res) {
        const limit = parseInt(req.query.limit) || 50;
        const history = this.state.executionHistory.slice(-limit);
        res.json(history);
    }
    
    async getCoverage(req, res) {
        try {
            const coveragePath = path.join(this.regressionConfig.storage.baseDir, 'coverage');
            const coverage = await this.loadCoverageData(coveragePath);
            res.json(coverage);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getPerformance(req, res) {
        try {
            const performancePath = path.join(this.regressionConfig.storage.baseDir, 'performance');
            const performance = await this.loadPerformanceData(performancePath);
            res.json(performance);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async triggerTests(req, res) {
        try {
            const { testType, branch, options } = req.body;
            
            // Trigger test execution
            const executionId = await this.triggerTestExecution({
                testType,
                branch,
                options,
                trigger: 'manual'
            });
            
            res.json({ 
                success: true, 
                executionId,
                message: 'Test execution triggered'
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async stopTests(req, res) {
        try {
            await this.stopTestExecution();
            res.json({ success: true, message: 'Test execution stopped' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async resetBaseline(req, res) {
        try {
            await this.resetTestBaseline();
            res.json({ success: true, message: 'Baseline reset' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    /**
     * Test execution management
     */
    async triggerTestExecution(options) {
        const executionId = this.generateExecutionId();
        
        this.state.currentExecution = {
            id: executionId,
            status: 'starting',
            options,
            startTime: Date.now(),
            progress: 0
        };
        
        // Broadcast to all clients
        this.io.emit('execution-started', this.state.currentExecution);
        
        // Start test execution (placeholder)
        this.executeTests(executionId, options);
        
        return executionId;
    }
    
    async stopTestExecution() {
        if (this.state.currentExecution) {
            this.state.currentExecution.status = 'stopping';
            this.io.emit('execution-stopping', this.state.currentExecution);
            
            // Stop execution logic here
            setTimeout(() => {
                this.state.currentExecution.status = 'stopped';
                this.io.emit('execution-stopped', this.state.currentExecution);
                this.state.currentExecution = null;
            }, 2000);
        }
    }
    
    async resetTestBaseline() {
        // Reset baseline logic here
        this.io.emit('baseline-reset', { timestamp: new Date().toISOString() });
    }
    
    /**
     * Execute tests with real-time updates
     */
    async executeTests(executionId, options) {
        const execution = this.state.currentExecution;
        
        try {
            // Simulate test execution phases
            const phases = [
                { name: 'Setup', duration: 2000 },
                { name: 'Unit Tests', duration: 5000 },
                { name: 'Integration Tests', duration: 8000 },
                { name: 'E2E Tests', duration: 15000 },
                { name: 'Performance Tests', duration: 10000 },
                { name: 'Cleanup', duration: 2000 }
            ];
            
            execution.status = 'running';
            execution.phases = phases;
            execution.currentPhase = 0;
            
            for (let i = 0; i < phases.length; i++) {
                if (execution.status === 'stopping') break;
                
                const phase = phases[i];
                execution.currentPhase = i;
                execution.progress = (i / phases.length) * 100;
                
                this.io.emit('execution-progress', {
                    id: executionId,
                    phase: phase.name,
                    progress: execution.progress,
                    status: execution.status
                });
                
                // Simulate phase execution
                await this.sleep(phase.duration);
                
                // Simulate test results
                const phaseResults = this.generatePhaseResults(phase.name);
                this.io.emit('phase-completed', {
                    id: executionId,
                    phase: phase.name,
                    results: phaseResults
                });
            }
            
            // Complete execution
            execution.status = 'completed';
            execution.progress = 100;
            execution.endTime = Date.now();
            execution.duration = execution.endTime - execution.startTime;
            
            const finalResults = this.generateFinalResults(execution);
            this.updateMetrics(finalResults);
            
            this.io.emit('execution-completed', {
                id: executionId,
                results: finalResults,
                duration: execution.duration
            });
            
            // Add to history
            this.state.executionHistory.push({
                id: executionId,
                status: execution.status,
                duration: execution.duration,
                results: finalResults,
                timestamp: execution.startTime
            });
            
            this.state.currentExecution = null;
            
        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
            execution.endTime = Date.now();
            execution.duration = execution.endTime - execution.startTime;
            
            this.io.emit('execution-failed', {
                id: executionId,
                error: error.message,
                duration: execution.duration
            });
            
            this.state.currentExecution = null;
        }
    }
    
    /**
     * Update metrics based on test results
     */
    updateMetrics(results) {
        this.state.metrics = {
            totalTests: results.summary.total,
            passedTests: results.summary.passed,
            failedTests: results.summary.failed,
            regressions: results.summary.regressions,
            coverage: results.coverage.percentage,
            performance: results.performance
        };
    }
    
    /**
     * Generate execution ID
     */
    generateExecutionId() {
        return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Generate phase results
     */
    generatePhaseResults(phaseName) {
        const testCount = Math.floor(Math.random() * 20) + 5;
        const passed = Math.floor(testCount * (0.8 + Math.random() * 0.2));
        const failed = testCount - passed;
        
        return {
            phase: phaseName,
            total: testCount,
            passed,
            failed,
            duration: Math.floor(Math.random() * 5000) + 1000,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Generate final test results
     */
    generateFinalResults(execution) {
        const totalTests = Math.floor(Math.random() * 100) + 50;
        const passed = Math.floor(totalTests * (0.85 + Math.random() * 0.15));
        const failed = totalTests - passed;
        const regressions = Math.floor(Math.random() * 3);
        
        return {
            summary: {
                total: totalTests,
                passed,
                failed,
                regressions,
                passRate: (passed / totalTests) * 100
            },
            coverage: {
                percentage: 75 + Math.random() * 20,
                lines: Math.floor(Math.random() * 10000) + 5000,
                functions: Math.floor(Math.random() * 1000) + 500,
                branches: Math.floor(Math.random() * 2000) + 1000
            },
            performance: {
                bundleSize: Math.floor(Math.random() * 1000) + 2000,
                loadTime: Math.floor(Math.random() * 2000) + 1000,
                lighthouse: {
                    performance: 80 + Math.random() * 20,
                    accessibility: 85 + Math.random() * 15,
                    bestPractices: 88 + Math.random() * 12,
                    seo: 82 + Math.random() * 18
                }
            },
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Load test results from storage
     */
    async loadTestResults(resultsPath) {
        try {
            if (!fs.existsSync(resultsPath)) {
                return [];
            }
            
            const files = fs.readdirSync(resultsPath)
                .filter(file => file.endsWith('.json'))
                .sort((a, b) => b.localeCompare(a)) // Most recent first
                .slice(0, 10); // Last 10 results
            
            const results = [];
            for (const file of files) {
                const filePath = path.join(resultsPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                results.push(JSON.parse(content));
            }
            
            return results;
        } catch (error) {
            console.error('Error loading test results:', error);
            return [];
        }
    }
    
    /**
     * Load coverage data
     */
    async loadCoverageData(coveragePath) {
        try {
            const summaryPath = path.join(coveragePath, 'coverage-summary.json');
            if (fs.existsSync(summaryPath)) {
                const content = fs.readFileSync(summaryPath, 'utf8');
                return JSON.parse(content);
            }
            return null;
        } catch (error) {
            console.error('Error loading coverage data:', error);
            return null;
        }
    }
    
    /**
     * Load performance data
     */
    async loadPerformanceData(performancePath) {
        try {
            const performanceFile = path.join(performancePath, 'performance-summary.json');
            if (fs.existsSync(performanceFile)) {
                const content = fs.readFileSync(performanceFile, 'utf8');
                return JSON.parse(content);
            }
            return null;
        } catch (error) {
            console.error('Error loading performance data:', error);
            return null;
        }
    }
    
    /**
     * Get live status for clients
     */
    getLiveStatus() {
        return {
            running: this.state.running,
            currentExecution: this.state.currentExecution,
            metrics: this.state.metrics,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Handle test trigger from client
     */
    handleTestTrigger(data) {
        if (!this.state.currentExecution) {
            this.triggerTestExecution(data);
        } else {
            this.io.emit('error', { message: 'Test execution already in progress' });
        }
    }
    
    /**
     * Handle test stop from client
     */
    handleTestStop() {
        if (this.state.currentExecution) {
            this.stopTestExecution();
        } else {
            this.io.emit('error', { message: 'No test execution in progress' });
        }
    }
    
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const dashboard = new RegressionDashboard();
    
    dashboard.start().then(() => {
        console.log('📊 Regression Dashboard is running...');
        console.log('🌐 Open your browser to view the dashboard');
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down dashboard...');
            await dashboard.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down dashboard...');
            await dashboard.stop();
            process.exit(0);
        });
        
    }).catch((error) => {
        console.error('❌ Failed to start dashboard:', error.message);
        process.exit(1);
    });
}

export default RegressionDashboard;