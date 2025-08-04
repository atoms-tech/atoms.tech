#!/usr/bin/env node

/**
 * OWASP ZAP Security Scanner Runner
 * Automates dynamic security testing using OWASP ZAP
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class OwaspZapRunner {
    constructor() {
        this.zapDockerImage = 'ghcr.io/zaproxy/zaproxy:stable';
        this.reportDir = path.join(__dirname, '../../test-results/security/zap');
        this.targetUrl = process.env.ZAP_TARGET_URL || 'http://localhost:3000';
        this.zapPort = process.env.ZAP_PORT || '8080';
        this.zapApiKey = process.env.ZAP_API_KEY || 'changeme';
        
        this.ensureReportDirectory();
    }

    ensureReportDirectory() {
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
    }

    async checkDockerAvailability() {
        try {
            execSync('docker --version', { stdio: 'ignore' });
            return true;
        } catch (error) {
            console.warn('Docker not available. ZAP scanning will be skipped.');
            return false;
        }
    }

    async pullZapImage() {
        console.log('📥 Pulling OWASP ZAP Docker image...');
        try {
            execSync(`docker pull ${this.zapDockerImage}`, { stdio: 'inherit' });
            return true;
        } catch (error) {
            console.error('Failed to pull ZAP image:', error.message);
            return false;
        }
    }

    async runBaselineScan() {
        console.log(`🔍 Running ZAP baseline scan on ${this.targetUrl}...`);
        
        const reportFile = path.join(this.reportDir, 'zap-baseline-report.html');
        const jsonReportFile = path.join(this.reportDir, 'zap-baseline-report.json');
        
        const cmd = [
            'docker', 'run', '--rm',
            '-v', `${this.reportDir}:/zap/wrk/:rw`,
            '-u', 'zap',
            this.zapDockerImage,
            'zap-baseline.py',
            '-t', this.targetUrl,
            '-g', 'gen.conf',
            '-r', 'zap-baseline-report.html',
            '-J', 'zap-baseline-report.json',
            '-x', 'zap-baseline-report.xml'
        ];

        try {
            execSync(cmd.join(' '), { 
                stdio: 'inherit',
                cwd: this.reportDir
            });
            
            return {
                success: true,
                reports: {
                    html: reportFile,
                    json: jsonReportFile
                }
            };
        } catch (error) {
            // ZAP baseline scan returns non-zero exit codes for findings
            // Check if reports were generated
            if (fs.existsSync(reportFile)) {
                console.log('⚠️ ZAP baseline scan completed with findings');
                return {
                    success: false,
                    reports: {
                        html: reportFile,
                        json: jsonReportFile
                    },
                    findings: true
                };
            }
            throw error;
        }
    }

    async runFullScan() {
        console.log(`🔍 Running ZAP full scan on ${this.targetUrl}...`);
        
        const reportFile = path.join(this.reportDir, 'zap-full-report.html');
        const jsonReportFile = path.join(this.reportDir, 'zap-full-report.json');
        
        const cmd = [
            'docker', 'run', '--rm',
            '-v', `${this.reportDir}:/zap/wrk/:rw`,
            '-u', 'zap',
            this.zapDockerImage,
            'zap-full-scan.py',
            '-t', this.targetUrl,
            '-g', 'gen.conf',
            '-r', 'zap-full-report.html',
            '-J', 'zap-full-report.json',
            '-x', 'zap-full-report.xml'
        ];

        try {
            execSync(cmd.join(' '), { 
                stdio: 'inherit',
                cwd: this.reportDir,
                timeout: 600000 // 10 minutes timeout
            });
            
            return {
                success: true,
                reports: {
                    html: reportFile,
                    json: jsonReportFile
                }
            };
        } catch (error) {
            if (fs.existsSync(reportFile)) {
                console.log('⚠️ ZAP full scan completed with findings');
                return {
                    success: false,
                    reports: {
                        html: reportFile,
                        json: jsonReportFile
                    },
                    findings: true
                };
            }
            throw error;
        }
    }

    async runApiScan(openApiSpec) {
        console.log(`🔍 Running ZAP API scan using OpenAPI spec...`);
        
        const reportFile = path.join(this.reportDir, 'zap-api-report.html');
        const jsonReportFile = path.join(this.reportDir, 'zap-api-report.json');
        
        const cmd = [
            'docker', 'run', '--rm',
            '-v', `${this.reportDir}:/zap/wrk/:rw`,
            '-v', `${openApiSpec}:/zap/api-spec.json:ro`,
            '-u', 'zap',
            this.zapDockerImage,
            'zap-api-scan.py',
            '-t', '/zap/api-spec.json',
            '-f', 'openapi',
            '-g', 'gen.conf',
            '-r', 'zap-api-report.html',
            '-J', 'zap-api-report.json',
            '-x', 'zap-api-report.xml'
        ];

        try {
            execSync(cmd.join(' '), { 
                stdio: 'inherit',
                cwd: this.reportDir,
                timeout: 300000 // 5 minutes timeout
            });
            
            return {
                success: true,
                reports: {
                    html: reportFile,
                    json: jsonReportFile
                }
            };
        } catch (error) {
            if (fs.existsSync(reportFile)) {
                console.log('⚠️ ZAP API scan completed with findings');
                return {
                    success: false,
                    reports: {
                        html: reportFile,
                        json: jsonReportFile
                    },
                    findings: true
                };
            }
            throw error;
        }
    }

    async analyzeResults() {
        const results = {
            timestamp: new Date().toISOString(),
            scans: [],
            summary: {
                totalFindings: 0,
                highRisk: 0,
                mediumRisk: 0,
                lowRisk: 0,
                informational: 0
            }
        };

        // Check for JSON reports
        const reportFiles = [
            'zap-baseline-report.json',
            'zap-full-report.json',
            'zap-api-report.json'
        ];

        for (const reportFile of reportFiles) {
            const filePath = path.join(this.reportDir, reportFile);
            if (fs.existsSync(filePath)) {
                try {
                    const reportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const scanType = reportFile.replace('zap-', '').replace('-report.json', '');
                    
                    const scanResults = this.parseZapReport(reportData, scanType);
                    results.scans.push(scanResults);
                    
                    // Update summary
                    results.summary.totalFindings += scanResults.findings.length;
                    scanResults.findings.forEach(finding => {
                        switch (finding.risk.toLowerCase()) {
                            case 'high':
                                results.summary.highRisk++;
                                break;
                            case 'medium':
                                results.summary.mediumRisk++;
                                break;
                            case 'low':
                                results.summary.lowRisk++;
                                break;
                            default:
                                results.summary.informational++;
                        }
                    });
                } catch (error) {
                    console.warn(`Failed to parse ${reportFile}:`, error.message);
                }
            }
        }

        return results;
    }

    parseZapReport(reportData, scanType) {
        const findings = [];
        
        if (reportData.site && reportData.site[0] && reportData.site[0].alerts) {
            reportData.site[0].alerts.forEach(alert => {
                findings.push({
                    name: alert.name,
                    risk: alert.riskdesc.split(' ')[0], // Extract risk level
                    confidence: alert.confidence,
                    description: alert.desc,
                    solution: alert.solution,
                    reference: alert.reference,
                    instances: alert.instances ? alert.instances.length : 0
                });
            });
        }

        return {
            scanType,
            target: reportData.target || this.targetUrl,
            findings,
            summary: {
                totalAlerts: findings.length,
                riskBreakdown: this.getRiskBreakdown(findings)
            }
        };
    }

    getRiskBreakdown(findings) {
        const breakdown = { high: 0, medium: 0, low: 0, informational: 0 };
        
        findings.forEach(finding => {
            const risk = finding.risk.toLowerCase();
            if (breakdown.hasOwnProperty(risk)) {
                breakdown[risk]++;
            } else {
                breakdown.informational++;
            }
        });

        return breakdown;
    }

    async generateSummaryReport(results) {
        const summaryPath = path.join(this.reportDir, 'zap-summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

        const htmlSummary = this.generateHtmlSummary(results);
        const htmlPath = path.join(this.reportDir, 'zap-summary.html');
        fs.writeFileSync(htmlPath, htmlSummary);

        console.log(`\n📊 ZAP Scan Summary:`);
        console.log(`Total Findings: ${results.summary.totalFindings}`);
        console.log(`High Risk: ${results.summary.highRisk}`);
        console.log(`Medium Risk: ${results.summary.mediumRisk}`);
        console.log(`Low Risk: ${results.summary.lowRisk}`);
        console.log(`Informational: ${results.summary.informational}`);
        console.log(`\n📝 Reports saved to: ${this.reportDir}`);

        return results;
    }

    generateHtmlSummary(results) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>OWASP ZAP Security Scan Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat { padding: 15px; border-radius: 5px; text-align: center; min-width: 80px; }
        .high-risk { background: #f8d7da; color: #721c24; }
        .medium-risk { background: #fff3cd; color: #856404; }
        .low-risk { background: #d1ecf1; color: #0c5460; }
        .info { background: #d4edda; color: #155724; }
        .scan-results { margin: 20px 0; }
        .finding { margin: 10px 0; padding: 15px; border-left: 4px solid #ddd; }
        .finding-high { border-left-color: #dc3545; }
        .finding-medium { border-left-color: #ffc107; }
        .finding-low { border-left-color: #17a2b8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 OWASP ZAP Security Scan Report</h1>
        <p>Generated: ${results.timestamp}</p>
        <p>Target: ${this.targetUrl}</p>
    </div>

    <div class="summary">
        <div class="stat high-risk">
            <h3>${results.summary.highRisk}</h3>
            <p>High Risk</p>
        </div>
        <div class="stat medium-risk">
            <h3>${results.summary.mediumRisk}</h3>
            <p>Medium Risk</p>
        </div>
        <div class="stat low-risk">
            <h3>${results.summary.lowRisk}</h3>
            <p>Low Risk</p>
        </div>
        <div class="stat info">
            <h3>${results.summary.informational}</h3>
            <p>Informational</p>
        </div>
    </div>

    ${results.scans.map(scan => `
        <div class="scan-results">
            <h2>${scan.scanType.toUpperCase()} Scan Results</h2>
            <p><strong>Target:</strong> ${scan.target}</p>
            <p><strong>Total Alerts:</strong> ${scan.findings.length}</p>
            
            ${scan.findings.map(finding => `
                <div class="finding finding-${finding.risk.toLowerCase()}">
                    <h3>${finding.name}</h3>
                    <p><strong>Risk:</strong> ${finding.risk} | <strong>Confidence:</strong> ${finding.confidence}</p>
                    <p><strong>Description:</strong> ${finding.description}</p>
                    <p><strong>Solution:</strong> ${finding.solution}</p>
                    ${finding.instances > 0 ? `<p><strong>Instances:</strong> ${finding.instances}</p>` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;
    }

    async run(scanType = 'baseline') {
        console.log('🚀 Starting OWASP ZAP Security Scanning...\n');

        // Check Docker availability
        if (!(await this.checkDockerAvailability())) {
            console.log('⏭️ Skipping ZAP scans - Docker not available');
            return { skipped: true, reason: 'Docker not available' };
        }

        // Pull ZAP image
        if (!(await this.pullZapImage())) {
            console.log('⏭️ Skipping ZAP scans - Failed to pull image');
            return { skipped: true, reason: 'Failed to pull ZAP image' };
        }

        try {
            let scanResult;
            
            switch (scanType) {
                case 'full':
                    scanResult = await this.runFullScan();
                    break;
                case 'api':
                    const apiSpecPath = path.join(__dirname, '../../api-spec.json');
                    if (fs.existsSync(apiSpecPath)) {
                        scanResult = await this.runApiScan(apiSpecPath);
                    } else {
                        console.log('⏭️ API spec not found, running baseline scan instead');
                        scanResult = await this.runBaselineScan();
                    }
                    break;
                default:
                    scanResult = await this.runBaselineScan();
            }

            // Analyze results
            const results = await this.analyzeResults();
            await this.generateSummaryReport(results);

            const hasHighRiskFindings = results.summary.highRisk > 0;
            if (hasHighRiskFindings) {
                console.log('\n❌ ZAP scan completed with high-risk findings');
                process.exit(1);
            } else {
                console.log('\n✅ ZAP scan completed successfully');
                return results;
            }

        } catch (error) {
            console.error('ZAP scan failed:', error.message);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const scanType = process.argv[2] || 'baseline';
    const runner = new OwaspZapRunner();
    runner.run(scanType).catch(error => {
        console.error('OWASP ZAP runner failed:', error);
        process.exit(1);
    });
}

module.exports = OwaspZapRunner;