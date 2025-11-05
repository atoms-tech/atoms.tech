# Testing Guide

## Overview

This project uses **Vitest** as the testing framework, replacing Jest for better performance and modern tooling support.

## Quick Start

```bash
# Run all tests
bun run test

# Run tests in watch mode (interactive)
bun test

# Run tests once (CI mode)
bun run test:run

# Run tests with coverage
bun run test:coverage

# Run tests with UI
bun run test:ui
```

## Why Vitest?

- **2-5x faster** than Jest
- **Native ESM support** - no transform needed
- **Compatible with Jest API** - easy migration
- **Better watch mode** - instant feedback
- **Vite ecosystem integration** - works seamlessly with modern tooling
- **Better DX** - clearer error messages, better debugging

## Test Structure

```
src/
├── lib/
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── classnames.test.ts
│   │   │   └── pkce.test.ts
│   │   ├── utils.ts
│   │   └── pkce.ts
```

## Writing Tests

### Basic Test Example

```typescript
import { describe, expect, it } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
    it('should do something', () => {
        const result = myFunction('input');
        expect(result).toBe('expected output');
    });
});
```

### Testing React Components

```typescript
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
    it('should render correctly', () => {
        render(<MyComponent />);
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });
});
```

### Mocking

```typescript
import { describe, expect, it, vi } from 'vitest';

// Mock a module
vi.mock('../api', () => ({
    fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' })),
}));

// Mock fetch
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
    })
);
```

## Configuration

### vitest.config.ts

- **Environment**: `happy-dom` (faster than jsdom)
- **Globals**: Enabled (no need to import `describe`, `it`, `expect`)
- **Coverage**: v8 provider with 80% thresholds
- **Timeout**: 10 seconds for integration tests

### vitest.setup.ts

Global setup file that:
- Configures `@testing-library/jest-dom` matchers
- Mocks Next.js router and headers
- Mocks WorkOS AuthKit
- Provides helper functions for mocking fetch

## Coverage

Coverage reports are generated in the `coverage/` directory.

```bash
# Generate coverage report
bun run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Thresholds

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

## Best Practices

1. **Test file naming**: `*.test.ts` or `*.spec.ts`
2. **Co-locate tests**: Place tests in `__tests__` folder next to source files
3. **Descriptive names**: Use clear, descriptive test names
4. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and assertion
5. **One assertion per test**: Keep tests focused and simple
6. **Mock external dependencies**: Don't make real API calls in tests
7. **Clean up**: Use `afterEach` to reset mocks and state

## Debugging Tests

### VS Code

Add to `.vscode/launch.json`:

```json
{
    "type": "node",
    "request": "launch",
    "name": "Debug Vitest Tests",
    "runtimeExecutable": "bun",
    "runtimeArgs": ["run", "test"],
    "console": "integratedTerminal",
    "internalConsoleOptions": "neverOpen"
}
```

### Chrome DevTools

```bash
bun run test --inspect-brk
```

Then open `chrome://inspect` in Chrome.

## Migration from Jest

If you have existing Jest tests:

1. Replace `jest` imports with `vitest`
2. Update mock syntax if needed
3. Run tests to verify

Most Jest tests work without changes!

## Current Test Coverage

- ✅ `src/lib/utils.ts` - 100% coverage (7 tests)
- ✅ `src/lib/utils/pkce.ts` - 100% coverage (19 tests)

**Total: 26 tests passing**

