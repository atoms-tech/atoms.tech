# 🤖 Agent Network Orchestrator Prompt: Comprehensive Testing Framework Implementation

## 🎯 **Mission Statement**

Implement a world-class testing framework for the Atoms.tech platform covering unit testing, integration testing, end-to-end testing, visual regression testing, performance testing, and accessibility testing using Jest, Playwright, and modern testing best practices.

## 📋 **Project Context**

- **Repository**: https://github.com/atoms-tech/atoms.tech
- **Branch**: `feature/ms-word-home-page-with-settings`
- **Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Supabase
- **Current State**: MS-Word like home page with tabbed interface implemented
- **Testing Gap**: No comprehensive testing framework exists

## 🏗️ **Agent Network Structure**

### **🎭 Orchestrator Agent (You)**

**Role**: Coordinate all testing agents, ensure integration, manage dependencies
**Responsibilities**:

- Break down testing implementation into logical phases
- Assign tasks to specialist agents
- Ensure consistency across testing approaches
- Validate integration between different testing layers
- Manage CI/CD pipeline integration

### **🧪 Unit Testing Specialist**

**Framework**: Jest + React Testing Library + MSW
**Focus Areas**:

- Component testing (InProgressContainer, InProgressModal, RecentActivityTab, SettingsTab)
- Hook testing (useAuth, useUser, custom hooks)
- Utility function testing
- API function mocking and testing
  **Deliverables**:
- Jest configuration with TypeScript support
- Test utilities and custom render functions
- MSW setup for API mocking
- 90%+ code coverage for critical components

### **🎬 E2E Testing Specialist**

**Framework**: Playwright with TypeScript
**Focus Areas**:

- Authentication flows (GitHub OAuth, session management)
- Home page workflows (tab switching, modal interactions)
- Navigation testing (sidebar, routing, breadcrumbs)
- Cross-browser compatibility
  **Deliverables**:
- Playwright configuration for multiple browsers
- Page Object Model implementation
- Critical user journey tests
- Video recording and screenshot capture

### **👁️ Visual Regression Specialist**

**Framework**: Playwright Visual Comparisons + Percy/Chromatic
**Focus Areas**:

- Component visual snapshots
- Responsive design testing
- Theme switching (light/dark mode)
- Cross-browser visual consistency
  **Deliverables**:
- Visual testing configuration
- Component snapshot library
- Responsive breakpoint testing
- Visual diff reporting integration

### **⚡ Performance Testing Specialist**

**Framework**: Lighthouse CI + Playwright Performance API
**Focus Areas**:

- Core Web Vitals monitoring
- Bundle size analysis
- Load time optimization
- Performance regression detection
  **Deliverables**:
- Lighthouse CI configuration
- Performance budgets and thresholds
- Bundle analysis automation
- Performance monitoring dashboard

### **♿ Accessibility Testing Specialist**

**Framework**: axe-playwright + Pa11y
**Focus Areas**:

- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation testing
- Color contrast validation
  **Deliverables**:
- Accessibility testing configuration
- WCAG compliance test suite
- Keyboard navigation automation
- Accessibility reporting dashboard

## 🚀 **Implementation Phases**

### **Phase 1: Foundation Setup (Days 1-3)**

**Orchestrator Tasks**:

- Create testing directory structure
- Set up base configurations
- Establish CI/CD pipeline integration

**Agent Tasks**:

- **Unit Testing**: Jest + RTL configuration, test utilities
- **E2E Testing**: Playwright setup, browser configuration
- **Visual**: Percy/Chromatic integration setup
- **Performance**: Lighthouse CI configuration
- **Accessibility**: axe-playwright setup

### **Phase 2: Core Feature Testing (Days 4-7)**

**Focus**: Test the newly implemented MS-Word home page features

**Agent Tasks**:

