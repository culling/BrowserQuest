const { test, expect } = require('@playwright/test');

test.describe('Console Error Detection', () => {
  let consoleErrors = [];
  let consoleWarnings = [];

  test.beforeEach(async ({ page }) => {
    // Reset arrays for each test
    consoleErrors = [];
    consoleWarnings = [];

    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        consoleErrors.push({ type, text, location: msg.location() });
        console.log(`❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push({ type, text });
        console.log(`⚠️  Console Warning: ${text}`);
      }
    });

    // Capture unhandled errors
    page.on('pageerror', error => {
      consoleErrors.push({ 
        type: 'pageerror', 
        text: error.message, 
        stack: error.stack 
      });
      console.log(`💥 Page Error: ${error.message}`);
    });
  });

  test('should load game without console errors', async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    
    // Wait for initial page load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for all scripts to execute
    await page.waitForTimeout(3000);
    
    // Check for critical console errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.text.includes('favicon') && // Ignore favicon errors
      !error.text.includes('socket.io') && // Ignore socket connection errors during testing
      error.type !== 'warning'
    );
    
    if (criticalErrors.length > 0) {
      console.log('\n📋 Critical Errors Found:');
      criticalErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
        if (error.stack) console.log(`   Stack: ${error.stack}`);
        if (error.location) console.log(`   Location: ${JSON.stringify(error.location)}`);
      });
    }
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should detect missing JavaScript files', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for 404 errors on JavaScript files
    const jsErrors = consoleErrors.filter(error => 
      error.text.includes('.js') && 
      (error.text.includes('404') || error.text.includes('Failed to fetch') || error.text.includes('net::ERR'))
    );
    
    if (jsErrors.length > 0) {
      console.log('\n📋 Missing JavaScript Files:');
      jsErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
      });
    }
    
    expect(jsErrors).toHaveLength(0);
  });

  test('should detect MIME type errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for MIME type errors
    const mimeErrors = consoleErrors.filter(error => 
      error.text.includes('MIME type') && 
      error.text.includes('not executable')
    );
    
    if (mimeErrors.length > 0) {
      console.log('\n📋 MIME Type Errors:');
      mimeErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
      });
    }
    
    expect(mimeErrors).toHaveLength(0);
  });

  test('should detect RequireJS errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for RequireJS to load modules
    
    // Check for RequireJS specific errors
    const requireJSErrors = consoleErrors.filter(error => 
      error.text.includes('requirejs') || 
      error.text.includes('Script error') ||
      error.text.includes('Module name') ||
      error.text.includes('Load timeout')
    );
    
    if (requireJSErrors.length > 0) {
      console.log('\n📋 RequireJS Errors:');
      requireJSErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
      });
    }
    
    expect(requireJSErrors).toHaveLength(0);
  });

  test.afterEach(async () => {
    // Summary report
    console.log(`\n📊 Test Summary:`);
    console.log(`   Errors: ${consoleErrors.length}`);
    console.log(`   Warnings: ${consoleWarnings.length}`);
    
    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  Warnings (non-blocking):');
      consoleWarnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.text}`);
      });
    }
  });
});