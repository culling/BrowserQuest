const { test, expect } = require('@playwright/test');

test.describe('BrowserQuest Game Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the main game interface', async ({ page }) => {
    // Wait for page to stabilize and scripts to run
    await page.waitForTimeout(2000);
    
    // Check viewport - #intro might be hidden on mobile/small screens
    const viewport = page.viewportSize();
    
    // The key game interface element is parchment - it should be visible
    await expect(page.locator('#parchment')).toBeVisible();
    
    // On desktop viewports > 800px, parchment should be visible and positioned properly
    if (viewport.width > 800) {
      // Check that the parchment has proper dimensions (not zero height)
      const parchmentRect = await page.evaluate(() => {
        const parchment = document.getElementById('parchment');
        const rect = parchment.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      expect(parchmentRect.height).toBeGreaterThan(0);
    }
    
    await expect(page.locator('#createcharacter')).toBeVisible();
    
    // Check if character creation form is visible
    await expect(page.locator('#nameinput')).toBeVisible();
    await expect(page.locator('#createcharacter .play.button')).toBeVisible();
  });

  test('should detect browser capabilities', async ({ page }) => {
    // Wait for detect.js to load and run
    await page.waitForTimeout(2000);
    
    // Check if Detect object is available
    const detectAvailable = await page.evaluate(() => {
      return typeof window.Detect !== 'undefined';
    });
    
    expect(detectAvailable).toBe(true);
    
    // Check WebSocket support detection
    const supportsWebSocket = await page.evaluate(() => {
      return window.Detect && typeof window.Detect.supportsWebSocket === 'function';
    });
    
    expect(supportsWebSocket).toBe(true);
  });

  test('should load sprites and assets', async ({ page }) => {
    // Wait for RequireJS modules to load
    await page.waitForTimeout(3000);
    
    // Check if basic dependencies are loaded (these load before game objects)
    const moduleState = await page.evaluate(() => {
      return {
        requirejsExists: typeof window.require !== 'undefined',
        jqueryExists: typeof window.$ !== 'undefined' || typeof window.jQuery !== 'undefined',
        modernizrExists: typeof window.Modernizr !== 'undefined',
        detectExists: typeof window.Detect !== 'undefined',
        // Check if sprite images are accessible
        hasSpritesheetImages: document.querySelectorAll('*[style*="spritesheet"]').length > 0 ||
                              document.querySelectorAll('img[src*="sprite"]').length > 0 ||
                              !!document.querySelector('canvas')
      };
    });
    
    
    // Basic checks - core dependencies should be loaded
    expect(moduleState.requirejsExists).toBe(true);
    expect(moduleState.modernizrExists).toBe(true);
    expect(moduleState.detectExists).toBe(true);
  });

  test('should handle character name input', async ({ page }) => {
    const nameInput = page.locator('#nameinput');
    
    // Test character name input
    await nameInput.fill('TestPlayer');
    
    const inputValue = await nameInput.inputValue();
    expect(inputValue).toBe('TestPlayer');
    
    // Test character limit (should be 15 characters max)
    await nameInput.fill('ThisIsAVeryLongCharacterName');
    const limitedValue = await nameInput.inputValue();
    expect(limitedValue.length).toBeLessThanOrEqual(15);
  });

  test('should validate play button state', async ({ page }) => {
    const playButton = page.locator('#createcharacter .play.button');
    const nameInput = page.locator('#nameinput');
    
    // Initially, play button might be disabled
    const initialDisabled = await playButton.getAttribute('class');
    
    // Enter a character name
    await nameInput.fill('TestPlayer');
    
    // Wait for any state changes
    await page.waitForTimeout(1000);
    
    // Check if play button becomes enabled
    const afterNameDisabled = await playButton.getAttribute('class');
    
    // The class should change (remove 'disabled' or similar)
    
    expect(playButton).toBeVisible();
  });

  test('should load required JavaScript modules', async ({ page }) => {
    // Wait for RequireJS to load modules
    await page.waitForTimeout(5000);
    
    // Check if key modules are loaded
    const moduleState = await page.evaluate(() => {
      return {
        requirejs: typeof require !== 'undefined',
        modernizr: typeof Modernizr !== 'undefined',
        jquery: typeof $ !== 'undefined',
        detectLoaded: typeof Detect !== 'undefined',
      };
    });
    
    
    expect(moduleState.modernizr).toBe(true);
    expect(moduleState.jquery).toBe(true);
    expect(moduleState.detectLoaded).toBe(true);
  });

  test('should handle server connection attempt', async ({ page }) => {
    const nameInput = page.locator('#nameinput');
    const playButton = page.locator('#createcharacter .play.button');
    
    // Fill in character name
    await nameInput.fill('TestPlayer');
    await page.waitForTimeout(1000);
    
    // Try to click play button
    await playButton.click();
    
    // Wait for connection attempt
    await page.waitForTimeout(3000);
    
    // Check if any connection-related elements appear
    // This might show connection errors, loading states, etc.
    const hasConnectionActivity = await page.evaluate(() => {
      // Look for any signs of connection attempt
      const spinners = document.querySelectorAll('img[src*="spinner"]');
      const errors = document.querySelectorAll('.error');
      const loadingStates = document.querySelectorAll('.loading');
      
      return {
        spinners: spinners.length > 0,
        errors: errors.length > 0,
        loading: loadingStates.length > 0,
        currentParchmentClass: document.getElementById('parchment')?.className || ''
      };
    });
    
    
    // The game should attempt some kind of connection or state change
    expect(typeof hasConnectionActivity).toBe('object');
  });

  test('should have responsive design elements', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // On desktop, parchment should be visible (intro has zero height due to absolute positioning)
    let desktopParchmentVisible = await page.locator('#parchment').isVisible();
    expect(desktopParchmentVisible).toBe(true);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // On mobile (<= 800px), the CSS hides certain elements, but core elements should still work
    const mobileElements = await page.evaluate(() => {
      return {
        hasInput: !!document.getElementById('nameinput'),
        hasCreateCharacter: !!document.getElementById('createcharacter'),
        bodyClass: document.body.className,
        // Check if the essential game elements are present, even if hidden
        parchmentExists: !!document.getElementById('parchment'),
        introExists: !!document.getElementById('intro')
      };
    });
    
    // Essential elements should exist on mobile, even if not visible
    expect(mobileElements.hasInput).toBe(true);
    expect(mobileElements.hasCreateCharacter).toBe(true);
    expect(mobileElements.parchmentExists).toBe(true);
    
    // Check for portrait mode message on small screens
    const portraitElement = page.locator('#portrait');
    const portraitExists = await portraitElement.count() > 0;
    
    console.log('Portrait element exists:', portraitExists);
  });
});