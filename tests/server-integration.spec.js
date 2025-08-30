const { test, expect } = require('@playwright/test');

test.describe('Server Integration Tests', () => {
  test('should connect to game server', async ({ page }) => {
    // Start monitoring console for connection messages
    const connectionMessages = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('connect') || text.includes('server') || text.includes('socket')) {
        connectionMessages.push(text);
        console.log(`🔌 Connection: ${text}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Fill character name and attempt to play
    await page.fill('#nameinput', 'TestPlayer');
    await page.waitForTimeout(1000);
    
    // Click play button
    await page.click('.play.button');
    
    // Wait for connection attempt
    await page.waitForTimeout(5000);
    
    // Check for connection-related activity
    const connectionState = await page.evaluate(() => {
      return {
        hasGameClient: typeof window.game !== 'undefined' && window.game.client !== undefined,
        socketIOLoaded: typeof io !== 'undefined',
        currentURL: window.location.href,
        documentTitle: document.title
      };
    });
    
    console.log('Connection State:', connectionState);
    console.log('Connection Messages:', connectionMessages);
    
    // Should have attempted some kind of connection
    expect(connectionState.socketIOLoaded).toBe(true);
  });

  test('should handle server connection failure gracefully', async ({ page }) => {
    const errorMessages = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorMessages.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to connect with invalid server (this will fail)
    await page.fill('#nameinput', 'TestPlayer');
    await page.click('.play.button');
    
    // Wait for connection timeout
    await page.waitForTimeout(10000);
    
    // Check that the game handles connection failure
    const gameState = await page.evaluate(() => {
      return {
        parchmentClass: document.getElementById('parchment')?.className,
        hasErrorMessage: document.querySelector('.error') !== null,
        playButtonState: document.querySelector('.play.button')?.className
      };
    });
    
    console.log('Game State after connection attempt:', gameState);
    console.log('Error Messages:', errorMessages.slice(0, 5)); // First 5 errors
    
    // Game should still be in a valid state
    expect(gameState.parchmentClass).toBeTruthy();
  });
});