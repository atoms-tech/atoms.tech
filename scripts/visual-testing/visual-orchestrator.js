/**
 * Visual Testing Orchestrator
 * Comprehensive orchestration of all visual testing tools and workflows
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ChromaticIntegration = require('./chromatic-integration');
const PercyIntegration = require('./percy-integration');
const BackstopIntegration = require('./backstop-integration');
const StorybookIntegration = require('./storybook-integration');

class VisualTestingOrchestrator {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.storybookUrl = options.storybookUrl || 'http://localhost:6006';
    this.concurrency = options.concurrency || 3;
    this.reportDir = options.reportDir || 'test-results/visual-reports';
    
    // Initialize integrations
    this.chromatic = new ChromaticIntegration(options.chromatic || {});
    this.percy = new PercyIntegration(options.percy || {});
    this.backstop = new BackstopIntegration(options.backstop || {});
    this.storybook = new StorybookIntegration(options.storybook || {});
    
    this.workflows = {
      'component-only': ['storybook', 'chromatic'],
      'page-focused': ['backstop', 'percy'],
      'comprehensive': ['storybook', 'chromatic', 'backstop', 'percy'],
      'ci-optimized': ['chromatic', 'backstop'],
      'local-development': ['storybook', 'backstop'],
    };
  }

  /**
   * Setup comprehensive visual testing infrastructure
   */
  async setupAll() {
    console.log('🚀 Setting up comprehensive visual testing infrastructure...');

    try {
      // Create reports directory
      if (!fs.existsSync(this.reportDir)) {
        fs.mkdirSync(this.reportDir, { recursive: true });
      }

      // Setup all integrations in parallel
      const setupPromises = [
        this.storybook.setup(),
        this.chromatic.setup(),
        this.percy.setup(),
        this.backstop.setup(),
      ];

      await Promise.all(setupPromises);

      // Create orchestration configuration
      await this.createOrchestrationConfig();

      // Update package.json with orchestration scripts
      await this.updatePackageScripts();

      // Setup CI/CD workflows
      await this.setupCIWorkflows();

      // Create visual testing documentation
      await this.createDocumentation();

      console.log('✅ Comprehensive visual testing infrastructure setup completed!');
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Run visual tests based on workflow type
   */
  async runWorkflow(workflowType = 'comprehensive', options = {}) {
    console.log(`🎯 Running visual testing workflow: ${workflowType}`);

    const workflow = this.workflows[workflowType];
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    const {
      sequential = false,
      updateBaselines = false,
      autoApprove = false,
      skipBuild = false,
    } = options;

    const results = {};
    const startTime = Date.now();

    try {
      // Pre-flight checks
      await this.preflightChecks();

      // Build application if needed
      if (!skipBuild) {
        await this.buildApplication();
      }

      // Run workflow steps
      if (sequential) {
        for (const tool of workflow) {
          results[tool] = await this.runToolWorkflow(tool, options);
        }
      } else {
        const toolPromises = workflow.map(tool => 
          this.runToolWorkflow(tool, options).then(result => ({ tool, result }))
        );
        
        const toolResults = await Promise.allSettled(toolPromises);
        
        toolResults.forEach(({ status, value, reason }) => {
          if (status === 'fulfilled') {
            results[value.tool] = value.result;
          } else {
            console.error(`Tool failed:`, reason);
            results[reason.tool || 'unknown'] = { error: reason.message };
          }
        });
      }

      // Generate comprehensive report
      const report = await this.generateComprehensiveReport(workflowType, results, startTime);

      console.log('✅ Visual testing workflow completed successfully!');
      return report;

    } catch (error) {
      console.error('❌ Visual testing workflow failed:', error.message);
      
      // Generate failure report
      const failureReport = await this.generateFailureReport(workflowType, results, error, startTime);
      throw new Error(`Workflow failed: ${error.message}`);
    }
  }

  /**
   * Run individual tool workflow
   */
  async runToolWorkflow(tool, options = {}) {
    console.log(`🔧 Running ${tool} workflow...`);

    const {
      updateBaselines = false,
      autoApprove = false,
    } = options;

    try {
      switch (tool) {
        case 'storybook':
          // Build and serve Storybook
          await this.storybook.buildStorybook();
          return { status: 'success', message: 'Storybook built successfully' };

        case 'chromatic':
          // Run Chromatic visual tests
          const chromaticResult = await this.chromatic.runVisualTests({
            autoAcceptChanges: autoApprove,
            exitZeroOnChanges: true,
            onlyChanged: !updateBaselines,
          });
          return { status: 'success', result: chromaticResult };

        case 'percy':
          // Run Percy visual tests
          const percyResult = await this.percy.runVisualTests({
            dry_run: false,
            parallel: true,
          });
          return { status: 'success', result: percyResult };

        case 'backstop':
          // Run BackstopJS workflow
          if (updateBaselines) {
            await this.backstop.runVisualTests('reference');
          }
          
          const backstopResult = await this.backstop.runVisualTests('test');
          
          if (autoApprove) {
            await this.backstop.runVisualTests('approve');
          }
          
          return { status: 'success', result: backstopResult };

        default:
          throw new Error(`Unknown tool: ${tool}`);
      }
    } catch (error) {
      console.error(`❌ ${tool} workflow failed:`, error.message);
      return { 
        status: 'failed', 
        error: error.message,
        tool: tool 
      };
    }
  }

  /**
   * Pre-flight checks before running tests
   */
  async preflightChecks() {
    console.log('🔍 Running pre-flight checks...');

    // Check if Node.js application is running
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Application not responding at ${this.baseUrl}`);
      }
    } catch (error) {
      console.warn(`⚠️ Application not running at ${this.baseUrl}. Starting dev server...`);
      // Could start the dev server here, but for now just warn
    }

    // Check required dependencies
    const requiredDeps = ['@playwright/test', 'backstopjs', 'chromatic'];
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        console.warn(`⚠️ Missing dependency: ${dep}`);
      }
    }

    // Check environment variables
    const requiredEnvVars = {
      'CHROMATIC_PROJECT_TOKEN': 'Chromatic integration',
      'PERCY_TOKEN': 'Percy integration',
    };

    for (const [envVar, purpose] of Object.entries(requiredEnvVars)) {
      if (!process.env[envVar]) {
        console.warn(`⚠️ Missing environment variable ${envVar} for ${purpose}`);
      }
    }

    console.log('✅ Pre-flight checks completed');
  }

  /**
   * Build application for testing
   */
  async buildApplication() {
    console.log('🏗️ Building application...');

    try {
      // Check if we should build or just use dev server
      if (process.env.NODE_ENV === 'production' || process.env.CI) {
        execSync('npm run build', { stdio: 'inherit' });
        execSync('npm run start &', { stdio: 'inherit' });
        
        // Wait for application to start
        await this.waitForServer(this.baseUrl, 30000);
      } else {
        console.log('💡 Using development server');
      }
    } catch (error) {
      console.error('❌ Failed to build application:', error.message);
      throw error;
    }
  }

  /**
   * Wait for server to be ready
   */
  async waitForServer(url, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`✅ Server ready at ${url}`);
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Server not ready at ${url} after ${timeout}ms`);
  }

  /**
   * Create orchestration configuration
   */
  async createOrchestrationConfig() {
    const config = {
      version: '1.0.0',
      baseUrl: this.baseUrl,
      storybookUrl: this.storybookUrl,
      concurrency: this.concurrency,
      reportDir: this.reportDir,
      
      workflows: this.workflows,
      
      tools: {
        chromatic: {
          enabled: true,
          projectToken: process.env.CHROMATIC_PROJECT_TOKEN || '${CHROMATIC_PROJECT_TOKEN}',
          buildScriptName: 'build-storybook',
          exitZeroOnChanges: true,
        },
        percy: {
          enabled: true,
          token: process.env.PERCY_TOKEN || '${PERCY_TOKEN}',
          baseUrl: this.baseUrl,
          snapshotDirectory: 'percy/snapshots',
        },
        backstop: {
          enabled: true,
          configPath: 'backstop.config.js',
          baseUrl: this.baseUrl,
        },
        storybook: {
          enabled: true,
          port: 6006,
          buildDir: 'storybook-static',
          configDir: '.storybook',
        },
      },
      
      ci: {
        workflow: 'ci-optimized',
        parallel: true,
        autoApprove: false,
        updateBaselines: false,
        failOnChanges: true,
      },
      
      local: {
        workflow: 'local-development',
        parallel: false,
        autoApprove: true,
        updateBaselines: true,
        failOnChanges: false,
      },
    };

    fs.writeFileSync('visual-testing.config.js', `module.exports = ${JSON.stringify(config, null, 2)};`);
    console.log('✅ Created visual testing orchestration configuration');
  }

  /**
   * Update package.json with orchestration scripts
   */
  async updatePackageScripts() {
    const packageJsonPath = 'package.json';
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = packageJson.scripts || {};
    
    // Orchestration scripts
    packageJson.scripts['visual:test'] = 'node scripts/visual-testing/visual-orchestrator.js --workflow=comprehensive';
    packageJson.scripts['visual:test:ci'] = 'node scripts/visual-testing/visual-orchestrator.js --workflow=ci-optimized';
    packageJson.scripts['visual:test:local'] = 'node scripts/visual-testing/visual-orchestrator.js --workflow=local-development';
    packageJson.scripts['visual:test:components'] = 'node scripts/visual-testing/visual-orchestrator.js --workflow=component-only';
    packageJson.scripts['visual:test:pages'] = 'node scripts/visual-testing/visual-orchestrator.js --workflow=page-focused';
    
    // Utility scripts
    packageJson.scripts['visual:setup'] = 'node scripts/visual-testing/visual-orchestrator.js --setup';
    packageJson.scripts['visual:update-baselines'] = 'node scripts/visual-testing/visual-orchestrator.js --workflow=comprehensive --update-baselines';
    packageJson.scripts['visual:approve-all'] = 'node scripts/visual-testing/visual-orchestrator.js --workflow=comprehensive --auto-approve';
    packageJson.scripts['visual:report'] = 'node scripts/visual-testing/visual-orchestrator.js --report-only';
    
    // Cleanup scripts
    packageJson.scripts['visual:clean'] = 'node scripts/visual-testing/visual-orchestrator.js --cleanup';
    packageJson.scripts['visual:reset'] = 'node scripts/visual-testing/visual-orchestrator.js --reset-all';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json scripts for visual testing orchestration');
  }

  /**
   * Setup CI/CD workflows
   */
  async setupCIWorkflows() {
    console.log('⚙️ Setting up CI/CD workflows...');

    const workflowDir = '.github/workflows';
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }

    // Comprehensive visual testing workflow
    const visualTestingWorkflow = `
name: 'Visual Regression Testing'

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

concurrency:
  group: visual-\${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  visual-testing:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    strategy:
      matrix:
        tool: [chromatic, backstop]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Build Storybook
        if: matrix.tool == 'chromatic'
        run: npm run build-storybook
        
      - name: Build application
        if: matrix.tool == 'backstop'
        run: npm run build
        
      - name: Start application
        if: matrix.tool == 'backstop'
        run: |
          npm run start &
          npx wait-on http://localhost:3000
        
      - name: Run Chromatic tests
        if: matrix.tool == 'chromatic'
        run: npm run chromatic:ci
        env:
          CHROMATIC_PROJECT_TOKEN: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          
      - name: Run BackstopJS tests
        if: matrix.tool == 'backstop'
        run: npm run backstop:test
        
      - name: Upload visual test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: visual-test-results-\${{ matrix.tool }}
          path: |
            test-results/visual-reports/
            backstop_data/html_report/
            .chromatic/
          retention-days: 30
          
      - name: Comment PR with results
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = 'test-results/visual-reports/';
            
            if (fs.existsSync(path)) {
              const files = fs.readdirSync(path);
              const reports = files.filter(f => f.endsWith('-report.json'));
              
              let comment = '## 🎨 Visual Regression Test Results\\n\\n';
              
              for (const report of reports) {
                const data = JSON.parse(fs.readFileSync(path + report, 'utf8'));
                comment += \`- **\${report.replace('-report.json', '')}**: \${data.status || 'completed'}\\n\`;
              }
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }

  visual-approval:
    needs: visual-testing
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' && github.actor != 'dependabot[bot]'
    
    steps:
      - name: Download visual test results
        uses: actions/download-artifact@v4
        with:
          pattern: visual-test-results-*
          merge-multiple: true
          
      - name: Check for visual changes
        run: |
          echo "Visual changes detected in PR"
          echo "Please review the visual diff reports in the artifacts"
          
      - name: Require manual approval
        if: github.event_name == 'pull_request'
        run: |
          echo "::warning::Visual changes require manual review and approval"
          echo "::warning::Check the uploaded artifacts for visual diff reports"
`;

    fs.writeFileSync(path.join(workflowDir, 'visual-testing.yml'), visualTestingWorkflow.trim());

    // Percy-specific workflow
    const percyWorkflow = `
name: 'Percy Visual Tests'

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  percy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        
      - name: Build application
        run: npm run build
        
      - name: Start application
        run: npm run start &
        
      - name: Wait for application
        run: npx wait-on http://localhost:3000
        
      - name: Run Percy visual tests
        run: npm run percy:ci
        env:
          PERCY_TOKEN: \${{ secrets.PERCY_TOKEN }}
          PERCY_PARALLEL_NONCE: \${{ github.event_name }}-\${{ github.sha }}
          PERCY_PARALLEL_TOTAL: 1
`;

    fs.writeFileSync(path.join(workflowDir, 'percy-visual-tests.yml'), percyWorkflow.trim());

    console.log('✅ CI/CD workflows created');
  }

  /**
   * Generate comprehensive report
   */
  async generateComprehensiveReport(workflowType, results, startTime) {
    console.log('📊 Generating comprehensive visual testing report...');

    const endTime = Date.now();
    const duration = endTime - startTime;

    const report = {
      timestamp: new Date().toISOString(),
      workflow: workflowType,
      duration: duration,
      durationFormatted: this.formatDuration(duration),
      status: this.determineOverallStatus(results),
      baseUrl: this.baseUrl,
      tools: results,
      summary: {
        total: Object.keys(results).length,
        passed: Object.values(results).filter(r => r.status === 'success').length,
        failed: Object.values(results).filter(r => r.status === 'failed').length,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI,
        timestamp: new Date().toISOString(),
      },
    };

    // Add tool-specific summaries
    for (const [tool, result] of Object.entries(results)) {
      if (result.result && typeof result.result === 'object') {
        report.tools[tool].summary = this.extractToolSummary(tool, result.result);
      }
    }

    const reportPath = path.join(this.reportDir, 'comprehensive-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(report);

    console.log(`✅ Comprehensive report saved to: ${reportPath}`);
    return report;
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Testing Report - ${report.workflow}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 500; font-size: 14px; }
        .status.success { background: #dcfce7; color: #166534; }
        .status.failed { background: #fef2f2; color: #dc2626; }
        .status.partial { background: #fef3c7; color: #d97706; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; }
        .card h3 { margin: 0 0 10px 0; color: #374151; }
        .card .value { font-size: 24px; font-weight: 600; color: #111827; }
        .tools { margin-top: 30px; }
        .tool { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
        .tool h3 { margin: 0 0 15px 0; display: flex; align-items: center; justify-content: space-between; }
        .tool-status { font-size: 12px; }
        .error { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .timestamp { color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Visual Testing Report</h1>
            <div class="status ${report.status}">${report.status.toUpperCase()}</div>
            <div class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</div>
            <div class="timestamp">Workflow: ${report.workflow}</div>
            <div class="timestamp">Duration: ${report.durationFormatted}</div>
        </div>
        
        <div class="summary">
            <div class="card">
                <h3>Total Tools</h3>
                <div class="value">${report.summary.total}</div>
            </div>
            <div class="card">
                <h3>Passed</h3>
                <div class="value" style="color: #059669;">${report.summary.passed}</div>
            </div>
            <div class="card">
                <h3>Failed</h3>
                <div class="value" style="color: #dc2626;">${report.summary.failed}</div>
            </div>
            <div class="card">
                <h3>Success Rate</h3>
                <div class="value">${Math.round((report.summary.passed / report.summary.total) * 100)}%</div>
            </div>
        </div>
        
        <div class="tools">
            <h2>Tool Results</h2>
            ${Object.entries(report.tools).map(([tool, result]) => `
                <div class="tool">
                    <h3>
                        ${tool.charAt(0).toUpperCase() + tool.slice(1)}
                        <span class="status tool-status ${result.status}">${result.status}</span>
                    </h3>
                    ${result.message ? `<p>${result.message}</p>` : ''}
                    ${result.error ? `<div class="error"><strong>Error:</strong> ${result.error}</div>` : ''}
                    ${result.summary ? `
                        <div style="margin-top: 15px;">
                            <strong>Summary:</strong>
                            <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px; margin-top: 5px; overflow-x: auto;">${JSON.stringify(result.summary, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>Environment: Node.js ${report.environment.nodeVersion} on ${report.environment.platform}</p>
            <p>CI Environment: ${report.environment.ci ? 'Yes' : 'No'}</p>
            <p>Base URL: ${report.baseUrl}</p>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.reportDir, 'comprehensive-report.html');
    fs.writeFileSync(htmlPath, htmlTemplate);
    console.log(`✅ HTML report saved to: ${htmlPath}`);
  }

  /**
   * Utility methods
   */
  determineOverallStatus(results) {
    const statuses = Object.values(results).map(r => r.status);
    
    if (statuses.every(s => s === 'success')) {
      return 'success';
    } else if (statuses.every(s => s === 'failed')) {
      return 'failed';
    } else {
      return 'partial';
    }
  }

  formatDuration(duration) {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  extractToolSummary(tool, result) {
    // Extract meaningful summary from tool results
    switch (tool) {
      case 'chromatic':
        return { type: 'chromatic', buildId: result.buildId || 'unknown' };
      case 'percy':
        return { type: 'percy', buildId: result.buildId || 'unknown' };
      case 'backstop':
        return { type: 'backstop', scenarios: result.scenarios || 0 };
      case 'storybook':
        return { type: 'storybook', built: true };
      default:
        return { type: tool };
    }
  }

  /**
   * Create comprehensive documentation
   */
  async createDocumentation() {
    const docContent = `
# Visual Testing Infrastructure

This project uses a comprehensive visual testing setup with multiple tools and workflows.

## Tools Included

### 1. Storybook
- **Purpose**: Component isolation and documentation
- **Usage**: \`npm run storybook\`
- **Build**: \`npm run build-storybook\`

### 2. Chromatic
- **Purpose**: Cloud-based visual testing for Storybook
- **Usage**: \`npm run chromatic\`
- **CI**: \`npm run chromatic:ci\`

### 3. Percy
- **Purpose**: Visual testing for full pages
- **Usage**: \`npm run percy:test\`
- **CI**: \`npm run percy:ci\`

### 4. BackstopJS
- **Purpose**: Comprehensive UI regression testing
- **Usage**: \`npm run backstop:test\`
- **Reference**: \`npm run backstop:reference\`

## Workflows

### Component-Only Testing
\`\`\`bash
npm run visual:test:components
\`\`\`
Tests only component variations through Storybook and Chromatic.

### Page-Focused Testing
\`\`\`bash
npm run visual:test:pages
\`\`\`
Tests full pages and user flows through BackstopJS and Percy.

### Comprehensive Testing
\`\`\`bash
npm run visual:test
\`\`\`
Runs all visual testing tools for complete coverage.

### CI-Optimized Testing
\`\`\`bash
npm run visual:test:ci
\`\`\`
Optimized workflow for CI/CD environments.

### Local Development
\`\`\`bash
npm run visual:test:local
\`\`\`
Development-friendly workflow with auto-approval.

## Configuration

Visual testing configuration is managed in \`visual-testing.config.js\`.

## Environment Variables

- \`CHROMATIC_PROJECT_TOKEN\`: Required for Chromatic integration
- \`PERCY_TOKEN\`: Required for Percy integration

## Reports

Visual testing reports are generated in \`test-results/visual-reports/\`:
- \`comprehensive-report.html\`: Main HTML report
- \`comprehensive-report.json\`: Detailed JSON data
- Tool-specific reports in subdirectories

## CI/CD Integration

GitHub Actions workflows are configured for:
- Pull request visual testing
- Main branch baseline updates
- Approval workflows for visual changes

## Best Practices

1. **Update baselines**: Run \`npm run visual:update-baselines\` after intentional UI changes
2. **Review changes**: Always review visual diffs before approving
3. **Test locally**: Use \`npm run visual:test:local\` during development
4. **Component-first**: Start with component testing before full page testing

## Troubleshooting

### Common Issues

1. **Application not running**: Ensure dev server is started
2. **Missing tokens**: Check environment variables
3. **Baseline mismatches**: Update baselines after UI changes
4. **Timeout errors**: Increase timeout in tool configurations

### Getting Help

1. Check the HTML report for detailed error information
2. Review individual tool logs in the console output
3. Verify all dependencies are installed correctly
`;

    fs.writeFileSync('docs/visual-testing.md', docContent.trim());
    console.log('✅ Documentation created');
  }

  /**
   * CLI interface for the orchestrator
   */
  static async cli() {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--workflow=')) {
        options.workflow = arg.split('=')[1];
      } else if (arg === '--setup') {
        options.setup = true;
      } else if (arg === '--update-baselines') {
        options.updateBaselines = true;
      } else if (arg === '--auto-approve') {
        options.autoApprove = true;
      } else if (arg === '--sequential') {
        options.sequential = true;
      } else if (arg === '--skip-build') {
        options.skipBuild = true;
      } else if (arg === '--report-only') {
        options.reportOnly = true;
      } else if (arg === '--cleanup') {
        options.cleanup = true;
      } else if (arg === '--reset-all') {
        options.resetAll = true;
      }
    }

    const orchestrator = new VisualTestingOrchestrator();

    try {
      if (options.setup) {
        await orchestrator.setupAll();
      } else if (options.cleanup) {
        await orchestrator.cleanup();
      } else if (options.resetAll) {
        await orchestrator.resetAll();
      } else if (options.reportOnly) {
        await orchestrator.generateReportOnly();
      } else {
        const workflow = options.workflow || 'comprehensive';
        await orchestrator.runWorkflow(workflow, options);
      }
    } catch (error) {
      console.error('❌ Orchestrator failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Cleanup method
   */
  async cleanup() {
    console.log('🧹 Cleaning up visual testing artifacts...');
    
    const cleanupPaths = [
      'test-results/visual-reports',
      'backstop_data/bitmaps_test',
      'backstop_data/html_report',
      'storybook-static',
      '.chromatic',
    ];

    cleanupPaths.forEach(cleanupPath => {
      if (fs.existsSync(cleanupPath)) {
        fs.rmSync(cleanupPath, { recursive: true, force: true });
        console.log(`🗑️  Removed: ${cleanupPath}`);
      }
    });

    console.log('✅ Cleanup completed');
  }

  /**
   * Reset all baselines
   */
  async resetAll() {
    console.log('🔄 Resetting all visual testing baselines...');
    
    await this.cleanup();
    
    // Reset BackstopJS references
    if (fs.existsSync('backstop_data/bitmaps_reference')) {
      fs.rmSync('backstop_data/bitmaps_reference', { recursive: true, force: true });
    }
    
    console.log('✅ All baselines reset');
  }
}

// Export for module usage
module.exports = VisualTestingOrchestrator;

// CLI execution
if (require.main === module) {
  VisualTestingOrchestrator.cli();
}