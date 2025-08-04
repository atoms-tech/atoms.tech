/**
 * Cross-Browser Visual Regression Tests
 * Tests to ensure visual consistency across different browsers
 */

import { test, expect, Page, Browser } from '@playwright/test';
import { VisualTestUtils } from '../../scripts/visual-testing/visual-utils.js';
import visualConfig from '../../scripts/visual-testing/visual-config.js';

// Critical pages to test across browsers
const criticalPages = [
  { path: '/', name: 'home' },
  { path: '/login', name: 'login' },
  { path: '/dashboard', name: 'dashboard' },
];

// Critical components to test across browsers
const criticalComponents = [
  'button',
  'input',
  'select',
  'modal',
  'navigation',
  'form',
];

test.describe('Cross-Browser Visual Consistency', () => {
  let visualUtils: VisualTestUtils;

  test.beforeEach(async ({ page, browserName }) => {
    visualUtils = new VisualTestUtils(page, browserName);
  });

  // Test font rendering across browsers
  test.describe('Font Rendering Consistency', () => {
    
    test('Typography consistency', async ({ page, browserName }) => {
      await page.goto('/');
      await visualUtils.preparePage();

      // Test different font weights and styles
      await page.addStyleTag({
        content: `
          .font-test {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.5;
            padding: 20px;
          }
          .font-light { font-weight: 300; }
          .font-normal { font-weight: 400; }
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }
        `,
      });

      await page.setContent(`
        <div class="font-test">
          <h1>Heading 1 - Bold Typography</h1>
          <h2>Heading 2 - Semibold Typography</h2>
          <h3>Heading 3 - Medium Typography</h3>
          <p class="font-normal">Normal paragraph text with regular weight</p>
          <p class="font-light">Light paragraph text</p>
          <p class="font-bold">Bold paragraph text</p>
          <small>Small text for captions and labels</small>
        </div>
      `);

      await expect(page.locator('.font-test')).toHaveScreenshot(
        `typography-consistency-${browserName}.png`
      );
    });

    test('Font smoothing and rendering', async ({ page, browserName }) => {
      await page.goto('/');
      
      // Test different font smoothing settings
      await page.addStyleTag({
        content: `
          .font-smoothing-test {
            padding: 20px;
          }
          .antialiased {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .subpixel {
            -webkit-font-smoothing: subpixel-antialiased;
            -moz-osx-font-smoothing: auto;
          }
        `,
      });

      await page.setContent(`
        <div class="font-smoothing-test">
          <p class="antialiased">Antialiased text rendering</p>
          <p class="subpixel">Subpixel text rendering</p>
          <p>Default text rendering</p>
        </div>
      `);

      await expect(page.locator('.font-smoothing-test')).toHaveScreenshot(
        `font-smoothing-${browserName}.png`
      );
    });
  });

  // Test CSS Grid and Flexbox layouts
  test.describe('Layout Consistency', () => {
    
    test('CSS Grid layouts', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 20px;
          }
          .grid-item {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
            min-height: 100px;
          }
        </style>
        <div class="grid-container">
          <div class="grid-item">Grid Item 1</div>
          <div class="grid-item">Grid Item 2</div>
          <div class="grid-item">Grid Item 3 with longer content</div>
          <div class="grid-item">Grid Item 4</div>
          <div class="grid-item">Grid Item 5</div>
          <div class="grid-item">Grid Item 6</div>
        </div>
      `);

      await expect(page.locator('.grid-container')).toHaveScreenshot(
        `css-grid-layout-${browserName}.png`
      );
    });

    test('Flexbox layouts', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .flex-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            padding: 20px;
          }
          .flex-item {
            flex: 1 1 200px;
            background: #e0e0e0;
            padding: 20px;
            border-radius: 8px;
            min-height: 100px;
          }
          .flex-item.grow-2 {
            flex-grow: 2;
          }
        </style>
        <div class="flex-container">
          <div class="flex-item">Flex Item 1</div>
          <div class="flex-item grow-2">Flex Item 2 (grows)</div>
          <div class="flex-item">Flex Item 3</div>
          <div class="flex-item">Flex Item 4</div>
        </div>
      `);

      await expect(page.locator('.flex-container')).toHaveScreenshot(
        `flexbox-layout-${browserName}.png`
      );
    });

    test('CSS Grid with complex layouts', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .complex-grid {
            display: grid;
            grid-template-areas: 
              "header header header"
              "sidebar main aside"
              "footer footer footer";
            grid-template-columns: 200px 1fr 200px;
            grid-template-rows: auto 1fr auto;
            gap: 20px;
            height: 500px;
            padding: 20px;
          }
          .header { grid-area: header; background: #ff6b6b; }
          .sidebar { grid-area: sidebar; background: #4ecdc4; }
          .main { grid-area: main; background: #45b7d1; }
          .aside { grid-area: aside; background: #96ceb4; }
          .footer { grid-area: footer; background: #feca57; }
          .grid-section {
            padding: 20px;
            border-radius: 8px;
            color: white;
          }
        </style>
        <div class="complex-grid">
          <div class="header grid-section">Header</div>
          <div class="sidebar grid-section">Sidebar</div>
          <div class="main grid-section">Main Content</div>
          <div class="aside grid-section">Aside</div>
          <div class="footer grid-section">Footer</div>
        </div>
      `);

      await expect(page.locator('.complex-grid')).toHaveScreenshot(
        `complex-grid-layout-${browserName}.png`
      );
    });
  });

  // Test CSS transforms and animations
  test.describe('CSS Features Consistency', () => {
    
    test('CSS transforms', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .transform-container {
            display: flex;
            gap: 20px;
            padding: 40px;
            justify-content: center;
          }
          .transform-item {
            width: 100px;
            height: 100px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border-radius: 8px;
          }
          .rotate { transform: rotate(45deg); }
          .scale { transform: scale(1.2); }
          .skew { transform: skewX(15deg); }
          .translate { transform: translateX(20px) translateY(-10px); }
          .multiple { transform: rotate(30deg) scale(0.8) translateX(10px); }
        </style>
        <div class="transform-container">
          <div class="transform-item">Normal</div>
          <div class="transform-item rotate">Rotate</div>
          <div class="transform-item scale">Scale</div>
          <div class="transform-item skew">Skew</div>
          <div class="transform-item translate">Translate</div>
          <div class="transform-item multiple">Multiple</div>
        </div>
      `);

      await expect(page.locator('.transform-container')).toHaveScreenshot(
        `css-transforms-${browserName}.png`
      );
    });

    test('CSS gradients and shadows', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .effects-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding: 40px;
          }
          .effect-item {
            width: 150px;
            height: 100px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          }
          .linear-gradient {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          }
          .radial-gradient {
            background: radial-gradient(circle, #feca57, #ff9ff3);
          }
          .box-shadow {
            background: #45b7d1;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          }
          .text-shadow {
            background: #96ceb4;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          }
          .inset-shadow {
            background: #f38ba8;
            box-shadow: inset 0 4px 8px rgba(0,0,0,0.3);
          }
          .multiple-shadows {
            background: #a6e3a1;
            box-shadow: 
              0 2px 4px rgba(0,0,0,0.1),
              0 8px 16px rgba(0,0,0,0.1),
              0 16px 32px rgba(0,0,0,0.1);
          }
        </style>
        <div class="effects-container">
          <div class="effect-item linear-gradient">Linear</div>
          <div class="effect-item radial-gradient">Radial</div>
          <div class="effect-item box-shadow">Box Shadow</div>
          <div class="effect-item text-shadow">Text Shadow</div>
          <div class="effect-item inset-shadow">Inset</div>
          <div class="effect-item multiple-shadows">Multiple</div>
        </div>
      `);

      await expect(page.locator('.effects-container')).toHaveScreenshot(
        `css-effects-${browserName}.png`
      );
    });

    test('CSS filters and blend modes', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .filter-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            padding: 20px;
          }
          .filter-item {
            width: 120px;
            height: 80px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          }
          .blur { filter: blur(2px); }
          .brightness { filter: brightness(1.5); }
          .contrast { filter: contrast(1.5); }
          .grayscale { filter: grayscale(100%); }
          .hue-rotate { filter: hue-rotate(90deg); }
          .saturate { filter: saturate(2); }
          .sepia { filter: sepia(100%); }
          .multiple-filters { filter: brightness(1.2) contrast(1.3) saturate(1.5); }
        </style>
        <div class="filter-container">
          <div class="filter-item">Normal</div>
          <div class="filter-item blur">Blur</div>
          <div class="filter-item brightness">Bright</div>
          <div class="filter-item contrast">Contrast</div>
          <div class="filter-item grayscale">Grayscale</div>
          <div class="filter-item hue-rotate">Hue</div>
          <div class="filter-item saturate">Saturate</div>
          <div class="filter-item multiple-filters">Multiple</div>
        </div>
      `);

      await expect(page.locator('.filter-container')).toHaveScreenshot(
        `css-filters-${browserName}.png`
      );
    });
  });

  // Test form elements across browsers
  test.describe('Form Elements Consistency', () => {
    
    test('Input elements styling', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .form-container {
            max-width: 500px;
            margin: 20px auto;
            padding: 20px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
          }
          input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
          }
          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #4ecdc4;
            box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
          }
          .checkbox-group, .radio-group {
            display: flex;
            gap: 15px;
            align-items: center;
          }
          input[type="checkbox"], input[type="radio"] {
            width: auto;
            margin-right: 8px;
          }
        </style>
        <div class="form-container">
          <div class="form-group">
            <label>Text Input</label>
            <input type="text" placeholder="Enter text here" value="Sample text">
          </div>
          <div class="form-group">
            <label>Email Input</label>
            <input type="email" placeholder="email@example.com" value="test@example.com">
          </div>
          <div class="form-group">
            <label>Password Input</label>
            <input type="password" placeholder="Password" value="password123">
          </div>
          <div class="form-group">
            <label>Number Input</label>
            <input type="number" placeholder="Enter number" value="42">
          </div>
          <div class="form-group">
            <label>Date Input</label>
            <input type="date" value="2023-12-25">
          </div>
          <div class="form-group">
            <label>Select Dropdown</label>
            <select>
              <option>Option 1</option>
              <option selected>Option 2 (Selected)</option>
              <option>Option 3</option>
            </select>
          </div>
          <div class="form-group">
            <label>Textarea</label>
            <textarea rows="3" placeholder="Enter long text here">This is a sample textarea content</textarea>
          </div>
          <div class="form-group">
            <label>Checkboxes</label>
            <div class="checkbox-group">
              <label><input type="checkbox" checked> Option A</label>
              <label><input type="checkbox"> Option B</label>
              <label><input type="checkbox" checked> Option C</label>
            </div>
          </div>
          <div class="form-group">
            <label>Radio Buttons</label>
            <div class="radio-group">
              <label><input type="radio" name="radio" checked> Choice 1</label>
              <label><input type="radio" name="radio"> Choice 2</label>
              <label><input type="radio" name="radio"> Choice 3</label>
            </div>
          </div>
        </div>
      `);

      await expect(page.locator('.form-container')).toHaveScreenshot(
        `form-elements-${browserName}.png`
      );
    });

    test('Form validation states', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .validation-container {
            max-width: 400px;
            margin: 20px auto;
            padding: 20px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
          }
          input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
          }
          .valid {
            border-color: #28a745;
            background-color: #f8fff9;
          }
          .invalid {
            border-color: #dc3545;
            background-color: #fff8f8;
          }
          .warning {
            border-color: #ffc107;
            background-color: #fffef8;
          }
          .error-message {
            color: #dc3545;
            font-size: 12px;
            margin-top: 5px;
          }
          .success-message {
            color: #28a745;
            font-size: 12px;
            margin-top: 5px;
          }
        </style>
        <div class="validation-container">
          <div class="form-group">
            <label>Valid Input</label>
            <input type="email" class="valid" value="user@example.com">
            <div class="success-message">✓ Valid email format</div>
          </div>
          <div class="form-group">
            <label>Invalid Input</label>
            <input type="email" class="invalid" value="invalid-email">
            <div class="error-message">✗ Please enter a valid email address</div>
          </div>
          <div class="form-group">
            <label>Warning Input</label>
            <input type="password" class="warning" value="weak">
            <div class="error-message" style="color: #ffc107;">⚠ Password is too weak</div>
          </div>
          <div class="form-group">
            <label>Required Field (Empty)</label>
            <input type="text" class="invalid" placeholder="This field is required">
            <div class="error-message">✗ This field is required</div>
          </div>
        </div>
      `);

      await expect(page.locator('.validation-container')).toHaveScreenshot(
        `form-validation-${browserName}.png`
      );
    });
  });

  // Test browser-specific rendering differences
  test.describe('Browser-Specific Features', () => {
    
    test('Scrollbar styling', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .scrollbar-container {
            width: 300px;
            height: 200px;
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: auto;
            margin: 20px auto;
          }
          .scrollbar-content {
            width: 400px;
            height: 400px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #feca57, #ff9ff3);
            padding: 20px;
            color: white;
          }
          /* Webkit scrollbar styling */
          .scrollbar-container::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }
          .scrollbar-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 6px;
          }
          .scrollbar-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 6px;
          }
          .scrollbar-container::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        </style>
        <div class="scrollbar-container">
          <div class="scrollbar-content">
            <h3>Scrollable Content</h3>
            <p>This content is larger than the container and will show scrollbars.</p>
            <p>Scroll both horizontally and vertically to see the scrollbar styling.</p>
            <p>Different browsers may render scrollbars differently.</p>
          </div>
        </div>
      `);

      await expect(page.locator('.scrollbar-container')).toHaveScreenshot(
        `scrollbar-styling-${browserName}.png`
      );
    });

    test('Text selection and highlighting', async ({ page, browserName }) => {
      await page.goto('/');
      
      await page.setContent(`
        <style>
          .selection-container {
            max-width: 500px;
            margin: 20px auto;
            padding: 20px;
            line-height: 1.6;
          }
          .custom-selection::selection {
            background: #ff6b6b;
            color: white;
          }
          .custom-selection::-moz-selection {
            background: #ff6b6b;
            color: white;
          }
        </style>
        <div class="selection-container">
          <h3>Text Selection Testing</h3>
          <p>This is normal text that will use default selection highlighting when selected.</p>
          <p class="custom-selection">This paragraph has custom selection styling with a red background.</p>
          <p>Try selecting this text to see how different browsers handle text selection and highlighting.</p>
        </div>
      `);

      // Select some text to show selection highlighting
      await page.locator('.selection-container p').first().click();
      await page.keyboard.down('Shift');
      await page.keyboard.press('End');
      await page.keyboard.up('Shift');

      await expect(page.locator('.selection-container')).toHaveScreenshot(
        `text-selection-${browserName}.png`
      );
    });
  });
});

// High DPI and Retina Display Tests
test.describe('High DPI and Retina Display Tests', () => {
  
  test('Retina display rendering', async ({ page, browserName }) => {
    // Set high device pixel ratio
    await page.setViewportSize({
      width: 1920,
      height: 1080,
    });

    // Simulate retina display
    await page.addInitScript(() => {
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => 2
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(
      `retina-display-${browserName}.png`,
      { 
        fullPage: true,
        scale: 'device'
      }
    );
  });

  test('High DPI images and icons', async ({ page, browserName }) => {
    await page.goto('/');
    
    await page.setContent(`
      <style>
        .image-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        .image-item {
          text-align: center;
        }
        .image-item img {
          width: 100px;
          height: 100px;
          border-radius: 8px;
        }
        .svg-icon {
          width: 64px;
          height: 64px;
          fill: #4ecdc4;
        }
        .icon-font {
          font-size: 64px;
          color: #ff6b6b;
        }
      </style>
      <div class="image-container">
        <div class="image-item">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM0ZWNkYzQiLz4KPHN2ZyB4PSI1MCIgeT0iNTAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTEyIDJsMy4wOSA2LjI2TDIyIDlsLTUgNC44N0wxOCAyMmwtNi0zLjE1TDYgMjJsMS01LjEzTDIgOWw2LjkxLTAuNzR6Ii8+Cjwvc3ZnPgo8L3N2Zz4=" alt="SVG Image">
          <p>SVG Image</p>
        </div>
        <div class="image-item">
          <svg class="svg-icon" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9l-5 4.87L18 22l-6-3.15L6 22l1-5.13L2 9l6.91-0.74z"/>
          </svg>
          <p>SVG Icon</p>
        </div>
        <div class="image-item">
          <div class="icon-font">★</div>
          <p>Icon Font</p>
        </div>
      </div>
    `);

    await expect(page.locator('.image-container')).toHaveScreenshot(
      `high-dpi-images-${browserName}.png`
    );
  });
});