import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function comprehensiveTableDemo() {
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
    console.log('🚀 Starting comprehensive table demonstration...');

    await page.goto('http://localhost:3000/table-research', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Navigated to table research page');
    await page.waitForTimeout(3000);

    // 1. Capture initial comparison view
    console.log('📸 1. Capturing initial comparison view...');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-comparison-overview.png'),
      fullPage: true
    });

    // Scroll through comparison to show features
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '02-comparison-features.png'),
      fullPage: true
    });

    // 2. Click Material React Table tab and demonstrate
    console.log('🔄 2. Clicking Material React Table tab...');
    
    // Wait for and click the Material React Table tab
    await page.waitForSelector('button:has-text("Material React Table")', { timeout: 10000 });
    await page.click('button:has-text("Material React Table")');
    await page.waitForTimeout(3000);

    console.log('📸 2a. Capturing Material React Table demo...');
    await page.screenshot({
      path: path.join(screenshotsDir, '03-material-table-full.png'),
      fullPage: true
    });

    // Scroll to focus on the table
    await page.evaluate(() => {
      const tableElement = document.querySelector('table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);

    console.log('📸 2b. Capturing focused Material React Table...');
    await page.screenshot({
      path: path.join(screenshotsDir, '04-material-table-focused.png'),
      fullPage: false
    });

    // Capture just the table element
    const materialTable = await page.locator('table').first();
    if (await materialTable.isVisible()) {
      await materialTable.screenshot({
        path: path.join(screenshotsDir, '05-material-table-only.png')
      });
      console.log('📸 2c. Captured Material table element only');
    }

    // 3. Click Mantine React Table tab and demonstrate
    console.log('🔄 3. Clicking Mantine React Table tab...');
    
    await page.waitForSelector('button:has-text("Mantine React Table")', { timeout: 10000 });
    await page.click('button:has-text("Mantine React Table")');
    await page.waitForTimeout(3000);

    console.log('📸 3a. Capturing Mantine React Table demo...');
    await page.screenshot({
      path: path.join(screenshotsDir, '06-mantine-table-full.png'),
      fullPage: true
    });

    // Scroll to focus on the Mantine table
    await page.evaluate(() => {
      const tableElement = document.querySelector('table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);

    console.log('📸 3b. Capturing focused Mantine React Table...');
    await page.screenshot({
      path: path.join(screenshotsDir, '07-mantine-table-focused.png'),
      fullPage: false
    });

    // Capture just the Mantine table element
    const mantineTable = await page.locator('table').first();
    if (await mantineTable.isVisible()) {
      await mantineTable.screenshot({
        path: path.join(screenshotsDir, '08-mantine-table-only.png')
      });
      console.log('📸 3c. Captured Mantine table element only');
    }

    // 4. Show recommendation tab
    console.log('🔄 4. Clicking Recommendation tab...');
    
    await page.waitForSelector('button:has-text("Recommendation")', { timeout: 10000 });
    await page.click('button:has-text("Recommendation")');
    await page.waitForTimeout(3000);

    console.log('📸 4. Capturing recommendation analysis...');
    await page.screenshot({
      path: path.join(screenshotsDir, '09-recommendation-final.png'),
      fullPage: true
    });

    // 5. Go back through tabs to show navigation
    console.log('🔄 5. Demonstrating tab navigation...');
    
    // Back to comparison
    await page.click('button:has-text("Library Comparison")');
    await page.waitForTimeout(2000);
    
    // Back to Material
    await page.click('button:has-text("Material React Table")');
    await page.waitForTimeout(2000);
    
    // Back to Mantine
    await page.click('button:has-text("Mantine React Table")');
    await page.waitForTimeout(2000);
    
    // Final recommendation
    await page.click('button:has-text("Recommendation")');
    await page.waitForTimeout(3000);

    console.log('✅ Comprehensive demonstration completed!');

    // List all captured files
    const files = [
      '01-comparison-overview.png',
      '02-comparison-features.png', 
      '03-material-table-full.png',
      '04-material-table-focused.png',
      '05-material-table-only.png',
      '06-mantine-table-full.png',
      '07-mantine-table-focused.png',
      '08-mantine-table-only.png',
      '09-recommendation-final.png'
    ];

    console.log('\n📋 Captured screenshots:');
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
    console.error('❌ Error during demonstration:', error);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    
    // List recorded videos
    console.log('\n📹 Recorded videos:');
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

// Run the comprehensive demo
comprehensiveTableDemo().catch(console.error);