- **Unit Testing**: Test InProgressContainer, InProgressModal, tab components
- **E2E Testing**: Test tab switching, modal interactions, navigation
- **Visual**: Capture component snapshots, responsive layouts
- **Performance**: Baseline performance metrics for home page
- **Accessibility**: WCAG compliance for new components

### **Phase 3: Authentication & Navigation (Days 8-10)**

**Focus**: Test critical authentication and navigation flows

**Agent Tasks**:

- **Unit Testing**: Auth hooks, user context, session management
- **E2E Testing**: GitHub OAuth flow, login/logout, protected routes
- **Visual**: Authentication UI states, loading states
- **Performance**: Auth flow performance, route transitions
- **Accessibility**: Auth form accessibility, focus management

### **Phase 4: Integration & Optimization (Days 11-14)**

**Focus**: Cross-layer integration and optimization

**Orchestrator Tasks**:

- Validate test integration across all layers
- Optimize test execution times
- Set up parallel test execution
- Configure test reporting and dashboards

## 📊 **Quality Standards**

### **Code Quality**

- TypeScript strict mode compliance
- ESLint + Prettier formatting
- 90%+ test coverage for critical paths
- Zero accessibility violations

### **Test Quality**

- Fast execution (< 30 seconds for unit tests)
- Reliable (< 1% flaky test rate)
- Maintainable (clear test descriptions, good abstractions)
- Comprehensive (covers happy path + edge cases)

### **CI/CD Integration**

- All tests run on PR creation
- Visual tests require approval for changes
- Performance budgets enforced
- Accessibility gates prevent regressions

## 🛠️ **Technical Requirements**

### **Dependencies to Install**

```bash
# Testing frameworks
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jest jest-environment-jsdom @playwright/test
npm install -D axe-playwright lighthouse @percy/playwright
npm install -D msw supertest

# Type definitions
npm install -D @types/jest @types/supertest
```

### **Configuration Files Needed**

- `jest.config.js` - Jest configuration with TypeScript
- `playwright.config.ts` - Playwright multi-browser setup
- `tests/setup/test-utils.tsx` - Custom render functions
- `tests/setup/mocks/` - MSW API mocks
- `.github/workflows/tests.yml` - CI/CD pipeline

## 🎯 **Success Criteria**

### **Completion Metrics**

- ✅ All 6 testing layers implemented and integrated
- ✅ 90%+ code coverage achieved
- ✅ All critical user journeys covered by E2E tests
- ✅ Visual regression testing operational
- ✅ Performance budgets established and enforced
- ✅ WCAG 2.1 AA compliance achieved
- ✅ CI/CD pipeline fully automated

### **Quality Metrics**

- ✅ Test execution time < 5 minutes total
- ✅ Flaky test rate < 1%
- ✅ Performance regression detection working
- ✅ Visual diff approval workflow operational
- ✅ Accessibility violations = 0

## 🚨 **Critical Implementation Notes**

### **Existing Codebase Integration**

- Work with existing pre-commit hooks (Husky + lint-staged)
- Respect existing ESLint and Prettier configurations
- Integrate with existing GitHub Actions workflows
- Maintain compatibility with existing development workflow

### **MS-Word Home Page Focus**

- Prioritize testing the newly implemented home page features
- Test InProgressContainer and InProgressModal components thoroughly
- Validate tab switching and modal interactions
- Ensure responsive design testing for new components

### **Authentication Considerations**

- Test GitHub OAuth integration (requires two refreshes)
- Mock Supabase authentication in unit tests
- Test protected route behavior
- Validate session persistence

## 🎬 **Execution Command**

Each specialist agent should:

1. **Read the full context** from TESTING_FRAMEWORK_PLAN.md
2. **Implement their specific testing layer** according to the plan
3. **Integrate with the overall testing strategy**
4. **Provide comprehensive documentation** for their implementation
5. **Ensure CI/CD integration** for their testing layer

**Start with**: "I'll implement the [TESTING_LAYER] for the Atoms.tech platform, focusing on the newly implemented MS-Word home page features..."
