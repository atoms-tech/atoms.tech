#!/usr/bin/env node

/**
 * Baseline Screenshot Generation Script
 * 
 * This script generates baseline screenshots for visual regression testing.
 * It ensures consistent environment setup and proper screenshot generation.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const VISUAL_TEST_DIR = path.join(PROJECT_ROOT, 'tests/visual');
const BASELINE_DIR = path.join(PROJECT_ROOT, 'test-results/visual-baselines');

console.log('🖼️  Visual Regression Testing - Baseline Generation');
console.log('================================================');

// Ensure directories exist
if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

// Environment setup
console.log('\n🔧 Setting up environment...');
process.env.NODE_ENV = 'test';
process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = 'false';

// Install Playwright browsers if needed
console.log('📦 Installing Playwright browsers...');
try {
    execSync('npx playwright install --with-deps', { stdio: 'inherit' });
    console.log('✅ Playwright browsers installed successfully');
} catch (error) {
    console.error('❌ Failed to install Playwright browsers:', error.message);
    process.exit(1);
}

// Start the development server
console.log('\n🚀 Starting development server...');
const devServer = require('child_process').spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
});

let serverReady = false;
let serverOutput = '';

devServer.stdout.on('data', (data) => {
    serverOutput += data.toString();
    if (data.toString().includes('Ready') || data.toString().includes('localhost:3000')) {
        serverReady = true;
    }
});

devServer.stderr.on('data', (data) => {
    console.log('Server stderr:', data.toString());
});

// Wait for server to be ready
console.log('⏳ Waiting for development server to be ready...');
const maxWaitTime = 120000; // 2 minutes
const startTime = Date.now();

while (!serverReady && (Date.now() - startTime) < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 1000));
}

if (!serverReady) {
    console.error('❌ Development server failed to start within timeout');
    process.kill(-devServer.pid);
    process.exit(1);
}

console.log('✅ Development server is ready');

// Generate baseline screenshots
console.log('\n📸 Generating baseline screenshots...');

const testCategories = [
    {
        name: 'UI Components',
        path: 'tests/visual/components/ui-components.spec.ts',
        description: 'Core UI component screenshots'
    },
    {
        name: 'Custom Components',
        path: 'tests/visual/components/custom-components.spec.ts',
        description: 'Custom application component screenshots'
    },
    {
        name: 'Theme Variants',
        path: 'tests/visual/themes/theme-variants.spec.ts',
        description: 'Light and dark theme screenshots'
    },
    {
        name: 'Responsive Layouts',
        path: 'tests/visual/layouts/responsive-layouts.spec.ts',
        description: 'Responsive design screenshots'
    },
    {
        name: 'Interactive States',
        path: 'tests/visual/interactions/interactive-states.spec.ts',
        description: 'Interactive state screenshots'
    }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const category of testCategories) {
    console.log(`\n🔍 Generating ${category.name}...`);
    console.log(`   ${category.description}`);
    
    try {
        const result = execSync(
            `npx playwright test --config=tests/visual/visual.config.ts --update-snapshots "${category.path}"`,
            {
                stdio: 'pipe',
                encoding: 'utf8',
                cwd: PROJECT_ROOT
            }
        );
        
        // Parse test results
        const testResults = result.match(/(\d+) passed/);
        if (testResults) {
            const categoryPassed = parseInt(testResults[1]);
            passedTests += categoryPassed;
            totalTests += categoryPassed;
            console.log(`   ✅ ${categoryPassed} screenshots generated`);
        }
        
    } catch (error) {
        console.error(`   ❌ Failed to generate ${category.name}:`, error.message);
        failedTests++;
        totalTests++;
    }
}

// Generate summary report
console.log('\n📊 Baseline Generation Summary');
console.log('===============================');
console.log(`Total Categories: ${testCategories.length}`);
console.log(`Successful: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Total Screenshots: ${totalTests}`);

// Generate metadata file
const metadata = {
    generatedAt: new Date().toISOString(),
    totalCategories: testCategories.length,
    successfulCategories: passedTests,
    failedCategories: failedTests,
    totalScreenshots: totalTests,
    categories: testCategories.map(cat => ({
        name: cat.name,
        description: cat.description,
        path: cat.path
    })),
    environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd()
    }
};

fs.writeFileSync(
    path.join(BASELINE_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
);

console.log(`\n📄 Metadata saved to: ${path.join(BASELINE_DIR, 'metadata.json')}`);

// Cleanup
console.log('\n🧹 Cleaning up...');
try {
    process.kill(-devServer.pid);
    console.log('✅ Development server stopped');
} catch (error) {
    console.log('⚠️  Development server may still be running');
}

// Final status
if (failedTests === 0) {
    console.log('\n🎉 All baseline screenshots generated successfully!');
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Review the generated screenshots in: ${BASELINE_DIR}`);
    console.log(`   2. Commit the baseline screenshots to version control`);
    console.log(`   3. Run: npm run test:visual to verify the baselines`);
    process.exit(0);
} else {
    console.log('\n⚠️  Some baseline generation failed. Please review the errors above.');
    process.exit(1);
}

// Helper function to wait for async operations
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}