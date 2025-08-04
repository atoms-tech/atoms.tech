# Visual Regression Testing

This directory contains comprehensive visual regression tests for the atoms.tech application. These tests ensure that UI components render consistently across different browsers, screen sizes, themes, and states.

## Overview

The visual testing suite includes:

- **UI Component Tests**: All shadcn/ui components in various states
- **Custom Component Tests**: Application-specific components
- **Theme Tests**: Light and dark theme variants
- **Responsive Tests**: Different screen sizes and breakpoints
- **Interactive Tests**: Hover, focus, active, and loading states
- **Modal Tests**: Dialog and popup components
- **Cross-browser Tests**: Chrome, Firefox, Safari, and Edge

## Test Structure

```
tests/visual/
├── components/
│   ├── ui-components.spec.ts         # shadcn/ui components
│   └── custom-components.spec.ts     # Custom application components
├── layouts/
│   └── responsive-layouts.spec.ts    # Responsive layout tests
├── themes/
│   └── theme-variants.spec.ts        # Light/dark theme tests
├── interactions/
│   └── interactive-states.spec.ts    # Interactive state tests
├── utils/
│   └── visual-helpers.ts             # Test utilities and helpers
├── visual.config.ts                  # Playwright configuration
└── README.md                         # This file
```

## Configuration

The visual tests use a custom Playwright configuration (`visual.config.ts`) that:

- Tests across multiple browsers (Chrome, Firefox, Safari, Edge)
- Tests multiple screen sizes (mobile, tablet, desktop, large)
- Configures screenshot comparison settings
- Sets up proper timeouts and retry logic
- Masks dynamic content for consistent screenshots

## Running Tests

### Basic Commands

```bash
# Run all visual tests
npm run test:visual

# Run with UI mode (interactive)
npm run test:visual:ui

# Run in debug mode
npm run test:visual:debug

# Run with browser visible
npm run test:visual:headed

# Update baseline screenshots
npm run test:visual:update

# View test report
npm run test:visual:report
```

### Specific Test Categories

```bash
# Run only component tests
npm run test:visual:components

# Run only theme tests
npm run test:visual:themes

# Run only responsive tests
npm run test:visual:responsive

# Run only interaction tests
npm run test:visual:interactions

# Run all visual tests sequentially
npm run test:visual:full
```

### CI/CD Integration

```bash
# Run with GitHub Actions reporter
npm run test:visual:ci
```

## Test Development

### Adding New Component Tests

1. Create a new test file in the appropriate category directory
2. Import the visual helpers:

```typescript
import {
    takeVisualScreenshot,
    testComponentStates,
    testComponentThemes,
    testComponentResponsive,
    VisualTestOptions,
} from '../utils/visual-helpers';
```

3. Use the helper functions to create comprehensive tests:

```typescript
test('should render button correctly', async ({ page }) => {
    await page.goto('/visual-test-showcase/button');
    
    // Test different states
    await testComponentStates(page, 'button', [
        { state: 'default', selector: '[data-testid="button-default"]' },
        { state: 'hover', selector: '[data-testid="button-default"]' },
        { state: 'focus', selector: '[data-testid="button-default"]' },
        { state: 'disabled', selector: '[data-testid="button-disabled"]' },
    ]);
    
    // Test across themes
    await testComponentThemes(page, 'button', async () => {
        await page.goto('/visual-test-showcase/button');
    });
    
    // Test responsive behavior
    await testComponentResponsive(page, 'button', async () => {
        await page.goto('/visual-test-showcase/button');
    });
});
```

### Visual Test Showcase

The `/visual-test-showcase` page provides a comprehensive showcase of all UI components in various states. This page is specifically designed for visual testing and includes:

- All shadcn/ui components
- Custom application components
- Different component states (hover, focus, disabled, error, loading)
- Theme variants
- Form examples with validation
- Modal examples
- Interactive elements

### Helper Functions

The `visual-helpers.ts` file provides utility functions for:

