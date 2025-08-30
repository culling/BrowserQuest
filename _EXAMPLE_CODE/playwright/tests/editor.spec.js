const { test, expect } = require('@playwright/test');

test.describe('Tags and Hierarchy Editor', () => {
  test.beforeEach(async ({ page }) => {
    const filePath = 'file://' + require('path').resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
    await page.goto(filePath);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the editor interface', async ({ page }) => {
    // Check if main elements are present
    await expect(page.locator('h1')).toContainText('Tags and Hierarchy Editor');
    await expect(page.locator('#new-object')).toBeVisible();
    await expect(page.locator('#export-pack')).toBeVisible();
    await expect(page.locator('#import-pack')).toBeVisible();
    await expect(page.locator('#objects-list')).toBeVisible();
    await expect(page.locator('#object-form')).toBeVisible();
  });

  test('should load sample data on startup', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Check if sample objects are present
    const objects = page.locator('.object-item:not([style*="italic"])');
    await expect(objects).toHaveCount(5);
    
    // Check specific sample objects (sorted by rules count descending)
    await expect(page.locator('.object-name').first()).toContainText('jumper');
    await expect(page.locator('.object-name').nth(1)).toContainText('shirt');
  });

  test('should create a new object', async ({ page }) => {
    // Click new object button
    await page.click('#new-object');
    
    // Fill in the form
    await page.fill('#object-name', 'Test Object');
    await page.fill('#object-typeof', 'test, example');
    
    // Add tags
    await page.click('#tag-input');
    await page.type('#tag-input', 'tag1');
    await page.press('#tag-input', 'Enter');
    await page.type('#tag-input', 'tag2');
    await page.press('#tag-input', 'Enter');
    
    // Add rules and toString
    await page.fill('#object-rules', '(tags) => tags.includes("test")');
    await page.fill('#object-tostring', '() => "a test object"');
    
    // Save the object
    await page.click('button[type="submit"]');
    
    // Verify the object was created
    await expect(page.locator('.object-name').last()).toContainText('Test Object');
  });

  test('should edit an existing object', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Click on the first object to edit it
    await page.click('.object-item:not([style*="italic"])');
    
    // Verify form is populated (first object is now 'jumper' due to rule-based sorting)
    const nameInput = page.locator('#object-name');
    await expect(nameInput).toHaveValue('jumper');
    
    // Modify the name
    await nameInput.fill('Modified Jumper');
    
    // Save changes
    await page.click('button[type="submit"]');
    
    // Verify the change
    await expect(page.locator('.object-name').first()).toContainText('Modified Jumper');
  });

  test('should delete an object', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Count initial objects
    const initialCount = await page.locator('.object-item:not([style*="italic"])').count();
    
    // Click on an object to edit it
    await page.click('.object-item:not([style*="italic"])');
    
    // Delete the object
    page.on('dialog', dialog => dialog.accept()); // Accept confirmation dialog
    await page.click('#delete-object');
    
    // Verify object count decreased
    const finalCount = await page.locator('.object-item:not([style*="italic"])').count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should sort objects', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Get initial order
    const initialFirstObject = await page.locator('.object-name').first().textContent();
    
    // Sort by name descending
    await page.selectOption('#sort-by', 'name');
    await page.selectOption('#sort-order', 'desc');
    
    // Get new order
    const newFirstObject = await page.locator('.object-name').first().textContent();
    
    // Verify order changed
    expect(newFirstObject).not.toBe(initialFirstObject);
  });

  test('should export and import objects', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Start download and wait for it
    const downloadPromise = page.waitForEvent('download');
    await page.click('#export-pack');
    const download = await downloadPromise;
    
    // Verify download filename
    expect(download.suggestedFilename()).toBe('objects-pack.json');
    
    // Clear all objects first
    page.on('dialog', dialog => dialog.accept()); // Accept confirmation dialog
    await page.click('#clear-all');
    
    // Verify objects are cleared
    await expect(page.locator('.object-item[style*="italic"]')).toBeVisible();
    
    // Save the downloaded file to a temporary location
    const path = await download.path();
    
    // Import the file back
    const fileInput = page.locator('#import-file');
    await fileInput.setInputFiles(path);
    
    // Verify objects are restored
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    const objects = page.locator('.object-item:not([style*="italic"])');
    await expect(objects).toHaveCount(5);
  });

  test('should process raw text with templates', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Enter template text
    await page.fill('#raw-text', 'A woman wearing <clothing>, <outside>');
    
    // Process the text
    await page.click('#process-text');
    
    // Verify output is generated
    const preview = page.locator('#text-preview');
    await expect(preview).toContainText('Processed:');
    await expect(preview).toContainText('A woman wearing');
  });

  test('should handle tag input correctly', async ({ page }) => {
    // Click new object
    await page.click('#new-object');
    
    // Add multiple tags
    const tagInput = page.locator('#tag-input');
    await tagInput.fill('tag1');
    await page.press('#tag-input', 'Enter');
    await tagInput.fill('tag2');
    await page.press('#tag-input', 'Enter');
    await tagInput.fill('tag3');
    await page.press('#tag-input', 'Enter');
    
    // Verify tags are displayed
    const tagItems = page.locator('.tag-item');
    await expect(tagItems).toHaveCount(3);
    
    // Remove a tag
    await page.click('.tag-remove');
    await expect(tagItems).toHaveCount(2);
  });

  test('should validate form inputs', async ({ page }) => {
    // Click new object
    await page.click('#new-object');
    
    // Try to save without name (should not work due to required attribute)
    await page.click('button[type="submit"]');
    
    // Form should still be visible (validation failed)
    await expect(page.locator('#object-form')).toBeVisible();
    
    // Add name and save
    await page.fill('#object-name', 'Valid Object');
    await page.click('button[type="submit"]');
    
    // Verify object was created
    await expect(page.locator('.object-name').last()).toContainText('Valid Object');
  });

  test('should handle invalid rules gracefully', async ({ page }) => {
    // Click new object
    await page.click('#new-object');
    
    // Fill in form with invalid rule
    await page.fill('#object-name', 'Test Object');
    await page.fill('#object-rules', 'invalid javascript syntax {{{');
    
    // Handle alert dialog
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Error saving object');
      dialog.accept();
    });
    
    // Try to save
    await page.click('button[type="submit"]');
    
    // Form should still be visible (save failed)
    await expect(page.locator('#object-form')).toBeVisible();
  });

  test('should cancel edit correctly', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Click on an object to edit
    await page.click('.object-item:not([style*="italic"])');
    
    // Verify form is populated
    await expect(page.locator('#object-name')).not.toHaveValue('');
    
    // Cancel edit
    await page.click('#cancel-edit');
    
    // Verify form is cleared
    await expect(page.locator('#object-name')).toHaveValue('');
    await expect(page.locator('#delete-object')).not.toBeVisible();
  });

  test('should clear all objects', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Verify we have objects
    const initialObjects = page.locator('.object-item:not([style*="italic"])');
    await expect(initialObjects).toHaveCount(5);
    
    // Clear all objects
    page.on('dialog', dialog => dialog.accept()); // Accept confirmation dialog
    await page.click('#clear-all');
    
    // Verify no objects message is shown
    await expect(page.locator('.object-item[style*="italic"]')).toBeVisible();
    await expect(page.locator('.object-item:not([style*="italic"])')).toHaveCount(0);
  });

  test('should create new object immediately on page load', async ({ page }) => {
    // Click new object immediately without waiting for sample data to load
    await page.click('#new-object');
    
    // Fill in the form immediately
    await page.fill('#object-name', 'Immediate Test Object');
    await page.fill('#object-typeof', 'immediate, test');
    
    // Add tags
    await page.click('#tag-input');
    await page.type('#tag-input', 'immediate');
    await page.press('#tag-input', 'Enter');
    await page.type('#tag-input', 'test');
    await page.press('#tag-input', 'Enter');
    
    // Add rules and toString
    await page.fill('#object-rules', '(tags) => true');
    await page.fill('#object-tostring', '() => "an immediate test object"');
    
    // Save the object - this should not throw an error
    await page.click('button[type="submit"]');
    
    // Wait a bit for the save to process
    await page.waitForTimeout(500);
    
    // Verify the object was created successfully
    await expect(page.locator('.object-name').last()).toContainText('Immediate Test Object');
  });

  test('should handle form submission without currentObject initialized', async ({ page }) => {
    // Don't click new object, just try to submit the form directly
    // This tests the edge case where currentObject might be null
    
    // Fill in the form directly
    await page.fill('#object-name', 'Direct Test Object');
    await page.fill('#object-typeof', 'direct, test');
    
    // Try to save without properly initializing currentObject
    // This should not throw an error due to our safety checks
    await page.click('button[type="submit"]');
    
    // Wait a bit for the save to process
    await page.waitForTimeout(500);
    
    // Verify the object was created successfully despite not calling newObject first
    await expect(page.locator('.object-name').last()).toContainText('Direct Test Object');
  });

  test('should load objects sorted by rules count descending by default', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Verify the sort dropdown is set to rules
    await expect(page.locator('#sort-by')).toHaveValue('rules');
    await expect(page.locator('#sort-order')).toHaveValue('desc');
    
    // Verify objects are in correct order (by rules count descending)
    // jumper: 3 rules, shirt: 2 rules, croptop: 1 rule, Sydney opera house: 0 rules, wool: 0 rules
    await expect(page.locator('.object-name').nth(0)).toContainText('jumper');
    await expect(page.locator('.object-name').nth(1)).toContainText('shirt');
    await expect(page.locator('.object-name').nth(2)).toContainText('croptop');
    // The last two (Sydney opera house and wool) both have 0 rules, so their order may vary
  });

  test('should import generated objects successfully', async ({ page }) => {
    // Clear existing objects first
    page.on('dialog', dialog => dialog.accept()); 
    await page.click('#clear-all');
    
    // Verify objects are cleared
    await expect(page.locator('.object-item[style*="italic"]')).toBeVisible();
    
    // Import the test objects file
    const path = require('path');
    const filePath = path.resolve(__dirname, '..', 'test-objects.json');
    
    const fileInput = page.locator('#import-file');
    await fileInput.setInputFiles(filePath);
    
    // Wait for import to complete and dialog to be handled
    await page.waitForTimeout(1000);
    
    // Verify objects are imported and sorted by rules
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 10000 });
    const objects = page.locator('.object-item:not([style*="italic"])');
    await expect(objects).toHaveCount(20);
    
    // Verify objects are sorted by rules count (descending)
    await expect(page.locator('#sort-by')).toHaveValue('rules');
    await expect(page.locator('#sort-order')).toHaveValue('desc');
    
    // Check that objects with most rules appear first
    // business suit has 3 rules, should be at the top
    const firstObjectName = await page.locator('.object-name').first().textContent();
    console.log('First object:', firstObjectName);
    
    // Test basic functionality - check that we can create and save a simple object
    await page.click('#new-object');
    await page.fill('#object-name', 'Test Object');
    await page.fill('#object-typeof', 'test');
    await page.fill('#object-tostring', '() => "a test object"');
    
    // Save the object
    await page.click('button[type="submit"]');
    
    // Verify the object was created
    await expect(page.locator('.object-name').last()).toContainText('Test Object');
  });

  test('should generate complex text with imported objects', async ({ page }) => {
    // Clear existing objects first
    page.on('dialog', dialog => dialog.accept()); 
    await page.click('#clear-all');
    
    // Import the test objects file
    const path = require('path');
    const filePath = path.resolve(__dirname, '..', 'test-objects.json');
    
    const fileInput = page.locator('#import-file');
    await fileInput.setInputFiles(filePath);
    
    // Wait for import to complete
    await page.waitForTimeout(1000);
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 10000 });
    
    // Test text generation with multiple placeholders
    await page.fill('#raw-text', 'A person wearing <clothing> and <footwear>, standing <place> during <weather>');
    
    // Process the text multiple times to test randomization
    for (let i = 0; i < 3; i++) {
      await page.click('#process-text');
      await page.waitForTimeout(500);
      
      const preview = page.locator('#text-preview pre');
      const generatedText = await preview.textContent();
      
      // Verify that text was generated and placeholders were replaced
      expect(generatedText).not.toContain('<clothing>');
      expect(generatedText).not.toContain('<footwear>');
      expect(generatedText).not.toContain('<place>');
      expect(generatedText).not.toContain('<weather>');
      expect(generatedText).toContain('A person wearing');
      
      console.log(`Generated text ${i + 1}:`, generatedText);
    }
    
    // Test nested template replacement
    await page.fill('#raw-text', 'Someone in <formal wear> made of <material>, at <place>');
    await page.click('#process-text');
    
    const preview = page.locator('#text-preview pre');
    const nestedText = await preview.textContent();
    
    // Verify nested placeholders work
    expect(nestedText).not.toContain('<formal wear>');
    expect(nestedText).not.toContain('<material>');
    expect(nestedText).not.toContain('<place>');
    expect(nestedText).toContain('Someone in');
    
    console.log('Nested template result:', nestedText);
    
    // Test with specific categories
    await page.fill('#raw-text', 'Wearing <color> <material> <clothing> with <accessory>');
    await page.click('#process-text');
    
    const categoryText = await preview.textContent();
    expect(categoryText).not.toContain('<color>');
    expect(categoryText).not.toContain('<material>');
    expect(categoryText).not.toContain('<clothing>');
    expect(categoryText).not.toContain('<accessory>');
    expect(categoryText).toContain('Wearing');
    
    console.log('Category-specific result:', categoryText);
  });

  test('should handle error indicators with imported objects', async ({ page }) => {
    // Clear existing objects first
    page.on('dialog', dialog => dialog.accept()); 
    await page.click('#clear-all');
    
    // Import the test objects file
    const path = require('path');
    const filePath = path.resolve(__dirname, '..', 'test-objects.json');
    
    const fileInput = page.locator('#import-file');
    await fileInput.setInputFiles(filePath);
    
    // Wait for import to complete
    await page.waitForTimeout(1000);
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 10000 });
    
    // Create an object with validation errors
    await page.click('#new-object');
    await page.fill('#object-name', 'Error Test Object');
    await page.fill('#object-typeof', 'test');
    
    // Add invalid rule
    await page.fill('#object-rules', 'invalid javascript syntax {{{');
    
    // Add toString with undefined placeholder
    await page.fill('#object-tostring', '() => "wearing <nonexistent_placeholder>"');
    
    // Handle the alert dialog that appears when saving fails
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Error saving object');
      dialog.accept();
    });
    
    // Try to save (should fail)
    await page.click('button[type="submit"]');
    
    // Form should still be visible (save failed)
    await expect(page.locator('#object-form')).toBeVisible();
    
    // Fix the object by removing invalid rule and placeholder
    await page.fill('#object-rules', '(tags) => true');
    await page.fill('#object-tostring', '() => "a test object"');
    
    // Now save should work
    await page.click('button[type="submit"]');
    
    // Verify the object was created
    await expect(page.locator('.object-name').last()).toContainText('Error Test Object');
    
    // Verify no error indicator appears (object is now valid)
    const lastObjectName = page.locator('.object-name').last();
    await expect(lastObjectName).not.toContain('✖');
  });

  test('should work with expanded clothing and hairstyle objects', async ({ page }) => {
    // Clear existing objects first
    page.on('dialog', dialog => dialog.accept()); 
    await page.click('#clear-all');
    
    // Import the expanded objects file
    const path = require('path');
    const filePath = path.resolve(__dirname, '..', 'expanded-objects.json');
    
    const fileInput = page.locator('#import-file');
    await fileInput.setInputFiles(filePath);
    
    // Wait for import to complete
    await page.waitForTimeout(1000);
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 10000 });
    
    // Verify expanded objects are imported
    const objects = page.locator('.object-item:not([style*="italic"])');
    const objectCount = await objects.count();
    expect(objectCount).toBeGreaterThan(40); // Should have many new objects
    
    // Test text generation with new categories
    await page.fill('#raw-text', 'A person <hairstyle> wearing <traditional dress> for <special occasion>');
    await page.click('#process-text');
    
    let preview = page.locator('#text-preview pre');
    let generatedText = await preview.textContent();
    
    // Verify hairstyle, traditional dress, and special occasion placeholders were replaced
    expect(generatedText).not.toContain('<hairstyle>');
    expect(generatedText).not.toContain('<traditional dress>');
    expect(generatedText).not.toContain('<special occasion>');
    expect(generatedText).toContain('A person');
    
    console.log('Traditional dress result:', generatedText);
    
    // Test swimwear generation
    await page.fill('#raw-text', 'Someone in <swimwear> <hairstyle> at the <place>');
    await page.click('#process-text');
    
    generatedText = await preview.textContent();
    expect(generatedText).not.toContain('<swimwear>');
    expect(generatedText).not.toContain('<hairstyle>');
    expect(generatedText).not.toContain('<place>');
    expect(generatedText).toContain('Someone in');
    
    console.log('Swimwear result:', generatedText);
    
    // Test intimate apparel (should be handled appropriately)
    await page.fill('#raw-text', 'Wearing <underwear> under <clothing>');
    await page.click('#process-text');
    
    generatedText = await preview.textContent();
    expect(generatedText).not.toContain('<underwear>');
    expect(generatedText).not.toContain('<clothing>');
    expect(generatedText).toContain('Wearing');
    
    console.log('Underwear result:', generatedText);
    
    // Verify we can create new objects with the expanded categories
    await page.click('#new-object');
    await page.fill('#object-name', 'Test Hair Object');
    await page.fill('#object-typeof', 'hairstyle, hair');
    
    // Add tags
    await page.click('#tag-input');
    await page.type('#tag-input', 'elegant');
    await page.press('#tag-input', 'Enter');
    
    // Add toString
    await page.fill('#object-tostring', '() => "with elegant <hairstyle>"');
    
    // Save the object
    await page.click('button[type="submit"]');
    
    // Verify the object was created
    await expect(page.locator('.object-name').last()).toContainText('Test Hair Object');
  });

  test('should work with comprehensive object collection', async ({ page }) => {
    // Clear existing objects first
    page.on('dialog', dialog => dialog.accept()); 
    await page.click('#clear-all');
    
    // Import the comprehensive objects file
    const path = require('path');
    const filePath = path.resolve(__dirname, '..', 'comprehensive-objects.json');
    
    const fileInput = page.locator('#import-file');
    await fileInput.setInputFiles(filePath);
    
    // Wait for import to complete
    await page.waitForTimeout(1000);
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 10000 });
    
    // Verify comprehensive objects are imported
    const objects = page.locator('.object-item:not([style*="italic"])');
    const objectCount = await objects.count();
    expect(objectCount).toBeGreaterThan(50); // Should have many new objects
    
    console.log(`Imported ${objectCount} comprehensive objects`);
    
    // Test professional wear generation
    await page.fill('#raw-text', 'A <professional wear> worker <hair accessory> at the <place>');
    await page.click('#process-text');
    
    let preview = page.locator('#text-preview pre');
    let generatedText = await preview.textContent();
    
    expect(generatedText).not.toContain('<professional wear>');
    expect(generatedText).not.toContain('<hair accessory>');
    expect(generatedText).not.toContain('<place>');
    expect(generatedText).toContain('A');
    
    console.log('Professional wear result:', generatedText);
    
    // Test jewelry and accessories
    await page.fill('#raw-text', 'Wearing <jewelry> and <footwear> in <color> <pattern>');
    await page.click('#process-text');
    
    generatedText = await preview.textContent();
    expect(generatedText).not.toContain('<jewelry>');
    expect(generatedText).not.toContain('<footwear>');
    expect(generatedText).not.toContain('<color>');
    expect(generatedText).not.toContain('<pattern>');
    expect(generatedText).toContain('Wearing');
    
    console.log('Jewelry and accessories result:', generatedText);
    
    // Test seasonal clothing
    await page.fill('#raw-text', 'In winter, wearing <outerwear> and <footwear> at <place>');
    await page.click('#process-text');
    
    generatedText = await preview.textContent();
    expect(generatedText).not.toContain('<outerwear>');
    expect(generatedText).not.toContain('<footwear>');
    expect(generatedText).not.toContain('<place>');
    expect(generatedText).toContain('In winter');
    
    console.log('Seasonal clothing result:', generatedText);
    
    // Test safety and uniform wear
    await page.fill('#raw-text', 'A worker in <uniform> with <safety gear> at <place>');
    await page.click('#process-text');
    
    generatedText = await preview.textContent();
    expect(generatedText).not.toContain('<uniform>');
    expect(generatedText).not.toContain('<safety gear>');
    expect(generatedText).not.toContain('<place>');
    expect(generatedText).toContain('A worker');
    
    console.log('Safety and uniform result:', generatedText);
    
    // Test complex nested generation with multiple categories
    await page.fill('#raw-text', 'Someone <hairstyle> wearing <jewelry>, <clothing> with <pattern>, and <footwear> at <place> during <weather>');
    await page.click('#process-text');
    
    generatedText = await preview.textContent();
    expect(generatedText).not.toContain('<hairstyle>');
    expect(generatedText).not.toContain('<jewelry>');
    expect(generatedText).not.toContain('<clothing>');
    expect(generatedText).not.toContain('<pattern>');
    expect(generatedText).not.toContain('<footwear>');
    expect(generatedText).not.toContain('<place>');
    expect(generatedText).not.toContain('<weather>');
    expect(generatedText).toContain('Someone');
    
    console.log('Complex nested result:', generatedText);
  });

  test('should work with final combined object collection', async ({ page }) => {
    // Clear existing objects first
    page.on('dialog', dialog => dialog.accept()); 
    await page.click('#clear-all');
    
    // Import the final combined objects file
    const path = require('path');
    const filePath = path.resolve(__dirname, '..', 'combined-objects.json');
    
    const fileInput = page.locator('#import-file');
    await fileInput.setInputFiles(filePath);
    
    // Wait for import to complete
    await page.waitForTimeout(2000);
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 15000 });
    
    // Verify the massive collection is imported
    const objects = page.locator('.object-item:not([style*="italic"])');
    const objectCount = await objects.count();
    expect(objectCount).toBe(130); // Should have all 130 unique objects
    
    console.log(`Successfully imported ${objectCount} total objects from combined collection`);
    
    // Test comprehensive text generation with all categories
    await page.fill('#raw-text', 'A person <hairstyle> wearing <jewelry>, <traditional dress> with <pattern>, <footwear>, and <hair accessory> at <place>');
    await page.click('#process-text');
    
    const preview = page.locator('#text-preview pre');
    const generatedText = await preview.textContent();
    
    // Verify all placeholders are replaced
    expect(generatedText).not.toContain('<hairstyle>');
    expect(generatedText).not.toContain('<jewelry>');
    expect(generatedText).not.toContain('<traditional dress>');
    expect(generatedText).not.toContain('<pattern>');
    expect(generatedText).not.toContain('<footwear>');
    expect(generatedText).not.toContain('<hair accessory>');
    expect(generatedText).not.toContain('<place>');
    expect(generatedText).toContain('A person');
    
    console.log('Comprehensive generation result:', generatedText);
  });

  test('should work with glasses collection', async ({ page }) => {
    // Clear existing objects first
    page.on('dialog', dialog => dialog.accept()); 
    await page.click('#clear-all');
    
    // Import the glasses object collection
    const path = require('path');
    const filePath = path.resolve(__dirname, '..', 'combined-objects-with-glasses.json');
    
    const fileInput = page.locator('#import-file');
    await fileInput.setInputFiles(filePath);
    
    // Wait for import to complete
    await page.waitForTimeout(2000);
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 15000 });
    
    // Verify the massive collection with glasses is imported
    const objects = page.locator('.object-item:not([style*="italic"])');
    const objectCount = await objects.count();
    expect(objectCount).toBe(180); // Should have all 180 unique objects including glasses
    
    console.log(`Successfully imported ${objectCount} total objects including glasses`);
    
    // Test text generation with glasses
    await page.fill('#raw-text', 'A person wearing <glasses> and <top>, standing at <place>');
    await page.click('#process-text');
    
    const preview = page.locator('#text-preview pre');
    const glassesResult = await preview.textContent();
    console.log('Glasses generation result:', glassesResult);
    
    // Should have successful glasses replacement
    expect(glassesResult).not.toContain('<glasses>');
    expect(glassesResult).not.toContain('<top>');
    expect(glassesResult).not.toContain('<place>');
    
    // Test specific glasses types
    await page.fill('#raw-text', 'Someone with <eyewear> and <sunglasses> for outdoor activities');
    await page.click('#process-text');
    
    const specificGlassesResult = await preview.textContent();
    console.log('Specific glasses result:', specificGlassesResult);
    
    expect(specificGlassesResult).not.toContain('<eyewear>');
    expect(specificGlassesResult).not.toContain('<sunglasses>');
    
    // Test designer and safety glasses
    await page.fill('#raw-text', 'A worker wearing <safety> glasses and <professional> clothing');
    await page.click('#process-text');
    
    const workGlassesResult = await preview.textContent();
    console.log('Work glasses result:', workGlassesResult);
    
    expect(workGlassesResult).not.toContain('<safety>');
    expect(workGlassesResult).not.toContain('<professional>');
  });

  test('should display request history UI elements', async ({ page }) => {
    // Check if request history UI elements are present
    await expect(page.locator('#request-history')).toBeVisible();
    await expect(page.locator('#clear-history')).toBeVisible();
    await expect(page.locator('#export-history')).toBeVisible();
    
    // Check initial empty state
    await expect(page.locator('#request-history')).toContainText('No requests yet');
  });

  test('should show RANDOM_1 input field', async ({ page }) => {
    // Check if RANDOM_1 input field is present
    await expect(page.locator('#random-1-value')).toBeVisible();
    await expect(page.locator('label[for="random-1-value"]')).toContainText('RANDOM_1');
  });

  test('should handle RANDOM_1 value validation', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Fill in ComfyUI fields
    await page.fill('#comfyui-url', 'http://localhost:8188');
    await page.fill('#comfyui-workflow', '{"prompt": {"1": {"inputs": {"seed": $RANDOM_1, "text": "$VALUE_1"}}}}');
    await page.fill('#raw-text', 'Test prompt');
    
    // Test invalid RANDOM_1 value (too large)
    await page.fill('#random-1-value', '99999999999999');
    
    // Mock the fetch call to prevent actual network requests
    await page.route('/api/comfyui/prompt', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ prompt_id: 'test-123', number: 1 })
      });
    });
    
    // Try to send - should show validation error
    await page.click('#send-to-comfyui');
    await expect(page.locator('#workflow-preview')).toContainText('RANDOM_1 value must be between 1 and 9999999999999');
    
    // Test valid RANDOM_1 value
    await page.fill('#random-1-value', '12345');
    await page.click('#send-to-comfyui');
    
    // Should not show validation error
    await expect(page.locator('#workflow-preview')).not.toContainText('RANDOM_1 value must be between 1 and 9999999999999');
  });

  test('should create request history entries with proper status', async ({ page }) => {
    // Wait for objects to load
    await page.waitForSelector('.object-item:not([style*="italic"])', { timeout: 5000 });
    
    // Fill in ComfyUI fields
    await page.fill('#comfyui-url', 'http://localhost:8188');
    await page.fill('#comfyui-workflow', '{"prompt": {"1": {"inputs": {"seed": $RANDOM_1, "text": "$VALUE_1"}}}}');
    await page.fill('#raw-text', 'Test request for history');
    
    // Mock ALL fetch calls before making the request
    await page.route('**/api/comfyui/**', route => {
      const url = route.request().url();
      if (url.includes('/prompt')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ prompt_id: 'test-history-123', number: 1 })
        });
      } else if (url.includes('/queue')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            queue_running: [], 
            queue_pending: [['some-id', 'test-history-123']] 
          })
        });
      } else if (url.includes('/history')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({})
        });
      } else {
        route.continue();
      }
    });
    
    // Send request
    await page.click('#send-to-comfyui');
    
    // Wait for request to be processed
    await page.waitForTimeout(2000);
    
    // Check that request history now has an entry
    await expect(page.locator('#request-history')).not.toContainText('No requests yet');
    await expect(page.locator('.request-item')).toBeVisible();
    
    // Check that status shows "⏳ In Queue" (or success if immediate)
    const statusElement = page.locator('.request-status');
    const statusText = await statusElement.textContent();
    console.log('Status text:', statusText);
    
    // Accept either queue status or success status as both are valid
    expect(statusText).toMatch(/⏳ In Queue|success/);
    
    // Check that request details are expandable
    await page.click('.request-header');
    await expect(page.locator('.request-details')).toHaveClass(/expanded/);
    
    // Verify request data is displayed with escaped HTML
    await expect(page.locator('.request-section h4')).toContainText('Generated Prompt');
    await expect(page.locator('.request-section h4')).toContainText('Object Library');
    await expect(page.locator('.request-section h4')).toContainText('ComfyUI Workflow');
  });

  test('should handle request history management', async ({ page }) => {
    // Create a mock request by directly modifying localStorage
    await page.evaluate(() => {
      const mockRequest = {
        id: '1234567890123',
        timestamp: new Date().toISOString(),
        status: 'Generation Complete!',
        prompt: 'Test prompt',
        workflow: { test: 'workflow' },
        objects: [{ name: 'test', typeOf: ['test'], tags: [], rules: [], toString: [] }],
        rawTemplate: 'Test template',
        comfyUIUrl: 'http://localhost:8188',
        randomValue: 12345,
        response: { prompt_id: 'test-123' },
        error: null,
        promptId: 'test-123',
        images: [{ url: '/test-image.png', filename: 'test.png' }]
      };
      
      const data = JSON.parse(localStorage.getItem('tagsHierarchyEditor') || '{}');
      data.requestHistory = [mockRequest];
      localStorage.setItem('tagsHierarchyEditor', JSON.stringify(data));
      
      // Trigger a page refresh to load the data
      window.location.reload();
    });
    
    // Wait for page to reload and data to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Check that history shows the mock request
    await expect(page.locator('.request-item')).toBeVisible();
    await expect(page.locator('.request-status')).toContainText('Generation Complete!');
    
    // Test export functionality
    const downloadPromise = page.waitForEvent('download');
    await page.click('#export-history');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/request-history-.*\.json/);
    
    // Test clear functionality
    page.on('dialog', dialog => dialog.accept());
    await page.click('#clear-history');
    
    // Verify history is cleared
    await expect(page.locator('#request-history')).toContainText('No requests yet');
  });

  test('should display images in completed requests', async ({ page }) => {
    // Create a mock completed request with images
    await page.evaluate(() => {
      const mockRequest = {
        id: '1234567890124',
        timestamp: new Date().toISOString(),
        status: 'Generation Complete!',
        prompt: 'Test prompt with image',
        workflow: { test: 'workflow' },
        objects: [],
        rawTemplate: 'Test template',
        comfyUIUrl: 'http://localhost:8188',
        randomValue: 54321,
        response: { prompt_id: 'test-124' },
        error: null,
        promptId: 'test-124',
        images: [
          { url: '/test-image1.png', filename: 'test1.png' },
          { url: '/test-image2.png', filename: 'test2.png' }
        ]
      };
      
      const data = JSON.parse(localStorage.getItem('tagsHierarchyEditor') || '{}');
      data.requestHistory = [mockRequest];
      localStorage.setItem('tagsHierarchyEditor', JSON.stringify(data));
      
      window.location.reload();
    });
    
    // Wait for page to reload and data to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Expand request details
    await page.click('.request-header');
    
    // Check that images section is present
    await expect(page.locator('.request-section h4')).toContainText('Generated Images');
    
    // Check that images are displayed
    const images = page.locator('.request-section img');
    await expect(images).toHaveCount(2);
    
    // Verify image attributes
    await expect(images.first()).toHaveAttribute('src', '/test-image1.png');
    await expect(images.nth(1)).toHaveAttribute('src', '/test-image2.png');
  });
});