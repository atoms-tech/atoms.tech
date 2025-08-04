#!/usr/bin/env node

/**
 * Load Testing CLI
 * Command-line interface for running load tests
 */

const { program } = require('commander');
const path = require('path');
const chalk = require('chalk');
const LoadTestOrchestrator = require('./load-test-orchestrator');

// CLI Configuration
program
  .name('load-test')
  .description('Comprehensive load testing suite for Atoms.tech')
  .version('1.0.0')
  .option('-u, --url <url>', 'Base URL for testing', process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000')
  .option('-o, --output <dir>', 'Output directory for results', './test-results/load-testing')
  .option('-q, --quiet', 'Quiet mode - minimal output')
  .option('-v, --verbose', 'Verbose mode - detailed output')
  .option('--no-recovery', 'Skip recovery time between tests');

// Memory Leak Detection Command
program
  .command('memory')
  .description('Run memory leak detection tests')
  .option('-d, --duration <duration>', 'Test duration', '15m')
  .option('--vus <number>', 'Virtual users', '25')
  .action(async (options) => {
    console.log(chalk.blue('🧠 Starting Memory Leak Detection Tests...'));
    
    const orchestrator = new LoadTestOrchestrator({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    try {
      const result = await orchestrator.runMemoryLeakDetection({
        duration: options.duration,
        vus: parseInt(options.vus)
      });
      
      if (result.success) {
        console.log(chalk.green('✅ Memory leak test completed successfully'));
      } else {
        console.log(chalk.red('❌ Memory leak test failed:', result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error running memory test:', error.message));
      process.exit(1);
    }
  });

// Concurrent Users Command
program
  .command('concurrent')
  .description('Run concurrent user simulation tests')
  .option('--max-users <number>', 'Maximum concurrent users', '500')
  .option('--step-size <number>', 'User increment step size', '50')
  .option('--step-duration <duration>', 'Duration per step', '2m')
  .action(async (options) => {
    console.log(chalk.blue('👥 Starting Concurrent User Simulation...'));
    
    const orchestrator = new LoadTestOrchestrator({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    try {
      const result = await orchestrator.runConcurrentUserSimulation({
        maxUsers: parseInt(options.maxUsers),
        stepSize: parseInt(options.stepSize),
        stepDuration: options.stepDuration
      });
      
      if (result.success) {
        console.log(chalk.green(`✅ Concurrent user test completed - handled ${options.maxUsers} users`));
      } else {
        console.log(chalk.red('❌ Concurrent user test failed:', result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error running concurrent test:', error.message));
      process.exit(1);
    }
  });

// Database Load Command
program
  .command('database')
  .description('Run database performance under load tests')
  .option('--vus <number>', 'Virtual users', '100')
  .option('-d, --duration <duration>', 'Test duration', '10m')
  .option('--read-write-ratio <ratio>', 'Read to write ratio (0-1)', '0.8')
  .action(async (options) => {
    console.log(chalk.blue('🗄️ Starting Database Load Testing...'));
    
    const orchestrator = new LoadTestOrchestrator({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    try {
      const result = await orchestrator.runDatabaseLoadTest({
        vus: parseInt(options.vus),
        duration: options.duration,
        readWriteRatio: parseFloat(options.readWriteRatio)
      });
      
      if (result.success) {
        console.log(chalk.green('✅ Database load test completed successfully'));
      } else {
        console.log(chalk.red('❌ Database load test failed:', result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error running database test:', error.message));
      process.exit(1);
    }
  });

// Endurance Testing Command
program
  .command('endurance')
  .description('Run endurance tests for extended periods')
  .option('-d, --duration <duration>', 'Test duration', '2h')
  .option('--vus <number>', 'Virtual users', '15')
  .action(async (options) => {
    console.log(chalk.blue('⏰ Starting Endurance Testing...'));
    console.log(chalk.yellow(`⚠️  This test will run for ${options.duration} - ensure system stability`));
    
    const orchestrator = new LoadTestOrchestrator({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    try {
      const result = await orchestrator.runEnduranceTest({
        duration: options.duration,
        vus: parseInt(options.vus)
      });
      
      if (result.success) {
        console.log(chalk.green(`✅ Endurance test completed successfully - ran for ${options.duration}`));
      } else {
        console.log(chalk.red('❌ Endurance test failed:', result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error running endurance test:', error.message));
      process.exit(1);
    }
  });

// K6 Specific Commands
const k6Command = program
  .command('k6')
  .description('Run K6 load tests');

k6Command
  .command('smoke')
  .description('Run K6 smoke test')
  .action(async () => {
    console.log(chalk.blue('💨 Running K6 Smoke Test...'));
    const K6LoadTesting = require('./k6-setup');
    const k6 = new K6LoadTesting({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    const result = await k6.runK6Test('smoke', program.opts());
    if (result?.success) {
      console.log(chalk.green('✅ K6 smoke test completed'));
    } else {
      console.log(chalk.red('❌ K6 smoke test failed'));
      process.exit(1);
    }
  });

k6Command
  .command('load')
  .description('Run K6 load test')
  .action(async () => {
    console.log(chalk.blue('📈 Running K6 Load Test...'));
    const K6LoadTesting = require('./k6-setup');
    const k6 = new K6LoadTesting({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    const result = await k6.runK6Test('load', program.opts());
    if (result?.success) {
      console.log(chalk.green('✅ K6 load test completed'));
    } else {
      console.log(chalk.red('❌ K6 load test failed'));
      process.exit(1);
    }
  });

k6Command
  .command('stress')
  .description('Run K6 stress test')
  .action(async () => {
    console.log(chalk.blue('🔥 Running K6 Stress Test...'));
    const K6LoadTesting = require('./k6-setup');
    const k6 = new K6LoadTesting({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    const result = await k6.runK6Test('stress', program.opts());
    if (result?.success) {
      console.log(chalk.green('✅ K6 stress test completed'));
    } else {
      console.log(chalk.red('❌ K6 stress test failed'));
      process.exit(1);
    }
  });

k6Command
  .command('spike')
  .description('Run K6 spike test')
  .action(async () => {
    console.log(chalk.blue('⚡ Running K6 Spike Test...'));
    const K6LoadTesting = require('./k6-setup');
    const k6 = new K6LoadTesting({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    const result = await k6.runK6Test('spike', program.opts());
    if (result?.success) {
      console.log(chalk.green('✅ K6 spike test completed'));
    } else {
      console.log(chalk.red('❌ K6 spike test failed'));
      process.exit(1);
    }
  });

k6Command
  .command('all')
  .description('Run all K6 test scenarios')
  .option('-s, --scenarios <scenarios>', 'Comma-separated scenarios', 'smoke,load,stress')
  .action(async (options) => {
    console.log(chalk.blue('🎯 Running All K6 Tests...'));
    const K6LoadTesting = require('./k6-setup');
    const k6 = new K6LoadTesting({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    const scenarios = options.scenarios.split(',');
    const results = await k6.runAllScenarios({ 
      scenarios, 
      ...program.opts() 
    });
    
    const successCount = Object.values(results).filter(r => r?.success).length;
    const totalCount = Object.keys(results).length;
    
    if (successCount === totalCount) {
      console.log(chalk.green(`✅ All K6 tests completed successfully (${successCount}/${totalCount})`));
    } else {
      console.log(chalk.red(`❌ Some K6 tests failed (${successCount}/${totalCount})`));
      process.exit(1);
    }
  });

// Artillery Specific Commands
const artilleryCommand = program
  .command('artillery')
  .description('Run Artillery load tests');

artilleryCommand
  .command('smoke')
  .description('Run Artillery smoke test')
  .action(async () => {
    console.log(chalk.blue('💨 Running Artillery Smoke Test...'));
    const ArtilleryLoadTesting = require('./artillery-setup');
    const artillery = new ArtilleryLoadTesting({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    const result = await artillery.runArtilleryTest('smoke', program.opts());
    if (result?.success) {
      console.log(chalk.green('✅ Artillery smoke test completed'));
    } else {
      console.log(chalk.red('❌ Artillery smoke test failed'));
      process.exit(1);
    }
  });

artilleryCommand
  .command('load')
  .description('Run Artillery load test')
  .action(async () => {
    console.log(chalk.blue('📈 Running Artillery Load Test...'));
    const ArtilleryLoadTesting = require('./artillery-setup');
    const artillery = new ArtilleryLoadTesting({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    const result = await artillery.runArtilleryTest('load', program.opts());
    if (result?.success) {
      console.log(chalk.green('✅ Artillery load test completed'));
    } else {
      console.log(chalk.red('❌ Artillery load test failed'));
      process.exit(1);
    }
  });

artilleryCommand
  .command('stress')
  .description('Run Artillery stress test')
  .action(async () => {
    console.log(chalk.blue('🔥 Running Artillery Stress Test...'));
    const ArtilleryLoadTesting = require('./artillery-setup');
    const artillery = new ArtilleryLoadTesting({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    const result = await artillery.runArtilleryTest('stress', program.opts());
    if (result?.success) {
      console.log(chalk.green('✅ Artillery stress test completed'));
    } else {
      console.log(chalk.red('❌ Artillery stress test failed'));
      process.exit(1);
    }
  });

// Comprehensive Testing Command
program
  .command('comprehensive')
  .description('Run comprehensive load testing suite')
  .option('--include-endurance', 'Include endurance testing (adds significant time)')
  .option('--memory-duration <duration>', 'Memory test duration', '15m')
  .option('--memory-vus <number>', 'Memory test virtual users', '25')
  .option('--concurrent-max-users <number>', 'Max concurrent users', '500')
  .option('--database-vus <number>', 'Database test virtual users', '100')
  .option('--database-duration <duration>', 'Database test duration', '10m')
  .option('--endurance-duration <duration>', 'Endurance test duration', '2h')
  .action(async (options) => {
    console.log(chalk.blue('🎯 Starting Comprehensive Load Testing Suite...'));
    console.log(chalk.yellow('⚠️  This will run multiple intensive tests - ensure system readiness'));
    
    const orchestrator = new LoadTestOrchestrator({
      baseUrl: program.opts().url,
      outputDir: program.opts().output
    });
    
    const testOptions = {
      includeEndurance: options.includeEndurance,
      memory: {
        duration: options.memoryDuration,
        vus: parseInt(options.memoryVus)
      },
      concurrent: {
        maxUsers: parseInt(options.concurrentMaxUsers)
      },
      database: {
        vus: parseInt(options.databaseVus),
        duration: options.databaseDuration
      },
      endurance: {
        duration: options.enduranceDuration
      }
    };
    
    try {
      const result = await orchestrator.runComprehensiveLoadTesting(testOptions);
      
      console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
      console.log(chalk.cyan(`Total Tests: ${result.summary.total}`));
      console.log(chalk.green(`Passed: ${result.summary.passed}`));
      console.log(chalk.red(`Failed: ${result.summary.failed}`));
      console.log(chalk.blue(`Success Rate: ${result.summary.successRate.toFixed(1)}%`));
      console.log(chalk.magenta(`Total Time: ${(result.totalTime / 1000 / 60).toFixed(2)} minutes`));
      console.log(chalk.yellow(`Report: ${result.reportPath}`));
      
      if (result.success) {
        console.log(chalk.green('\n🎉 All comprehensive tests completed successfully!'));
      } else {
        console.log(chalk.red('\n❌ Some comprehensive tests failed - check the report for details'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error running comprehensive tests:', error.message));
      process.exit(1);
    }
  });

// Install Command
program
  .command('install')
  .description('Install load testing tools (K6, Artillery)')
  .option('--k6-only', 'Install only K6')
  .option('--artillery-only', 'Install only Artillery')
  .action(async (options) => {
    console.log(chalk.blue('📦 Installing Load Testing Tools...'));
    
    const { execSync } = require('child_process');
    
    try {
      if (!options.artilleryOnly) {
        console.log(chalk.yellow('Installing K6...'));
        
        // Generate and run K6 installation script
        const K6LoadTesting = require('./k6-setup');
        const k6 = new K6LoadTesting();
        const installScript = k6.generateInstallScript();
        
        execSync(`chmod +x ${installScript} && ${installScript}`, { stdio: 'inherit' });
        console.log(chalk.green('✅ K6 installed successfully'));
      }
      
      if (!options.k6Only) {
        console.log(chalk.yellow('Installing Artillery...'));
        execSync('npm install -g artillery', { stdio: 'inherit' });
        console.log(chalk.green('✅ Artillery installed successfully'));
      }
      
      console.log(chalk.green('\n🎉 Load testing tools installation completed!'));
      console.log(chalk.cyan('You can now run load tests using the CLI commands.'));
      
    } catch (error) {
      console.error(chalk.red('❌ Installation failed:', error.message));
      process.exit(1);
    }
  });

// Status Command
program
  .command('status')
  .description('Check load testing tools status')
  .action(() => {
    console.log(chalk.blue('🔍 Checking Load Testing Tools Status...\n'));
    
    const { execSync } = require('child_process');
    
    // Check K6
    try {
      const k6Version = execSync('k6 version', { encoding: 'utf-8' });
      console.log(chalk.green('✅ K6 is installed:'));
      console.log(chalk.gray(`   ${k6Version.trim()}`));
    } catch (error) {
      console.log(chalk.red('❌ K6 is not installed'));
      console.log(chalk.yellow('   Run: load-test install --k6-only'));
    }
    
    // Check Artillery
    try {
      const artilleryVersion = execSync('artillery version', { encoding: 'utf-8' });
      console.log(chalk.green('✅ Artillery is installed:'));
      console.log(chalk.gray(`   ${artilleryVersion.trim()}`));
    } catch (error) {
      console.log(chalk.red('❌ Artillery is not installed'));
      console.log(chalk.yellow('   Run: load-test install --artillery-only'));
    }
    
    // Check Node.js version
    console.log(chalk.blue('📋 System Information:'));
    console.log(chalk.gray(`   Node.js: ${process.version}`));
    console.log(chalk.gray(`   Platform: ${process.platform}`));
    console.log(chalk.gray(`   Architecture: ${process.arch}`));
    
    // Check output directory
    const fs = require('fs');
    const outputDir = program.opts().output || './test-results/load-testing';
    if (fs.existsSync(outputDir)) {
      console.log(chalk.green(`✅ Output directory exists: ${outputDir}`));
    } else {
      console.log(chalk.yellow(`⚠️  Output directory will be created: ${outputDir}`));
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});

// Help enhancement
program.on('--help', () => {
  console.log('');
  console.log(chalk.blue('Examples:'));
  console.log('  $ load-test memory --duration 30m --vus 50');
  console.log('  $ load-test concurrent --max-users 1000');
  console.log('  $ load-test k6 all --scenarios smoke,load,stress');
  console.log('  $ load-test comprehensive --include-endurance');
  console.log('  $ load-test install');
  console.log('  $ load-test status');
  console.log('');
  console.log(chalk.blue('Environment Variables:'));
  console.log('  LOAD_TEST_BASE_URL    Base URL for testing (default: http://localhost:3000)');
  console.log('');
});

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}