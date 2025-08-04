# Regression Testing Framework

A comprehensive 100% regression test coverage framework for preventing and detecting regressions in web applications.

## 🚀 Features

- **100% Regression Coverage**: Complete testing across all application layers
- **Automated Test Execution**: Continuous testing pipeline with CI/CD integration
- **Real-time Monitoring**: Live dashboard with regression alerts
- **Prevention System**: Proactive regression prevention with pre-commit checks
- **Multiple Test Types**: Unit, Integration, E2E, Performance, Visual, Security
- **Agent-Optimized**: Designed for AI agent collaboration and automation

## 📁 Structure

```
scripts/regression-testing/
├── regression-test-suite.js     # Main test suite orchestrator
├── regression-pipeline.js       # Continuous testing pipeline
├── regression-prevention.js     # Proactive regression prevention
├── regression-config.js         # Centralized configuration
├── regression-dashboard.js      # Real-time monitoring dashboard
├── dashboard-static/            # Dashboard UI files
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md                   # This file
```

## 🛠️ Installation

1. Install dependencies:
```bash
npm install --save-dev jest playwright @playwright/test
```

2. Initialize the regression testing framework:
```bash
node scripts/regression-testing/regression-test-suite.js --init
```

3. Setup Git hooks for prevention:
```bash
node scripts/regression-testing/regression-prevention.js --setup
```

## 🚀 Quick Start

### Running Tests

```bash
# Run complete regression test suite
node scripts/regression-testing/regression-test-suite.js

# Run specific test type
node scripts/regression-testing/regression-test-suite.js --type=unit
node scripts/regression-testing/regression-test-suite.js --type=e2e

# Run with specific configuration
node scripts/regression-testing/regression-test-suite.js --config=production
```

### Starting the Pipeline

```bash
# Start continuous regression testing
node scripts/regression-testing/regression-pipeline.js

# Single execution
node scripts/regression-testing/regression-pipeline.js --trigger=manual
```

### Enabling Prevention

```bash
# Start regression prevention system
node scripts/regression-testing/regression-prevention.js

# One-time prevention check
node scripts/regression-testing/regression-prevention.js --check=commit
```

### Launching Dashboard

```bash
# Start monitoring dashboard
node scripts/regression-testing/regression-dashboard.js

# Custom port
node scripts/regression-testing/regression-dashboard.js --port=9000
```

## 📊 Test Types

### Unit Tests
- **Pattern**: `src/**/*.test.{ts,tsx,js,jsx}`
- **Framework**: Jest
- **Coverage**: Minimum 80%
- **Timeout**: 30 seconds

### Integration Tests
- **Pattern**: `tests/integration/**/*.test.{ts,tsx}`
- **Framework**: Jest + React Testing Library
- **Focus**: Component integration, API integration
- **Timeout**: 60 seconds

### E2E Tests
- **Pattern**: `tests/e2e/**/*.spec.{ts,js}`
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Timeout**: 120 seconds

### Performance Tests
- **Pattern**: `tests/performance/**/*.test.{ts,js}`
- **Metrics**: Lighthouse, Bundle size, Load time
- **Thresholds**: Configurable performance budgets
- **Timeout**: 180 seconds

### Visual Tests
- **Pattern**: `tests/visual/**/*.spec.{ts,js}`
- **Framework**: Playwright Visual Testing
- **Threshold**: 20% pixel difference
- **Timeout**: 60 seconds

### Security Tests
- **Pattern**: `tests/security/**/*.test.{ts,js}`
- **Checks**: Vulnerabilities, Dependencies, OWASP
- **Tools**: npm audit, OWASP ZAP
- **Timeout**: 60 seconds

## ⚙️ Configuration

### Environment Variables

```bash
# General
NODE_ENV=development|staging|production
REGRESSION_LOG_LEVEL=debug|info|warn|error

# Pipeline
REGRESSION_WEBHOOK_SECRET=your-webhook-secret

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Configuration File

Edit `regression-config.js` to customize:

```javascript
export const regressionConfig = {
    global: {
        timeout: 300000, // 5 minutes
        maxConcurrency: 4,
        retries: 2
    },
    testSuite: {
        thresholds: {
            passRate: 98,
            maxRegressions: 0,
            maxCoverageDecrease: 5
        }
    },
    prevention: {
        mechanisms: {
            preCommitChecks: { enabled: true, strict: true },
            qualityGates: { enabled: true, threshold: 80 }
        }
    }
};
```

## 🔧 Usage Examples

### Basic Test Execution

```bash
# Run all tests
npm run test:regression

# Run with coverage
npm run test:regression -- --coverage

# Run specific test type
npm run test:regression -- --type=unit

# Run with custom timeout
npm run test:regression -- --timeout=600000
```

### Pipeline Operations

```bash
# Start continuous testing
npm run test:regression:pipeline

# Trigger manual test run
npm run test:regression:trigger

# Stop current execution
npm run test:regression:stop
```

### Prevention System

```bash
# Enable prevention system
npm run test:regression:prevention

