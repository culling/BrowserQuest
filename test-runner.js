#!/usr/bin/env node

/**
 * BrowserQuest Test Runner
 * Automated testing system with server management
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.servers = [];
    this.testResults = {
      console: null,
      game: null,
      server: null,
      summary: null
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  startServer(command, name, port) {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Starting ${name}...`);
      
      const server = spawn('node', command.split(' ').slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('listening') || output.includes('started')) {
          console.log(`✅ ${name} started successfully`);
          resolve(server);
        }
      });

      server.stderr.on('data', (data) => {
        console.log(`${name} stderr: ${data}`);
      });

      server.on('error', (error) => {
        console.error(`❌ Failed to start ${name}:`, error);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!server.killed) {
          console.log(`⏰ ${name} started (timeout reached)`);
          resolve(server);
        }
      }, 10000);

      this.servers.push({ process: server, name, port });
    });
  }

  async stopServers() {
    console.log('🛑 Stopping servers...');
    for (const server of this.servers) {
      try {
        server.process.kill('SIGTERM');
        console.log(`✅ Stopped ${server.name}`);
      } catch (error) {
        console.log(`⚠️  Error stopping ${server.name}:`, error.message);
      }
    }
    this.servers = [];
  }

  async runPlaywrightTest(testFile, testName) {
    return new Promise((resolve) => {
      console.log(`🧪 Running ${testName} tests...`);
      
      const testProcess = spawn('npx', ['playwright', 'test', testFile, '--reporter=line'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text.trim());
      });

      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error(text.trim());
      });

      testProcess.on('close', (code) => {
        const result = {
          success: code === 0,
          output: output,
          errors: errorOutput,
          exitCode: code
        };
        
        console.log(code === 0 ? 
          `✅ ${testName} tests completed successfully` : 
          `❌ ${testName} tests failed with code ${code}`
        );
        
        resolve(result);
      });
    });
  }

  async runAllTests() {
    console.log('🎯 BrowserQuest Test Suite Starting...\n');

    try {
      // Start servers
      await this.startServer('node server/js/main.js', 'Game Server', 8000);
      await this.delay(2000);
      
      await this.startServer('node client-server.js', 'Client Server', 3000);
      await this.delay(3000);

      console.log('🌐 Servers are running, starting tests...\n');

      // Run tests
      this.testResults.console = await this.runPlaywrightTest('tests/console-errors.spec.js', 'Console Errors');
      this.testResults.game = await this.runPlaywrightTest('tests/game-functionality.spec.js', 'Game Functionality');
      this.testResults.server = await this.runPlaywrightTest('tests/server-integration.spec.js', 'Server Integration');

      // Generate summary
      this.generateSummary();

    } catch (error) {
      console.error('💥 Test suite failed:', error);
    } finally {
      await this.stopServers();
    }
  }

  generateSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const tests = [
      { name: 'Console Errors', result: this.testResults.console },
      { name: 'Game Functionality', result: this.testResults.game },
      { name: 'Server Integration', result: this.testResults.server }
    ];

    let totalTests = 0;
    let passedTests = 0;

    tests.forEach(test => {
      const status = test.result?.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${test.name}: ${status}`);
      
      totalTests++;
      if (test.result?.success) passedTests++;
    });

    console.log(`\nResults: ${passedTests}/${totalTests} test suites passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check the output above for details.');
    }

    console.log('\n💡 Run individual tests:');
    console.log('  npm run test:console  - Console error detection');
    console.log('  npm run test:game     - Game functionality tests');
    console.log('  npm run test:server   - Server integration tests');
    console.log('  npm run test:report   - View detailed HTML report');
  }

  async quickConsoleCheck() {
    console.log('🔍 Quick Console Error Check...\n');
    
    try {
      await this.startServer('node client-server.js', 'Client Server', 3000);
      await this.delay(2000);
      
      const result = await this.runPlaywrightTest('tests/console-errors.spec.js', 'Console Errors');
      
      if (result.success) {
        console.log('✅ No console errors detected!');
      } else {
        console.log('❌ Console errors found. Run full test suite for details.');
      }
      
    } finally {
      await this.stopServers();
    }
  }
}

// Command line interface
const command = process.argv[2];
const runner = new TestRunner();

switch (command) {
  case 'console':
    runner.quickConsoleCheck();
    break;
  case 'full':
  default:
    runner.runAllTests();
    break;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down test runner...');
  await runner.stopServers();
  process.exit(0);
});