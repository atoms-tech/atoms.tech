import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function finalTableDemonstration() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  const videosDir = path.join(__dirname, '..', 'videos');
  
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: videosDir,
      size: { width: 1920, height: 1080 }
    }
  });
  
  const page = await context.newPage();

  try {
    console.log('🚀 Starting FINAL table demonstration...');

    await page.goto('http://localhost:3000/table-research', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Navigated to table research page');
    await page.waitForTimeout(3000);

    // 1. Capture initial comparison view
    console.log('📸 1. Capturing Library Comparison (default tab)...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'FINAL-01-library-comparison.png'),
      fullPage: true
    });

    // 2. Click Material React Table tab button specifically
    console.log('🔄 2. Clicking Material React Table tab button...');
    
    // Find the exact tab button
    const materialTabButton = page.locator('button').filter({ hasText: 'Material React Table' }).first();
    await materialTabButton.click();
    await page.waitForTimeout(3000);

    console.log('📸 2a. Capturing Material React Table demo page...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'FINAL-02-material-demo-full.png'),
      fullPage: true
    });

    // Scroll to the table area
    await page.evaluate(() => {
      const tableElement = document.querySelector('table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);

    console.log('📸 2b. Capturing Material React Table focused view...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'FINAL-03-material-table-focused.png'),
      fullPage: false
    });

    // Capture just the table
    const materialTable = await page.locator('table').first();
    if (await materialTable.isVisible()) {
      await materialTable.screenshot({
        path: path.join(screenshotsDir, 'FINAL-04-material-table-only.png')
      });
      console.log('📸 2c. Captured Material table element');
    }

    // 3. Click Mantine React Table tab button specifically
    console.log('🔄 3. Clicking Mantine React Table tab button...');
    
    const mantineTabButton = page.locator('button').filter({ hasText: 'Mantine React Table' }).first();
    await mantineTabButton.click();
    await page.waitForTimeout(3000);

    console.log('📸 3a. Capturing Mantine React Table demo page...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'FINAL-05-mantine-demo-full.png'),
      fullPage: true
    });

    // Scroll to the Mantine table area
    await page.evaluate(() => {
      const tableElement = document.querySelector('table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);

    console.log('📸 3b. Capturing Mantine React Table focused view...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'FINAL-06-mantine-table-focused.png'),
      fullPage: false
    });

    // Capture just the Mantine table
    const mantineTable = await page.locator('table').first();
    if (await mantineTable.isVisible()) {
      await mantineTable.screenshot({
        path: path.join(screenshotsDir, 'FINAL-07-mantine-table-only.png')
      });
      console.log('📸 3c. Captured Mantine table element');
    }

    // 4. Click Recommendation tab
    console.log('🔄 4. Clicking Recommendation tab...');
    
    const recommendationTabButton = page.locator('button').filter({ hasText: 'Recommendation' }).first();
    await recommendationTabButton.click();
    await page.waitForTimeout(3000);

    console.log('📸 4. Capturing Recommendation analysis...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'FINAL-08-recommendation.png'),
      fullPage: true
    });

    // 5. Demonstrate tab navigation by going through all tabs again
    console.log('🔄 5. Demonstrating complete tab navigation...');
    
    // Back to comparison
    await page.locator('button').filter({ hasText: 'Library Comparison' }).first().click();
    await page.waitForTimeout(1500);
    
    // To Material
    await page.locator('button').filter({ hasText: 'Material React Table' }).first().click();
    await page.waitForTimeout(1500);
    
    // To Mantine
    await page.locator('button').filter({ hasText: 'Mantine React Table' }).first().click();
    await page.waitForTimeout(1500);
    
    // To Recommendation
    await page.locator('button').filter({ hasText: 'Recommendation' }).first().click();
    await page.waitForTimeout(2000);

    // Final screenshot showing recommendation
    console.log('📸 5. Final recommendation screenshot...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'FINAL-09-final-recommendation.png'),
      fullPage: true
    });

    console.log('✅ FINAL demonstration completed successfully!');

    // List all captured files
    const files = [
      'FINAL-01-library-comparison.png',
      'FINAL-02-material-demo-full.png',
      'FINAL-03-material-table-focused.png',
      'FINAL-04-material-table-only.png',
      'FINAL-05-mantine-demo-full.png',
      'FINAL-06-mantine-table-focused.png',
      'FINAL-07-mantine-table-only.png',
      'FINAL-08-recommendation.png',
      'FINAL-09-final-recommendation.png'
    ];

    console.log('\n📋 FINAL Screenshots:');
    files.forEach(file => {
      const filePath = path.join(screenshotsDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
      } else {
        console.log(`❌ ${file} (missing)`);
      }
    });

  } catch (error) {
    console.error('❌ Error during FINAL demonstration:', error);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    
    // List recorded videos
    console.log('\n📹 FINAL Video:');
    const videoFiles = fs.readdirSync(videosDir);
    videoFiles.forEach(file => {
      if (file.endsWith('.webm')) {
        const filePath = path.join(videosDir, file);
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${Math.round(stats.size / 1024 / 1024)}MB)`);
      }
    });
  }
}

// Run the FINAL demonstration
finalTableDemonstration().catch(console.error);