# Check for regressions
npm run test:regression:check

# Run pre-commit checks
npm run test:regression:pre-commit
```

## 📈 Dashboard

Access the regression testing dashboard at `http://localhost:8080`

### Features:
- **Real-time Monitoring**: Live test execution status
- **Historical Trends**: Test results over time
- **Performance Metrics**: Bundle size, load times, Lighthouse scores
- **Coverage Tracking**: Code coverage trends
- **Regression Alerts**: Immediate notifications for regressions
- **Test Management**: Trigger, stop, and configure tests

### API Endpoints:
- `GET /api/status` - Current system status
- `GET /api/results` - Latest test results
- `GET /api/metrics` - Performance metrics
- `POST /api/trigger` - Trigger test execution
- `POST /api/stop` - Stop current execution

## 🔍 Regression Detection

### Automatic Detection:
- **Component Changes**: Breaking changes in React components
- **API Changes**: Breaking changes in API endpoints
- **Performance Regressions**: Significant performance degradations
- **Visual Changes**: UI visual regressions
- **Coverage Drops**: Test coverage decreases

### Prevention Mechanisms:
- **Pre-commit Checks**: Block commits with high regression risk
- **Quality Gates**: Enforce quality thresholds
- **Performance Budgets**: Prevent performance degradations
- **Breaking Change Detection**: Detect API/component breaking changes

## 🚨 Alerts & Notifications

### Notification Channels:
- **Console**: Real-time console output
- **Slack**: Integration with Slack webhooks
- **Email**: SMTP email notifications
- **Dashboard**: Real-time dashboard alerts

### Alert Conditions:
- **Regressions Detected**: Any regression found
- **Test Failures**: Test execution failures
- **Performance Issues**: Performance threshold breaches
- **Coverage Drops**: Coverage below threshold

## 📚 Integration

### CI/CD Integration

#### GitHub Actions
```yaml
name: Regression Tests
on: [push, pull_request]
jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run regression tests
        run: node scripts/regression-testing/regression-test-suite.js
```

#### GitLab CI
```yaml
regression_tests:
  stage: test
  script:
    - npm ci
    - node scripts/regression-testing/regression-test-suite.js
  artifacts:
    reports:
      junit: test-results/regression/reports/junit/*.xml
```

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit
node scripts/regression-testing/regression-prevention.js --check=commit
```

## 🛡️ Security

### Security Checks:
- **Vulnerability Scanning**: npm audit, Snyk
- **Dependency Security**: Check for known vulnerabilities
- **OWASP Testing**: Common security issues
- **Code Analysis**: Static security analysis

### Best Practices:
- Regular security test execution
- Automated vulnerability scanning
- Dependency update monitoring
- Security regression prevention

## 🔧 Troubleshooting

### Common Issues:

#### Tests Failing
```bash
# Check test configuration
node scripts/regression-testing/regression-config.js --validate

# Run with verbose output
node scripts/regression-testing/regression-test-suite.js --verbose

# Check specific test type
node scripts/regression-testing/regression-test-suite.js --type=unit --debug
```

#### Pipeline Issues
```bash
# Check pipeline status
node scripts/regression-testing/regression-pipeline.js --status

# Restart pipeline
node scripts/regression-testing/regression-pipeline.js --restart

# Check logs
tail -f test-results/regression/logs/pipeline.log
```

#### Prevention System Issues
```bash
# Check prevention system status
node scripts/regression-testing/regression-prevention.js --status

# Disable strict mode temporarily
node scripts/regression-testing/regression-prevention.js --strict=false

# Check prevention logs
tail -f test-results/regression/prevention/logs/prevention.log
```

## 📊 Metrics & Reporting

### Key Metrics:
- **Pass Rate**: Percentage of tests passing
- **Regression Count**: Number of regressions detected
- **Coverage**: Code coverage percentage
- **Performance**: Bundle size, load times
- **Stability**: Test flakiness rate

### Report Formats:
- **HTML**: Interactive HTML reports
- **JSON**: Machine-readable JSON reports
- **JUnit**: CI/CD compatible XML reports
- **Dashboard**: Real-time web dashboard

## 🚀 Advanced Features

### Machine Learning Integration:
- **Pattern Recognition**: Identify regression patterns
- **Risk Assessment**: Predict regression likelihood
- **Auto-fixing**: Automatic fix suggestions
- **Intelligent Alerts**: Reduce false positives

### Agent Optimization:
- **Agent-friendly APIs**: Designed for AI agent interaction
- **Automated Responses**: Intelligent test management
- **Context-aware Testing**: Adaptive test execution
- **Self-healing Tests**: Automatic test maintenance

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all regression tests pass
5. Submit a pull request

## 📄 License

This regression testing framework is part of the atoms.tech project and follows the same license terms.

## 🆘 Support

For issues, questions, or contributions:
- Open an issue in the repository
- Check the troubleshooting section
- Review the configuration documentation
- Contact the development team

---

**Note**: This framework is designed to work with the existing test infrastructure and can be gradually adopted alongside current testing practices.