- **Screenshot Management**: Consistent screenshot capture with proper timing
- **Theme Testing**: Switching between light and dark themes
- **Responsive Testing**: Testing across different screen sizes
- **State Testing**: Testing component states (hover, focus, etc.)
- **Modal Testing**: Testing dialog and popup components
- **Animation Handling**: Waiting for animations to complete
- **Dynamic Content Masking**: Hiding dynamic content for consistent screenshots

### Best Practices

1. **Test Data-Testids**: Use `data-testid` attributes for reliable element selection
2. **Mask Dynamic Content**: Use the `maskDynamicContent` option for timestamps and user-generated content
3. **Wait for Animations**: Use `waitForAnimations` option for components with transitions
4. **Descriptive Names**: Use descriptive screenshot names that indicate component, state, and variant
5. **Threshold Settings**: Use appropriate threshold values for screenshot comparison
6. **Full Page Screenshots**: Use `fullPage: true` for modal and layout tests

## Screenshot Management

### Baseline Screenshots

Baseline screenshots are stored in the test output directory and committed to version control. They serve as the reference images for comparison.

### Updating Baselines

When intentional UI changes are made:

```bash
# Update all baseline screenshots
npm run test:visual:update

# Update specific test baselines
npm run test:visual:update -- --grep "button"
```

### Screenshot Comparison

The tests use Playwright's built-in screenshot comparison with customized settings:

- **Threshold**: 0.3 (30% pixel difference tolerance)
- **Max Diff Pixels**: 100 pixels can differ
- **Animation Disabling**: CSS animations are disabled for consistency
- **Font Loading**: Tests wait for web fonts to load

## Browser Support

Visual tests run on:

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile
- **Tablet**: iPad Pro simulation
- **Large Screens**: 2560x1440 and above

## Theme Testing

All components are tested in:

- **Light Theme**: Default light appearance
- **Dark Theme**: Dark mode appearance
- **System Theme**: Respects system preference
- **High Contrast**: Accessibility-focused high contrast mode

## Responsive Testing

Components are tested across breakpoints:

- **Mobile**: 375px width
- **Tablet**: 768px width
- **Desktop**: 1920px width
- **Large**: 2560px width

## Debugging Visual Tests

### View Test Results

```bash
# Open HTML report
npm run test:visual:report

# Run specific test with debug mode
npx playwright test --config=tests/visual/visual.config.ts --debug --grep "button"
```

### Screenshot Diff Analysis

When tests fail, Playwright generates:

- **Expected**: Baseline screenshot
- **Actual**: Current screenshot
- **Diff**: Highlighted differences

### Common Issues

1. **Font Loading**: Ensure web fonts are loaded before taking screenshots
2. **Animations**: Disable animations for consistent results
3. **Dynamic Content**: Mask timestamps and user-generated content
4. **Timing**: Wait for component state changes to complete
5. **Viewport**: Ensure consistent viewport sizes across tests

## Integration with CI/CD

The visual tests are designed to run in CI/CD pipelines:

- **Deterministic**: Tests produce consistent results across environments
- **Docker Support**: Compatible with containerized testing environments
- **Parallel Execution**: Tests can run in parallel for faster feedback
- **GitHub Actions**: Integrated with GitHub Actions reporting

## Maintenance

### Regular Tasks

1. **Update Baselines**: After intentional UI changes
2. **Review Failures**: Investigate unexpected visual changes
3. **Add New Tests**: For new components and features
4. **Update Dependencies**: Keep Playwright and browsers updated
5. **Performance Monitoring**: Monitor test execution time

### Troubleshooting

1. **Flaky Tests**: Increase wait times or improve element selection
2. **Large Diffs**: Check for unintended CSS changes
3. **Browser Differences**: Adjust threshold settings if needed
4. **Slow Tests**: Optimize page loading and screenshot capture

## Contributing

When adding new visual tests:

1. Follow the existing test structure and naming conventions
2. Use the provided helper functions for consistency
3. Include comprehensive test coverage (states, themes, responsive)
4. Update this README if adding new categories or utilities
5. Ensure tests are deterministic and reliable

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Visual Testing Best Practices](https://playwright.dev/docs/test-screenshots)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Project Component Documentation](../../../src/components/README.md)