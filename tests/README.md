# Cross-Browser Testing Documentation

This directory contains automated cross-browser tests for the atoms.tech Next.js application using Playwright.

## Overview

Our testing suite ensures compatibility across:
- **Desktop Browsers**: Chrome, Firefox, Safari (WebKit), Edge
- **Mobile Browsers**: Mobile Chrome, Mobile Safari
- **Different Viewports**: Desktop, Tablet, Mobile

## Test Structure

### Test Files

- `landing-page.spec.ts` - Tests for the main landing page functionality
- `authentication.spec.ts` - Tests for login/signup flows and OAuth
- `navigation.spec.ts` - Tests for routing, navigation, and URL handling
- `testing-features.spec.ts` - Tests for UI components and interactions
- `cross-browser-compatibility.spec.ts` - Comprehensive cross-browser compatibility tests

### Utilities

- `utils/test-helpers.ts` - Common testing utilities and helper functions

## Running Tests

### Prerequisites

```bash
# Install dependencies
bun install

# Install Playwright browsers
bun run playwright:install
```

### Local Testing

```bash
# Run all tests across all browsers
bun run test:e2e

# Run tests with UI mode (interactive)
bun run test:e2e:ui

# Run tests in headed mode (see browser)
bun run test:e2e:headed

# Run tests in debug mode
bun run test:e2e:debug

# Run specific browser tests
bun run test:browsers

# Run mobile tests only
bun run test:mobile

# Generate compatibility matrix
bun run test:compatibility
```

### Specific Browser Testing

```bash
# Chrome only
bunx playwright test --project=chromium

# Firefox only
bunx playwright test --project=firefox

# Safari only
bunx playwright test --project=webkit

# Mobile Chrome
bunx playwright test --project="Mobile Chrome"

# Mobile Safari
bunx playwright test --project="Mobile Safari"
```

### Test Reports

```bash
# View HTML report
bun run test:e2e:report

# Or open directly
bunx playwright show-report
```

## Test Configuration

### Environment Variables

Tests use the `.env.test` file for configuration:

```env
NEXT_PUBLIC_GUMLOOP_API_KEY=test_key
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
# ... other test-safe values
```

### Playwright Configuration

The `playwright.config.ts` file configures:
- Browser projects (Chrome, Firefox, Safari, Mobile)
- Test timeouts and retries
- Base URL and web server settings
- Report generation

## Test Categories

### 1. Landing Page Tests
- Page loading and rendering
- Hero section display
- Navigation links functionality
- Mobile responsiveness
- JavaScript error detection
- SEO meta tags

### 2. Authentication Tests
- Login form elements and validation
- Signup form functionality
- OAuth button presence
- Form interaction handling
- Accessibility compliance

### 3. Navigation Tests
- Direct URL navigation
- Browser back/forward buttons
- 404 error handling
- Protected route access
- External link handling
- Keyboard navigation
- Page refresh behavior
- Network condition handling

### 4. Testing Features Tests
- Form interactions
- Dynamic content loading
- Modal and dialog handling
- Table interactions
- Search and filter functionality
- Drag and drop (if applicable)
- Keyboard shortcuts
- Responsive design
- Error state handling

### 5. Cross-Browser Compatibility Tests
- Browser feature support
- JavaScript compatibility
- CSS feature support
- Form interaction consistency
- Performance standards
- Accessibility compliance
- Browser-specific quirks

## Browser Compatibility Matrix

The compatibility matrix is automatically generated after test runs and shows:
- ✅ Passed tests
- ❌ Failed tests
- ⚠️ Tests with warnings
- ❓ Unknown/untested features
- ⏭️ Skipped tests

View the latest matrix in `BROWSER_COMPATIBILITY_MATRIX.md`.

## CI/CD Integration

Tests run automatically on:
- Push to main branch
- Pull requests
- Scheduled runs (if configured)

The GitHub Actions workflow:
1. Builds the application
2. Installs Playwright browsers
3. Runs cross-browser tests
4. Generates compatibility matrix
5. Uploads test results and reports

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Feature Name', () => {
    test('should do something', async ({ page }) => {
        const helpers = new TestHelpers(page);
        
        await page.goto('/path');
        await helpers.waitForPageReady();
        
        // Your test logic here
        await expect(page.locator('selector')).toBeVisible();
    });
});
```

### Using Test Helpers

```typescript
const helpers = new TestHelpers(page);

// Wait for page to be ready
await helpers.waitForPageReady();

// Check if element exists
const exists = await helpers.elementExists('selector');

// Fill form if it exists
await helpers.fillIfExists('input[name="email"]', 'test@example.com');

// Take screenshot
await helpers.takeScreenshot('test-name');

// Check responsiveness
const responsive = await helpers.checkResponsiveness();
```

### Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Wait for page readiness** before making assertions
3. **Handle optional elements** gracefully using helper methods
4. **Take screenshots** for visual verification
5. **Test across viewports** for responsive design
6. **Mock API calls** to avoid external dependencies
7. **Check for JavaScript errors** in critical flows
8. **Test keyboard navigation** for accessibility

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in playwright.config.ts
   - Check if page is loading properly
   - Verify network conditions

2. **Element not found**
   - Use `elementExists()` helper to check first
   - Wait for dynamic content to load
   - Check if selector is correct

3. **Browser installation issues**
   - Run `bunx playwright install --with-deps`
   - Check system requirements
   - Try installing specific browsers

4. **Flaky tests**
   - Add proper waits for dynamic content
   - Use `waitForPageReady()` helper
   - Check for race conditions

### Debug Mode

```bash
# Run in debug mode to step through tests
bun run test:e2e:debug

# Run specific test in debug mode
bunx playwright test --debug tests/landing-page.spec.ts
```

## Performance Considerations

- Tests run in parallel by default
- Use `fullyParallel: true` in config for faster execution
- Mock external API calls to reduce network dependency
- Take screenshots only when necessary
- Use appropriate timeouts for different operations

## Maintenance

- Update browser versions regularly
- Review and update test selectors as UI changes
- Monitor test execution times
- Update compatibility matrix documentation
- Review failed tests and update as needed
