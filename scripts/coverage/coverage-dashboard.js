#!/usr/bin/env node

/**
 * Coverage Dashboard - Real-time coverage monitoring and trend visualization
 * Provides web-based dashboard for coverage analysis and trend tracking
 */

import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CoverageDashboard {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.coverageDir = path.join(this.projectRoot, 'coverage');
        this.reportsDir = path.join(this.projectRoot, 'test-results/coverage');
        this.port = process.env.COVERAGE_DASHBOARD_PORT || 3005;
        this.server = null;
    }

    async initialize() {
        try {
            await fs.mkdir(this.reportsDir, { recursive: true });
            console.log('📊 Coverage Dashboard initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Coverage Dashboard:', error);
            throw error;
        }
    }

    async loadCoverageData() {
        try {
            // Load current coverage
            const summaryPath = path.join(this.coverageDir, 'coverage-summary.json');
            const currentCoverage = JSON.parse(await fs.readFile(summaryPath, 'utf-8'));

            // Load coverage analysis
            const analysisPath = path.join(this.reportsDir, 'coverage-analysis.json');
            let analysis = null;
            try {
                analysis = JSON.parse(await fs.readFile(analysisPath, 'utf-8'));
            } catch (error) {
                console.warn('⚠️ Coverage analysis not found');
            }

            // Load quality gates results
            const gatesPath = path.join(this.reportsDir, '../quality-gates/quality-gates-results.json');
            let qualityGates = null;
            try {
                qualityGates = JSON.parse(await fs.readFile(gatesPath, 'utf-8'));
            } catch (error) {
                console.warn('⚠️ Quality gates results not found');
            }

            // Load trend data
            const trendPath = path.join(this.reportsDir, '../quality-gates/coverage-trend.json');
            let trends = null;
            try {
                trends = JSON.parse(await fs.readFile(trendPath, 'utf-8'));
            } catch (error) {
                console.warn('⚠️ Trend data not found');
            }

            return {
                current: currentCoverage,
                analysis,
                qualityGates,
                trends,
                lastUpdated: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Failed to load coverage data:', error);
            return null;
        }
    }

    generateDashboardHTML(data) {
        const current = data?.current?.total || {};
        const analysis = data?.analysis || {};
        const qualityGates = data?.qualityGates || {};
        const trends = data?.trends?.history || [];

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            line-height: 1.5;
        }
        
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 2rem;
            text-align: center;
            border-bottom: 1px solid #334155;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .header p {
            color: #94a3b8;
            font-size: 1.1rem;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .card h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #f1f5f9;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #334155;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            font-weight: 500;
            color: #cbd5e1;
        }
        
        .metric-value {
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .metric-value.high { color: #10b981; }
        .metric-value.medium { color: #f59e0b; }
        .metric-value.low { color: #ef4444; }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #374151;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        
        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
            border-radius: 4px;
        }
        
        .progress-fill.high { background: linear-gradient(90deg, #10b981, #34d399); }
        .progress-fill.medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .progress-fill.low { background: linear-gradient(90deg, #ef4444, #f87171); }
        
        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-badge.passed {
            background: #065f46;
            color: #34d399;
        }
        
        .status-badge.failed {
            background: #7f1d1d;
            color: #f87171;
        }
        
        .status-badge.warning {
            background: #78350f;
            color: #fbbf24;
        }
        
        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 1rem;
        }
        
        .recommendations {
            background: #1e293b;
            border-left: 4px solid #60a5fa;
            padding: 1rem;
            margin-top: 1rem;
        }
        
        .recommendations h4 {
            color: #60a5fa;
            margin-bottom: 0.5rem;
        }
        
        .recommendations ul {
            list-style: none;
            padding-left: 0;
        }
        
        .recommendations li {
            padding: 0.25rem 0;
            color: #cbd5e1;
        }
        
        .recommendations li::before {
            content: "→";
            color: #60a5fa;
            margin-right: 0.5rem;
        }
        
        .refresh-info {
            text-align: center;
            color: #64748b;
            margin-top: 2rem;
            font-size: 0.875rem;
        }
        
        .auto-refresh {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .large-grid {
            grid-template-columns: 2fr 1fr;
        }
        
        .full-width {
            grid-column: 1 / -1;
        }
        
        @media (max-width: 768px) {
            .large-grid {
                grid-template-columns: 1fr;
            }
            
            .container {
                padding: 1rem;
            }
            
            .header {
                padding: 1rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Coverage Dashboard</h1>
        <p>Real-time test coverage monitoring and analysis</p>
    </div>
    
    <div class="container">
        <!-- Overview Grid -->
        <div class="grid">
            <!-- Current Coverage -->
            <div class="card">
                <h3>📈 Current Coverage</h3>
                <div class="metric">
                    <span class="metric-label">Lines</span>
                    <span class="metric-value ${this.getCoverageClass(current.lines?.pct || 0)}">${(current.lines?.pct || 0).toFixed(1)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getCoverageClass(current.lines?.pct || 0)}" style="width: ${current.lines?.pct || 0}%"></div>
                </div>
                
                <div class="metric">
                    <span class="metric-label">Branches</span>
                    <span class="metric-value ${this.getCoverageClass(current.branches?.pct || 0)}">${(current.branches?.pct || 0).toFixed(1)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getCoverageClass(current.branches?.pct || 0)}" style="width: ${current.branches?.pct || 0}%"></div>
                </div>
                
                <div class="metric">
                    <span class="metric-label">Functions</span>
                    <span class="metric-value ${this.getCoverageClass(current.functions?.pct || 0)}">${(current.functions?.pct || 0).toFixed(1)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getCoverageClass(current.functions?.pct || 0)}" style="width: ${current.functions?.pct || 0}%"></div>
                </div>
                
                <div class="metric">
                    <span class="metric-label">Statements</span>
                    <span class="metric-value ${this.getCoverageClass(current.statements?.pct || 0)}">${(current.statements?.pct || 0).toFixed(1)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getCoverageClass(current.statements?.pct || 0)}" style="width: ${current.statements?.pct || 0}%"></div>
                </div>
            </div>
            
            <!-- Quality Gates -->
            <div class="card">
                <h3>🚪 Quality Gates</h3>
                <div class="metric">
                    <span class="metric-label">Overall Status</span>
                    <span class="status-badge ${qualityGates.overall?.passed ? 'passed' : 'failed'}">
                        ${qualityGates.overall?.passed ? 'PASSED' : 'FAILED'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Quality Score</span>
                    <span class="metric-value ${this.getScoreClass(qualityGates.overall?.score || 0)}">
                        ${qualityGates.overall?.score || 0}/100
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Gates Passed</span>
                    <span class="metric-value">${qualityGates.summary?.passed || 0}/${qualityGates.summary?.total || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Failed Gates</span>
                    <span class="metric-value ${(qualityGates.summary?.failed || 0) > 0 ? 'low' : 'high'}">
                        ${qualityGates.summary?.failed || 0}
                    </span>
                </div>
            </div>
            
            <!-- File Analysis -->
            <div class="card">
                <h3>📁 File Analysis</h3>
                <div class="metric">
                    <span class="metric-label">Total Files</span>
                    <span class="metric-value">${analysis.detailed?.fileCount || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uncovered Files</span>
                    <span class="metric-value ${(analysis.gaps?.uncoveredFiles?.length || 0) > 0 ? 'low' : 'high'}">
                        ${analysis.gaps?.uncoveredFiles?.length || 0}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Low Coverage Files</span>
                    <span class="metric-value ${(analysis.gaps?.lowCoverageFiles?.length || 0) > 0 ? 'medium' : 'high'}">
                        ${analysis.gaps?.lowCoverageFiles?.length || 0}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Missing Tests</span>
                    <span class="metric-value ${(analysis.gaps?.missingTests?.length || 0) > 0 ? 'medium' : 'high'}">
                        ${analysis.gaps?.missingTests?.length || 0}
                    </span>
                </div>
            </div>
            
            <!-- Risk Assessment -->
            <div class="card">
                <h3>⚠️ Risk Assessment</h3>
                <div class="metric">
                    <span class="metric-label">High Risks</span>
                    <span class="metric-value ${(analysis.detailed?.riskAssessment?.filter(r => r.level === 'HIGH')?.length || 0) > 0 ? 'low' : 'high'}">
                        ${analysis.detailed?.riskAssessment?.filter(r => r.level === 'HIGH')?.length || 0}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Critical Risks</span>
                    <span class="metric-value ${(analysis.detailed?.riskAssessment?.filter(r => r.level === 'CRITICAL')?.length || 0) > 0 ? 'low' : 'high'}">
                        ${analysis.detailed?.riskAssessment?.filter(r => r.level === 'CRITICAL')?.length || 0}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Recommendations</span>
                    <span class="metric-value">${analysis.recommendations?.length || 0}</span>
                </div>
            </div>
        </div>
        
        <!-- Trend Chart -->
        <div class="grid large-grid">
            <div class="card">
                <h3>📈 Coverage Trends</h3>
                <div class="chart-container">
                    <canvas id="trendChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3>💡 Recommendations</h3>
                ${this.generateRecommendationsHTML(analysis.recommendations || [])}
            </div>
        </div>
        
        <!-- Detailed Analysis -->
        <div class="grid full-width">
            <div class="card">
                <h3>🔍 Detailed Analysis</h3>
                <div class="grid">
                    <div>
                        <h4>By Directory</h4>
                        ${this.generateDirectoryAnalysisHTML(analysis.detailed?.byDirectory || {})}
                    </div>
                    <div>
                        <h4>By File Type</h4>
                        ${this.generateFileTypeAnalysisHTML(analysis.detailed?.byFileType || {})}
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="refresh-info auto-refresh">
        Last updated: ${data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Never'}
        <br>
        <small>Page refreshes automatically every 30 seconds</small>
    </div>
    
    <script>
        // Auto-refresh functionality
        setTimeout(() => {
            location.reload();
        }, 30000);
        
        // Trend Chart
        const ctx = document.getElementById('trendChart').getContext('2d');
        const trendData = ${JSON.stringify(trends.slice(-20))};
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.map(d => new Date(d.timestamp).toLocaleDateString()),
                datasets: [{
                    label: 'Quality Score',
                    data: trendData.map(d => d.score),
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: '#374151'
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: '#374151'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    }

    getCoverageClass(percentage) {
        if (percentage >= 95) return 'high';
        if (percentage >= 80) return 'medium';
        return 'low';
    }

    getScoreClass(score) {
        if (score >= 90) return 'high';
        if (score >= 70) return 'medium';
        return 'low';
    }

    generateRecommendationsHTML(recommendations) {
        if (!recommendations || recommendations.length === 0) {
            return '<p style="color: #10b981;">✅ No recommendations - coverage looks good!</p>';
        }

        return `<div class="recommendations">
            <ul>
                ${recommendations.slice(0, 5).map(rec => 
                    `<li><strong>${rec.priority}:</strong> ${rec.action}</li>`
                ).join('')}
            </ul>
        </div>`;
    }

    generateDirectoryAnalysisHTML(directories) {
        const dirEntries = Object.entries(directories).slice(0, 5);
        if (dirEntries.length === 0) {
            return '<p>No directory data available</p>';
        }

        return dirEntries.map(([dir, data]) => `
            <div class="metric">
                <span class="metric-label">${dir}</span>
                <span class="metric-value ${this.getCoverageClass(data.lines?.pct || 0)}">
                    ${(data.lines?.pct || 0).toFixed(1)}%
                </span>
            </div>
        `).join('');
    }

    generateFileTypeAnalysisHTML(fileTypes) {
        const typeEntries = Object.entries(fileTypes).slice(0, 5);
        if (typeEntries.length === 0) {
            return '<p>No file type data available</p>';
        }

        return typeEntries.map(([type, data]) => `
            <div class="metric">
                <span class="metric-label">${type}</span>
                <span class="metric-value ${this.getCoverageClass(data.lines?.pct || 0)}">
                    ${(data.lines?.pct || 0).toFixed(1)}%
                </span>
            </div>
        `).join('');
    }

    async startServer() {
        this.server = http.createServer(async (req, res) => {
            try {
                const data = await this.loadCoverageData();
                const html = this.generateDashboardHTML(data);
                
                res.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                });
                res.end(html);
            } catch (error) {
                console.error('❌ Error serving dashboard:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        });

        this.server.listen(this.port, () => {
            console.log(`🌐 Coverage Dashboard running at http://localhost:${this.port}`);
            console.log('📊 Dashboard features:');
            console.log('  • Real-time coverage metrics');
            console.log('  • Quality gates status');
            console.log('  • Coverage trends visualization');
            console.log('  • Risk assessment');
            console.log('  • Auto-refresh every 30 seconds');
        });
    }

    async stopServer() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Coverage Dashboard stopped');
        }
    }

    async run() {
        try {
            await this.initialize();
            await this.startServer();
            
            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\\n🛑 Shutting down Coverage Dashboard...');
                await this.stopServer();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('❌ Failed to start Coverage Dashboard:', error);
            process.exit(1);
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const dashboard = new CoverageDashboard();
    dashboard.run();
}

export default CoverageDashboard;