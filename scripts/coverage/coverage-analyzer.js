#!/usr/bin/env node

/**
 * Coverage Analyzer - Comprehensive coverage analysis and reporting
 * Generates detailed coverage reports, identifies gaps, and enforces quality gates
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CoverageAnalyzer {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.coverageDir = path.join(this.projectRoot, 'coverage');
        this.reportsDir = path.join(this.projectRoot, 'test-results/coverage');
        this.qualityGates = {
            global: { branches: 100, functions: 100, lines: 100, statements: 100 },
            critical: { branches: 100, functions: 100, lines: 100, statements: 100 },
            important: { branches: 95, functions: 95, lines: 95, statements: 95 },
            standard: { branches: 90, functions: 90, lines: 90, statements: 90 },
        };
    }

    async initialize() {
        try {
            await fs.mkdir(this.reportsDir, { recursive: true });
            console.log('🔍 Coverage Analyzer initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Coverage Analyzer:', error);
            throw error;
        }
    }

    async analyzeCoverage() {
        try {
            const coverageSummary = await this.loadCoverageSummary();
            const detailedAnalysis = await this.generateDetailedAnalysis(coverageSummary);
            const gapAnalysis = await this.identifyCoverageGaps(coverageSummary);
            const qualityGateResults = await this.evaluateQualityGates(coverageSummary);
            
            const analysis = {
                timestamp: new Date().toISOString(),
                summary: coverageSummary,
                detailed: detailedAnalysis,
                gaps: gapAnalysis,
                qualityGates: qualityGateResults,
                recommendations: this.generateRecommendations(gapAnalysis, qualityGateResults),
            };

            await this.saveAnalysis(analysis);
            await this.generateReports(analysis);
            
            return analysis;
        } catch (error) {
            console.error('❌ Coverage analysis failed:', error);
            throw error;
        }
    }

    async loadCoverageSummary() {
        try {
            const summaryPath = path.join(this.coverageDir, 'coverage-summary.json');
            const summaryData = await fs.readFile(summaryPath, 'utf-8');
            return JSON.parse(summaryData);
        } catch (error) {
            console.warn('⚠️ Coverage summary not found, generating from lcov data');
            return await this.generateSummaryFromLcov();
        }
    }

    async generateSummaryFromLcov() {
        try {
            const lcovPath = path.join(this.coverageDir, 'lcov.info');
            const lcovData = await fs.readFile(lcovPath, 'utf-8');
            
            // Parse LCOV data to generate summary
            const files = this.parseLcovData(lcovData);
            return this.aggregateCoverageData(files);
        } catch (error) {
            console.error('❌ Failed to generate summary from LCOV data:', error);
            return { total: { branches: { pct: 0 }, functions: { pct: 0 }, lines: { pct: 0 }, statements: { pct: 0 } } };
        }
    }

    parseLcovData(lcovData) {
        const files = {};
        const lines = lcovData.split('\\n');
        let currentFile = null;
        
        for (const line of lines) {
            if (line.startsWith('SF:')) {
                currentFile = line.substring(3);
                files[currentFile] = {
                    branches: { found: 0, hit: 0, pct: 0 },
                    functions: { found: 0, hit: 0, pct: 0 },
                    lines: { found: 0, hit: 0, pct: 0 },
                    statements: { found: 0, hit: 0, pct: 0 },
                };
            } else if (currentFile && line.startsWith('LF:')) {
                files[currentFile].lines.found = parseInt(line.substring(3));
            } else if (currentFile && line.startsWith('LH:')) {
                files[currentFile].lines.hit = parseInt(line.substring(3));
                files[currentFile].lines.pct = files[currentFile].lines.found > 0 
                    ? (files[currentFile].lines.hit / files[currentFile].lines.found) * 100 
                    : 100;
            } else if (currentFile && line.startsWith('BRF:')) {
                files[currentFile].branches.found = parseInt(line.substring(4));
            } else if (currentFile && line.startsWith('BRH:')) {
                files[currentFile].branches.hit = parseInt(line.substring(4));
                files[currentFile].branches.pct = files[currentFile].branches.found > 0 
                    ? (files[currentFile].branches.hit / files[currentFile].branches.found) * 100 
                    : 100;
            }
        }
        
        return files;
    }

    aggregateCoverageData(files) {
        const totals = {
            branches: { found: 0, hit: 0, pct: 0 },
            functions: { found: 0, hit: 0, pct: 0 },
            lines: { found: 0, hit: 0, pct: 0 },
            statements: { found: 0, hit: 0, pct: 0 },
        };

        Object.values(files).forEach(file => {
            totals.branches.found += file.branches.found;
            totals.branches.hit += file.branches.hit;
            totals.lines.found += file.lines.found;
            totals.lines.hit += file.lines.hit;
        });

        // Calculate percentages
        Object.keys(totals).forEach(metric => {
            totals[metric].pct = totals[metric].found > 0 
                ? (totals[metric].hit / totals[metric].found) * 100 
                : 100;
        });

        return { total: totals, files };
    }

    async generateDetailedAnalysis(coverageSummary) {
        const analysis = {
            fileCount: Object.keys(coverageSummary.files || {}).length,
            totalLines: coverageSummary.total?.lines?.found || 0,
            coveredLines: coverageSummary.total?.lines?.hit || 0,
            uncoveredLines: (coverageSummary.total?.lines?.found || 0) - (coverageSummary.total?.lines?.hit || 0),
            totalBranches: coverageSummary.total?.branches?.found || 0,
            coveredBranches: coverageSummary.total?.branches?.hit || 0,
            uncoveredBranches: (coverageSummary.total?.branches?.found || 0) - (coverageSummary.total?.branches?.hit || 0),
            byDirectory: await this.analyzeByDirectory(coverageSummary),
            byFileType: this.analyzeByFileType(coverageSummary),
            riskAssessment: this.assessRisk(coverageSummary),
        };

        return analysis;
    }

    async analyzeByDirectory(coverageSummary) {
        const directories = {};
        
        Object.entries(coverageSummary.files || {}).forEach(([filePath, fileData]) => {
            const dir = path.dirname(filePath).replace(this.projectRoot, '').replace(/^\\/?src\\//, '') || 'root';
            
            if (!directories[dir]) {
                directories[dir] = {
                    fileCount: 0,
                    lines: { found: 0, hit: 0, pct: 0 },
                    branches: { found: 0, hit: 0, pct: 0 },
                    functions: { found: 0, hit: 0, pct: 0 },
                    statements: { found: 0, hit: 0, pct: 0 },
                };
            }
            
            directories[dir].fileCount++;
            ['lines', 'branches', 'functions', 'statements'].forEach(metric => {
                directories[dir][metric].found += fileData[metric]?.found || 0;
                directories[dir][metric].hit += fileData[metric]?.hit || 0;
            });
        });

        // Calculate percentages
        Object.values(directories).forEach(dir => {
            ['lines', 'branches', 'functions', 'statements'].forEach(metric => {
                dir[metric].pct = dir[metric].found > 0 
                    ? (dir[metric].hit / dir[metric].found) * 100 
                    : 100;
            });
        });

        return directories;
    }

    analyzeByFileType(coverageSummary) {
        const fileTypes = {};
        
        Object.entries(coverageSummary.files || {}).forEach(([filePath, fileData]) => {
            const ext = path.extname(filePath) || 'no-extension';
            
            if (!fileTypes[ext]) {
                fileTypes[ext] = {
                    fileCount: 0,
                    lines: { found: 0, hit: 0, pct: 0 },
                    branches: { found: 0, hit: 0, pct: 0 },
                    functions: { found: 0, hit: 0, pct: 0 },
                    statements: { found: 0, hit: 0, pct: 0 },
                };
            }
            
            fileTypes[ext].fileCount++;
            ['lines', 'branches', 'functions', 'statements'].forEach(metric => {
                fileTypes[ext][metric].found += fileData[metric]?.found || 0;
                fileTypes[ext][metric].hit += fileData[metric]?.hit || 0;
            });
        });

        // Calculate percentages
        Object.values(fileTypes).forEach(type => {
            ['lines', 'branches', 'functions', 'statements'].forEach(metric => {
                type[metric].pct = type[metric].found > 0 
                    ? (type[metric].hit / type[metric].found) * 100 
                    : 100;
            });
        });

        return fileTypes;
    }

    assessRisk(coverageSummary) {
        const risks = [];
        const total = coverageSummary.total || {};
        
        // Overall coverage risk
        if ((total.lines?.pct || 0) < 90) {
            risks.push({
                level: 'HIGH',
                category: 'Line Coverage',
                description: 'Line coverage below 90% threshold',
                impact: 'High risk of undetected bugs',
                recommendation: 'Add comprehensive unit tests'
            });
        }
        
        if ((total.branches?.pct || 0) < 90) {
            risks.push({
                level: 'HIGH',
                category: 'Branch Coverage',
                description: 'Branch coverage below 90% threshold',
                impact: 'Untested code paths may contain bugs',
                recommendation: 'Add tests for conditional logic and edge cases'
            });
        }

        // File-level risks
        Object.entries(coverageSummary.files || {}).forEach(([filePath, fileData]) => {
            if ((fileData.lines?.pct || 0) < 50) {
                risks.push({
                    level: 'CRITICAL',
                    category: 'File Coverage',
                    file: filePath,
                    description: 'Very low coverage in critical file',
                    impact: 'High probability of runtime errors',
                    recommendation: 'Prioritize testing this file'
                });
            }
        });

        return risks;
    }

    async identifyCoverageGaps(coverageSummary) {
        const gaps = {
            uncoveredFiles: [],
            lowCoverageFiles: [],
            missingTests: [],
            complexFunctions: [],
            recommendations: [],
        };

        // Identify files with low coverage
        Object.entries(coverageSummary.files || {}).forEach(([filePath, fileData]) => {
            const coverage = fileData.lines?.pct || 0;
            
            if (coverage === 0) {
                gaps.uncoveredFiles.push({
                    file: filePath,
                    reason: 'No test coverage',
                    priority: 'HIGH'
                });
            } else if (coverage < 80) {
                gaps.lowCoverageFiles.push({
                    file: filePath,
                    coverage: coverage,
                    priority: coverage < 50 ? 'HIGH' : 'MEDIUM'
                });
            }
        });

        // Find files without corresponding tests
        const sourceFiles = await this.findSourceFiles();
        const testFiles = await this.findTestFiles();
        
        for (const sourceFile of sourceFiles) {
            const hasTest = testFiles.some(testFile => 
                testFile.includes(sourceFile.replace('.tsx', '').replace('.ts', ''))
            );
            
            if (!hasTest) {
                gaps.missingTests.push({
                    file: sourceFile,
                    type: 'No test file found',
                    priority: 'MEDIUM'
                });
            }
        }

        return gaps;
    }

    async findSourceFiles() {
        const srcDir = path.join(this.projectRoot, 'src');
        return await this.findFilesRecursively(srcDir, /\\.(ts|tsx)$/, /\\.(test|spec)\\./);
    }

    async findTestFiles() {
        const srcDir = path.join(this.projectRoot, 'src');
        return await this.findFilesRecursively(srcDir, /\\.(test|spec)\\.(ts|tsx)$/);
    }

    async findFilesRecursively(dir, includePattern, excludePattern = null) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    files.push(...await this.findFilesRecursively(fullPath, includePattern, excludePattern));
                } else if (includePattern.test(entry.name) && (!excludePattern || !excludePattern.test(entry.name))) {
                    files.push(fullPath.replace(this.projectRoot + '/', ''));
                }
            }
        } catch (error) {
            console.warn(`⚠️ Could not read directory ${dir}:`, error.message);
        }
        
        return files;
    }

    async evaluateQualityGates(coverageSummary) {
        const results = {
            passed: true,
            gates: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
            },
        };

        const total = coverageSummary.total || {};
        
        // Global quality gates
        Object.entries(this.qualityGates.global).forEach(([metric, threshold]) => {
            const actual = total[metric]?.pct || 0;
            const passed = actual >= threshold;
            
            results.gates[`global_${metric}`] = {
                metric,
                threshold,
                actual,
                passed,
                level: 'global',
            };
            
            results.summary.total++;
            if (passed) {
                results.summary.passed++;
            } else {
                results.summary.failed++;
                results.passed = false;
            }
        });

        return results;
    }

    generateRecommendations(gapAnalysis, qualityGateResults) {
        const recommendations = [];

        // High-priority recommendations
        if (gapAnalysis.uncoveredFiles.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Missing Coverage',
                action: 'Create tests for uncovered files',
                details: `${gapAnalysis.uncoveredFiles.length} files have no test coverage`,
                files: gapAnalysis.uncoveredFiles.slice(0, 5).map(f => f.file),
            });
        }

        if (gapAnalysis.missingTests.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Missing Test Files',
                action: 'Create test files for source files without tests',
                details: `${gapAnalysis.missingTests.length} source files lack corresponding test files`,
                files: gapAnalysis.missingTests.slice(0, 5).map(f => f.file),
            });
        }

        if (!qualityGateResults.passed) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Quality Gates',
                action: 'Improve coverage to meet quality gate thresholds',
                details: `${qualityGateResults.summary.failed} quality gates are failing`,
            });
        }

        return recommendations;
    }

    async saveAnalysis(analysis) {
        const analysisPath = path.join(this.reportsDir, 'coverage-analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
        
        console.log(`📊 Coverage analysis saved to: ${analysisPath}`);
    }

    async generateReports(analysis) {
        // Generate markdown report
        await this.generateMarkdownReport(analysis);
        
        // Generate CSV report for data analysis
        await this.generateCSVReport(analysis);
        
        // Generate badge data
        await this.generateBadgeData(analysis);
    }

    async generateMarkdownReport(analysis) {
        const { summary, detailed, gaps, qualityGates, recommendations } = analysis;
        const total = summary.total || {};
        
        const report = `# Coverage Analysis Report

## 📊 Coverage Summary

| Metric | Coverage | Target | Status |
|--------|----------|--------|--------|
| Lines | ${total.lines?.pct?.toFixed(2) || 0}% | 100% | ${total.lines?.pct >= 100 ? '✅' : '❌'} |
| Branches | ${total.branches?.pct?.toFixed(2) || 0}% | 100% | ${total.branches?.pct >= 100 ? '✅' : '❌'} |
| Functions | ${total.functions?.pct?.toFixed(2) || 0}% | 100% | ${total.functions?.pct >= 100 ? '✅' : '❌'} |
| Statements | ${total.statements?.pct?.toFixed(2) || 0}% | 100% | ${total.statements?.pct >= 100 ? '✅' : '❌'} |

## 🎯 Quality Gates

**Overall Status: ${qualityGates.passed ? '✅ PASSED' : '❌ FAILED'}**

- Total Gates: ${qualityGates.summary.total}
- Passed: ${qualityGates.summary.passed}
- Failed: ${qualityGates.summary.failed}

## 📈 Detailed Analysis

- **Total Files**: ${detailed.fileCount}
- **Total Lines**: ${detailed.totalLines}
- **Covered Lines**: ${detailed.coveredLines}
- **Uncovered Lines**: ${detailed.uncoveredLines}

## 🔍 Coverage Gaps

### Uncovered Files (${gaps.uncoveredFiles.length})
${gaps.uncoveredFiles.slice(0, 10).map(f => `- ${f.file} (${f.priority} priority)`).join('\\n')}

### Low Coverage Files (${gaps.lowCoverageFiles.length})
${gaps.lowCoverageFiles.slice(0, 10).map(f => `- ${f.file} (${f.coverage.toFixed(1)}% coverage)`).join('\\n')}

### Missing Test Files (${gaps.missingTests.length})
${gaps.missingTests.slice(0, 10).map(f => `- ${f.file}`).join('\\n')}

## 🎯 Recommendations

${recommendations.map(r => `### ${r.priority} Priority: ${r.category}
**Action**: ${r.action}
**Details**: ${r.details}
${r.files ? '**Files**: ' + r.files.join(', ') : ''}
`).join('\\n')}

## 📊 Risk Assessment

${detailed.riskAssessment.map(risk => `### ${risk.level} Risk: ${risk.category}
**Description**: ${risk.description}
**Impact**: ${risk.impact}
**Recommendation**: ${risk.recommendation}
${risk.file ? `**File**: ${risk.file}` : ''}
`).join('\\n')}

---
*Generated on: ${new Date(analysis.timestamp).toLocaleString()}*
`;

        const reportPath = path.join(this.reportsDir, 'coverage-report.md');
        await fs.writeFile(reportPath, report);
        
        console.log(`📄 Markdown report generated: ${reportPath}`);
    }

    async generateCSVReport(analysis) {
        const { summary } = analysis;
        const csvData = [];
        
        // Add header
        csvData.push('File,Lines Coverage,Branches Coverage,Functions Coverage,Statements Coverage');
        
        // Add file data
        Object.entries(summary.files || {}).forEach(([filePath, fileData]) => {
            csvData.push([
                filePath,
                fileData.lines?.pct?.toFixed(2) || '0',
                fileData.branches?.pct?.toFixed(2) || '0',
                fileData.functions?.pct?.toFixed(2) || '0',
                fileData.statements?.pct?.toFixed(2) || '0',
            ].join(','));
        });
        
        const csvPath = path.join(this.reportsDir, 'coverage-data.csv');
        await fs.writeFile(csvPath, csvData.join('\\n'));
        
        console.log(`📊 CSV report generated: ${csvPath}`);
    }

    async generateBadgeData(analysis) {
        const { summary } = analysis;
        const total = summary.total || {};
        
        const badges = {
            lines: {
                schemaVersion: 1,
                label: 'coverage',
                message: `${(total.lines?.pct || 0).toFixed(1)}%`,
                color: this.getCoverageColor(total.lines?.pct || 0),
            },
            branches: {
                schemaVersion: 1,
                label: 'branches',
                message: `${(total.branches?.pct || 0).toFixed(1)}%`,
                color: this.getCoverageColor(total.branches?.pct || 0),
            },
            functions: {
                schemaVersion: 1,
                label: 'functions',
                message: `${(total.functions?.pct || 0).toFixed(1)}%`,
                color: this.getCoverageColor(total.functions?.pct || 0),
            },
            statements: {
                schemaVersion: 1,
                label: 'statements',
                message: `${(total.statements?.pct || 0).toFixed(1)}%`,
                color: this.getCoverageColor(total.statements?.pct || 0),
            },
        };
        
        const badgePath = path.join(this.reportsDir, 'coverage-badges.json');
        await fs.writeFile(badgePath, JSON.stringify(badges, null, 2));
        
        console.log(`🏷️ Badge data generated: ${badgePath}`);
    }

    getCoverageColor(percentage) {
        if (percentage >= 100) return 'brightgreen';
        if (percentage >= 90) return 'green';
        if (percentage >= 80) return 'yellowgreen';
        if (percentage >= 70) return 'yellow';
        if (percentage >= 60) return 'orange';
        return 'red';
    }

    async run() {
        try {
            console.log('🚀 Starting coverage analysis...');
            
            await this.initialize();
            const analysis = await this.analyzeCoverage();
            
            console.log('\\n📊 Analysis Summary:');
            console.log(`Files analyzed: ${analysis.detailed.fileCount}`);
            console.log(`Overall line coverage: ${(analysis.summary.total?.lines?.pct || 0).toFixed(2)}%`);
            console.log(`Quality gates: ${analysis.qualityGates.passed ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`Coverage gaps: ${analysis.gaps.uncoveredFiles.length} uncovered files`);
            console.log(`Recommendations: ${analysis.recommendations.length} actions needed`);
            
            if (!analysis.qualityGates.passed) {
                console.log('\\n❌ Coverage quality gates failed!');
                process.exit(1);
            } else {
                console.log('\\n✅ All coverage quality gates passed!');
            }
            
        } catch (error) {
            console.error('❌ Coverage analysis failed:', error);
            process.exit(1);
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new CoverageAnalyzer();
    analyzer.run();
}

export default CoverageAnalyzer;