#!/usr/bin/env node

/**
 * Test Configuration Validation Script
 * 
 * Validates that all test scripts and configurations are properly set up
 * and can execute without errors.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REQUIRED_SCRIPTS = [
    'test',
    'test:unit',
    'test:integration',
    'test:coverage',
    'test:all',
    'test:unit:coverage',
    'test:integration:coverage',
    'test:quick',
    'test:validate'
];

const REQUIRED_CONFIG_FILES = [
    'jest.config.mjs',
    'jest.integration.config.mjs',
    'playwright.config.ts'
];

const REQUIRED_DIRECTORIES = [
    'src/__tests__',
    'tests/integration',
    'tests/e2e',
    'test-results'
];

async function validateTestConfiguration() {
    console.log('🔍 Validating Test Configuration...\n');
    
    let allValid = true;
    const issues = [];

    // Check package.json scripts
    console.log('📋 Checking required test scripts...');
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const scripts = packageJson.scripts || {};
        
        for (const script of REQUIRED_SCRIPTS) {
            if (!scripts[script]) {
                issues.push(`❌ Missing script: ${script}`);
                allValid = false;
            } else {
                console.log(`✅ ${script}: ${scripts[script]}`);
            }
        }
    } catch (error) {
        issues.push(`❌ Error reading package.json: ${error.message}`);
        allValid = false;
    }

    // Check configuration files
    console.log('\n📄 Checking configuration files...');
    for (const configFile of REQUIRED_CONFIG_FILES) {
        if (!fs.existsSync(configFile)) {
            issues.push(`❌ Missing config file: ${configFile}`);
            allValid = false;
        } else {
            console.log(`✅ ${configFile} exists`);
        }
    }

    // Check required directories
    console.log('\n📁 Checking test directories...');
    for (const dir of REQUIRED_DIRECTORIES) {
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`✅ Created directory: ${dir}`);
            } catch (error) {
                issues.push(`❌ Could not create directory ${dir}: ${error.message}`);
                allValid = false;
            }
        } else {
            console.log(`✅ ${dir} exists`);
        }
    }

    // Test script execution (dry run)
    console.log('\n🧪 Testing script execution...');
    const testScripts = ['test:unit', 'test:integration'];
    
    for (const script of testScripts) {
        try {
            // Use --listTests to check if Jest can parse configuration without running tests
            console.log(`Testing ${script}...`);
            
            if (script === 'test:unit') {
                execSync('npx jest --config jest.config.mjs --listTests --testPathPatterns="src/.*\\.(test|spec)\\.(ts|tsx|js|jsx)$"', 
                    { stdio: 'pipe', timeout: 10000 });
            } else if (script === 'test:integration') {
                execSync('npx jest --config jest.integration.config.mjs --listTests', 
                    { stdio: 'pipe', timeout: 10000 });
            }
            
            console.log(`✅ ${script} configuration is valid`);
        } catch (error) {
            issues.push(`❌ ${script} configuration error: ${error.message}`);
            allValid = false;
        }
    }

    // Check Playwright configuration
    console.log('\n🎭 Testing Playwright configuration...');
    try {
        execSync('npx playwright test --list', { stdio: 'pipe', timeout: 15000 });
        console.log('✅ Playwright configuration is valid');
    } catch (error) {
        issues.push(`❌ Playwright configuration error: ${error.message}`);
        allValid = false;
    }

    // Generate report
    console.log('\n📊 Validation Summary:');
    console.log('========================');
    
    if (allValid) {
        console.log('🎉 All test configurations are valid!');
        console.log('\n✅ Available test commands:');
        console.log('  npm run test:unit          - Run unit tests');
        console.log('  npm run test:integration   - Run integration tests');
        console.log('  npm run test:coverage      - Run tests with coverage');
        console.log('  npm run test:all           - Run all test suites');
        console.log('  npm run test:quick         - Quick unit test run');
        console.log('  npm run test:validate      - Validate code and run unit tests');
        console.log('  npm run test:e2e           - Run end-to-end tests');
    } else {
        console.log('⚠️  Issues found:');
        issues.forEach(issue => console.log(`  ${issue}`));
        process.exit(1);
    }

    // Write validation results for agent consumption
    const validationResults = {
        timestamp: new Date().toISOString(),
        valid: allValid,
        issues: issues,
        checkedScripts: REQUIRED_SCRIPTS,
        checkedFiles: REQUIRED_CONFIG_FILES,
        checkedDirectories: REQUIRED_DIRECTORIES
    };

    fs.writeFileSync('test-results/validation/test-config-validation.json', 
        JSON.stringify(validationResults, null, 2));
    
    console.log('\n📄 Validation report saved to test-results/validation/test-config-validation.json');
}

// Ensure validation directory exists
if (!fs.existsSync('test-results/validation')) {
    fs.mkdirSync('test-results/validation', { recursive: true });
}

validateTestConfiguration().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
});