const { test, expect } = require('@playwright/test');

test.describe('BrowserQuest Game', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the client webpage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the client webpage', async ({ page }) => {
    // Check if the main game container is present
    await expect(page.locator('#container')).toBeVisible();
    
    // Check if the BrowserQuest title/logo is visible
    const titleElements = [
      page.locator('h1:has-text("BrowserQuest")'),
      page.locator('.logo'),
      page.locator('#logo'),
      page.locator('[class*="title"]'),
      page.locator('[id*="title"]')
    ];
    
    // At least one of these title elements should be visible
    let titleFound = false;
    for (const element of titleElements) {
      try {
        await expect(element).toBeVisible({ timeout: 1000 });
        titleFound = true;
        break;
      } catch (error) {
        // Continue to next element
      }
    }
    
    // If no specific title found, just verify the page loaded properly
    if (!titleFound) {
      // Verify the page has loaded by checking for canvas or game elements
      const gameElements = [
        page.locator('canvas'),
        page.locator('#game'),
        page.locator('#gamearea'),
        page.locator('.game')
      ];
      
      let gameElementFound = false;
      for (const element of gameElements) {
        try {
          await expect(element).toBeVisible({ timeout: 1000 });
          gameElementFound = true;
          break;
        } catch (error) {
          // Continue to next element
        }
      }
      
      expect(gameElementFound).toBe(true);
    }
    
    // Verify page title contains game name
    await expect(page).toHaveTitle(/BrowserQuest|Browser Quest/i);
  });

  test('should be able to enter name', async ({ page }) => {
    // Wait for the name input field to be visible
    const nameInput = page.locator('#nameinput');
    await expect(nameInput).toBeVisible();
    
    // Verify placeholder text
    await expect(nameInput).toHaveAttribute('placeholder', 'Name your character');
    
    // Enter a test name
    await nameInput.fill('TestPlayer');
    
    // Verify the name was entered
    await expect(nameInput).toHaveValue('TestPlayer');
    
    // Verify maxlength attribute
    await expect(nameInput).toHaveAttribute('maxlength', '15');
    
    // Test maxlength by entering a longer name
    await nameInput.fill('ThisIsAVeryLongNameThatExceedsLimit');
    const actualValue = await nameInput.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(15);
  });

  test('should display Play button', async ({ page }) => {
    // The Play button should be visible but initially disabled
    const playButton = page.locator('#createcharacter .play.button');
    await expect(playButton).toBeVisible();
    
    // Initially the button should have the disabled class
    await expect(playButton).toHaveClass(/disabled/);
    
    // The button should contain a loading spinner image (even if hidden by CSS)
    const spinner = playButton.locator('img[src*="spinner.gif"]');
    await expect(spinner).toHaveCount(1); // Verify the element exists
  });

  test('should display game interface elements', async ({ page }) => {
    // Check for common game UI elements that should be present
    const uiElements = [
      '#container',
      'canvas',
      '#game',
      '.ui',
      '#ui'
    ];
    
    let foundUIElement = false;
    for (const selector of uiElements) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        foundUIElement = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    expect(foundUIElement).toBe(true);
    
    // Verify the page loads without JavaScript errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Allow some common, non-critical errors but fail on serious ones
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_FAILED') &&
      error.includes('Error') || error.includes('TypeError') || error.includes('ReferenceError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});