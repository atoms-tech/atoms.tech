#!/usr/bin/env node

/**
 * Coverage Quality Gates - Enforce coverage standards in CI/CD pipeline
 * Validates coverage thresholds, generates reports, and manages quality enforcement
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class QualityGates {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.coverageDir = path.join(this.projectRoot, 'coverage');
        this.reportsDir = path.join(this.projectRoot, 'test-results/quality-gates');
        
        // Quality gate definitions
        this.gates = {
            // Critical gates - must pass
            critical: {
                global_lines: { threshold: 100, metric: 'lines', scope: 'global' },
                global_branches: { threshold: 100, metric: 'branches', scope: 'global' },
                global_functions: { threshold: 100, metric: 'functions', scope: 'global' },
                global_statements: { threshold: 100, metric: 'statements', scope: 'global' },
            },
            
            // Component-specific gates
            components: {
                ui_components: { threshold: 100, path: 'src/components/ui/', metric: 'all' },
                hooks: { threshold: 100, path: 'src/hooks/', metric: 'all' },
                utils: { threshold: 100, path: 'src/lib/utils/', metric: 'all' },
                stores: { threshold: 100, path: 'src/store/', metric: 'all' },
            },
            
            // Trend gates - track improvement
            trends: {
                coverage_improvement: { threshold: 0, metric: 'trend', comparison: 'previous' },
                no_regression: { threshold: -2, metric: 'regression', comparison: 'baseline' },
            },
        };
        
        this.config = {
            enforceGates: process.env.CI === 'true' || process.env.ENFORCE_QUALITY_GATES === 'true',
            allowFailure: process.env.ALLOW_COVERAGE_FAILURE === 'true',
            generateReports: true,
            trackTrends: true,
            notifyOnFailure: process.env.NOTIFY_ON_FAILURE === 'true',
        };
    }

    async initialize() {
        try {
            await fs.mkdir(this.reportsDir, { recursive: true });
            console.log('🚪 Quality Gates initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Quality Gates:', error);
            throw error;
        }
    }

    async runCoverageTests() {
        return new Promise((resolve, reject) => {
            console.log('🧪 Running coverage tests...');
            
            const jest = spawn('npm', ['run', 'test:coverage'], {
                cwd: this.projectRoot,
                stdio: 'pipe',
            });

            let output = '';
            let errorOutput = '';

            jest.stdout.on('data', (data) => {
                output += data.toString();
                process.stdout.write(data);
            });

            jest.stderr.on('data', (data) => {
                errorOutput += data.toString();
                process.stderr.write(data);
            });

            jest.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Coverage tests completed successfully');
                    resolve({ output, errorOutput, exitCode: code });
                } else {
                    console.log(`⚠️ Coverage tests completed with exit code: ${code}`);
                    // Don't reject here - we want to analyze coverage even if tests fail
                    resolve({ output, errorOutput, exitCode: code });
                }
            });

            jest.on('error', (error) => {
                console.error('❌ Failed to run coverage tests:', error);
                reject(error);
            });
        });
    }

    async loadCoverageData() {
        try {
            const summaryPath = path.join(this.coverageDir, 'coverage-summary.json');
            const summaryData = await fs.readFile(summaryPath, 'utf-8');
            return JSON.parse(summaryData);
        } catch (error) {
            console.warn('⚠️ Coverage summary not found');
            return null;
        }
    }

    async evaluateGates(coverageData) {
        const results = {
            timestamp: new Date().toISOString(),
            overall: { passed: true, score: 0 },
            gates: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0,
            },
        };

        if (!coverageData) {
            results.overall.passed = false;
            results.error = 'No coverage data available';
            return results;
        }

        // Evaluate critical gates
        await this.evaluateCriticalGates(coverageData, results);
        
        // Evaluate component-specific gates
        await this.evaluateComponentGates(coverageData, results);
        
        // Evaluate trend gates
        await this.evaluateTrendGates(coverageData, results);
        
        // Calculate overall score
        this.calculateOverallScore(results);
        
        return results;
    }

    async evaluateCriticalGates(coverageData, results) {
        const total = coverageData.total || {};
        
        Object.entries(this.gates.critical).forEach(([gateId, gate]) => {
            const actual = total[gate.metric]?.pct || 0;
            const passed = actual >= gate.threshold;
            
            results.gates[gateId] = {
                type: 'critical',
                metric: gate.metric,
                scope: gate.scope,
                threshold: gate.threshold,
                actual: parseFloat(actual.toFixed(2)),
                passed,
                impact: passed ? 'none' : 'high',
                message: passed 
                    ? `✅ ${gate.metric} coverage meets threshold (${actual.toFixed(2)}% >= ${gate.threshold}%)`
                    : `❌ ${gate.metric} coverage below threshold (${actual.toFixed(2)}% < ${gate.threshold}%)`,
            };
            
            results.summary.total++;
            if (passed) {
                results.summary.passed++;
            } else {
                results.summary.failed++;
                results.overall.passed = false;
            }
        });
    }

    async evaluateComponentGates(coverageData, results) {
        for (const [gateId, gate] of Object.entries(this.gates.components)) {
            const componentCoverage = this.calculateComponentCoverage(coverageData, gate.path);
            const passed = this.checkComponentThreshold(componentCoverage, gate.threshold);
            
            results.gates[gateId] = {
                type: 'component',
                path: gate.path,
                threshold: gate.threshold,
                actual: componentCoverage,
                passed,
                impact: passed ? 'none' : 'medium',
                message: passed 
                    ? `✅ Component coverage meets threshold`
                    : `❌ Component coverage below threshold`,
            };
            
            results.summary.total++;
            if (passed) {
                results.summary.passed++;
            } else {
                results.summary.failed++;
                if (gate.threshold === 100) {
                    results.overall.passed = false;
                } else {
                    results.summary.warnings++;
                }
            }
        }
    }

    calculateComponentCoverage(coverageData, componentPath) {
        const relevantFiles = Object.entries(coverageData.files || {})
            .filter(([filePath]) => filePath.includes(componentPath));
        
        if (relevantFiles.length === 0) {
            return { lines: 0, branches: 0, functions: 0, statements: 0, fileCount: 0 };
        }

        const totals = {
            lines: { found: 0, hit: 0, pct: 0 },
            branches: { found: 0, hit: 0, pct: 0 },
            functions: { found: 0, hit: 0, pct: 0 },
            statements: { found: 0, hit: 0, pct: 0 },
            fileCount: relevantFiles.length,
        };

        relevantFiles.forEach(([, fileData]) => {
            ['lines', 'branches', 'functions', 'statements'].forEach(metric => {
                totals[metric].found += fileData[metric]?.found || 0;
                totals[metric].hit += fileData[metric]?.hit || 0;
            });
        });

        // Calculate percentages
        ['lines', 'branches', 'functions', 'statements'].forEach(metric => {
            totals[metric].pct = totals[metric].found > 0 
                ? (totals[metric].hit / totals[metric].found) * 100 
                : 100;
        });

        return totals;
    }

    checkComponentThreshold(componentCoverage, threshold) {
        return ['lines', 'branches', 'functions', 'statements'].every(metric => 
            componentCoverage[metric].pct >= threshold
        );
    }

    async evaluateTrendGates(coverageData, results) {
        try {
            const previousCoverage = await this.loadPreviousCoverage();
            
            if (previousCoverage) {
                const trendAnalysis = this.analyzeTrends(coverageData, previousCoverage);
                
                Object.entries(this.gates.trends).forEach(([gateId, gate]) => {
                    let passed = true;
                    let actual = 0;
                    
                    if (gate.metric === 'trend') {
                        actual = trendAnalysis.improvement;
                        passed = actual >= gate.threshold;
                    } else if (gate.metric === 'regression') {
                        actual = trendAnalysis.regression;
                        passed = actual >= gate.threshold; // negative threshold for max allowed regression
                    }
                    
                    results.gates[gateId] = {
                        type: 'trend',
                        metric: gate.metric,
                        threshold: gate.threshold,
                        actual: parseFloat(actual.toFixed(2)),
                        passed,
                        impact: passed ? 'none' : 'low',
                        message: passed 
                            ? `✅ Trend gate passed`
                            : `⚠️ Trend gate warning`,
                    };
                    
                    results.summary.total++;
                    if (passed) {
                        results.summary.passed++;
                    } else {
                        results.summary.warnings++;
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ Could not evaluate trend gates:', error.message);
        }
    }

    async loadPreviousCoverage() {
        try {
            const trendPath = path.join(this.reportsDir, 'coverage-trend.json');
            const trendData = await fs.readFile(trendPath, 'utf-8');
            const trends = JSON.parse(trendData);
            return trends.history?.[trends.history.length - 2]; // Previous entry
        } catch (error) {
            return null;
        }
    }

    analyzeTrends(current, previous) {
        const currentTotal = current.total || {};
        const previousTotal = previous.total || {};
        
        const improvement = (currentTotal.lines?.pct || 0) - (previousTotal.lines?.pct || 0);
        const regression = improvement < 0 ? improvement : 0;
        
        return {
            improvement,
            regression,
            current: currentTotal.lines?.pct || 0,
            previous: previousTotal.lines?.pct || 0,
        };
    }

    calculateOverallScore(results) {
        const weights = {
            critical: 0.6,
            component: 0.3,
            trend: 0.1,
        };
        
        let weightedScore = 0;
        let totalWeight = 0;
        
        Object.values(results.gates).forEach(gate => {
            const weight = weights[gate.type] || 0;
            const score = gate.passed ? 100 : 0;
            
            weightedScore += score * weight;
            totalWeight += weight;
        });
        
        results.overall.score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
    }

    async saveResults(results) {
        // Save current results
        const resultsPath = path.join(this.reportsDir, 'quality-gates-results.json');
        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        
        // Update trend tracking
        await this.updateTrendData(results);
        
        console.log(`💾 Quality gate results saved to: ${resultsPath}`);
    }

    async updateTrendData(results) {
        try {
            const trendPath = path.join(this.reportsDir, 'coverage-trend.json');
            let trendData = { history: [] };
            
            try {
                const existingData = await fs.readFile(trendPath, 'utf-8');
                trendData = JSON.parse(existingData);
            } catch (error) {
                // File doesn't exist, start fresh
            }
            
            // Add current results to history
            trendData.history.push({
                timestamp: results.timestamp,
                score: results.overall.score,
                passed: results.overall.passed,
                gates: Object.keys(results.gates).length,
                passedGates: results.summary.passed,
                failedGates: results.summary.failed,
            });
            
            // Keep only last 100 entries
            if (trendData.history.length > 100) {
                trendData.history = trendData.history.slice(-100);
            }
            
            await fs.writeFile(trendPath, JSON.stringify(trendData, null, 2));
        } catch (error) {
            console.warn('⚠️ Could not update trend data:', error.message);
        }
    }

    async generateReport(results) {
        const report = `# Coverage Quality Gates Report

## 🎯 Overall Status: ${results.overall.passed ? '✅ PASSED' : '❌ FAILED'}

**Quality Score**: ${results.overall.score}/100

## 📊 Gate Summary

- **Total Gates**: ${results.summary.total}
- **Passed**: ${results.summary.passed} ✅
- **Failed**: ${results.summary.failed} ❌  
- **Warnings**: ${results.summary.warnings} ⚠️

## 🚪 Gate Details

${Object.entries(results.gates).map(([gateId, gate]) => 
    `### ${gateId.replace(/_/g, ' ').toUpperCase()}
**Type**: ${gate.type}
**Threshold**: ${gate.threshold}%
**Actual**: ${gate.actual}%
**Status**: ${gate.passed ? '✅ PASSED' : '❌ FAILED'}
**Impact**: ${gate.impact}
**Message**: ${gate.message}
`).join('\\n')}

## 🔧 Recommendations

${results.overall.passed ? 
    '✅ All quality gates passed! No action required.' :
    `❌ Quality gates failed. Consider the following actions:

1. **Increase test coverage** for critical components
2. **Add missing test files** for uncovered modules  
3. **Improve branch coverage** with edge case testing
4. **Review and update** coverage thresholds if appropriate`}

---
*Generated on: ${new Date(results.timestamp).toLocaleString()}*
*Enforcement: ${this.config.enforceGates ? 'ENABLED' : 'DISABLED'}*
`;

        const reportPath = path.join(this.reportsDir, 'quality-gates-report.md');
        await fs.writeFile(reportPath, report);
        
        console.log(`📄 Quality gates report generated: ${reportPath}`);
        return reportPath;
    }

    async generateBadges(results) {
        const badges = {
            qualityGates: {
                schemaVersion: 1,
                label: 'quality gates',
                message: results.overall.passed ? 'passing' : 'failing',
                color: results.overall.passed ? 'brightgreen' : 'red',
            },
            qualityScore: {
                schemaVersion: 1,
                label: 'quality score',
                message: `${results.overall.score}/100`,
                color: this.getScoreColor(results.overall.score),
            },
        };
        
        const badgePath = path.join(this.reportsDir, 'quality-gates-badges.json');
        await fs.writeFile(badgePath, JSON.stringify(badges, null, 2));
        
        console.log(`🏷️ Quality gates badges generated: ${badgePath}`);
    }

    getScoreColor(score) {
        if (score >= 95) return 'brightgreen';
        if (score >= 85) return 'green';
        if (score >= 75) return 'yellowgreen';
        if (score >= 65) return 'yellow';
        if (score >= 50) return 'orange';
        return 'red';
    }

    async notifyResults(results) {
        if (!this.config.notifyOnFailure || results.overall.passed) {
            return;
        }

        // In a real implementation, this would send notifications
        console.log('🔔 Quality gate failure notification would be sent');
    }

    async run() {
        try {
            console.log('🚀 Running coverage quality gates...');
            
            await this.initialize();
            
            // Run coverage tests
            const testResults = await this.runCoverageTests();
            
            // Load coverage data
            const coverageData = await this.loadCoverageData();
            
            // Evaluate quality gates
            const gateResults = await this.evaluateGates(coverageData);
            
            // Save results and generate reports
            await this.saveResults(gateResults);
            await this.generateReport(gateResults);
            await this.generateBadges(gateResults);
            
            // Notify if needed
            await this.notifyResults(gateResults);
            
            // Display summary
            console.log('\\n🎯 Quality Gates Summary:');
            console.log(`Overall Status: ${gateResults.overall.passed ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`Quality Score: ${gateResults.overall.score}/100`);
            console.log(`Gates Passed: ${gateResults.summary.passed}/${gateResults.summary.total}`);
            
            if (gateResults.summary.failed > 0) {
                console.log(`Failed Gates: ${gateResults.summary.failed}`);
            }
            
            if (gateResults.summary.warnings > 0) {
                console.log(`Warnings: ${gateResults.summary.warnings}`);
            }
            
            // Exit with error if gates failed and enforcement is enabled
            if (!gateResults.overall.passed && this.config.enforceGates && !this.config.allowFailure) {
                console.log('\\n❌ Quality gates failed and enforcement is enabled!');
                process.exit(1);
            } else if (!gateResults.overall.passed) {
                console.log('\\n⚠️ Quality gates failed but enforcement is disabled');
            } else {
                console.log('\\n✅ All quality gates passed!');
            }
            
        } catch (error) {
            console.error('❌ Quality gates execution failed:', error);
            process.exit(1);
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const gates = new QualityGates();
    gates.run();
}

export default QualityGates;