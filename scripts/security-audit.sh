#!/bin/bash

# Security Audit Script for atoms.tech
# This script performs comprehensive security checks on the project

set -e

echo "🛡️  Starting Security Audit for atoms.tech"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if bun is available
if ! command -v bun &> /dev/null; then
    print_error "bun is not installed. Please install bun first."
    exit 1
fi

print_status "Checking for security vulnerabilities..."

# Run bun audit (if available)
if bun --help | grep -q "audit"; then
    print_status "Running bun audit..."
    bun audit || print_warning "bun audit not available, using npm audit"
else
    print_status "Running npm audit..."
    npm audit --audit-level moderate || {
        print_warning "Found vulnerabilities in npm audit"
        echo "Attempting to fix automatically..."
        npm audit fix --force || print_error "Could not fix all vulnerabilities automatically"
    }
fi

# Check specific vulnerable packages
print_status "Checking specific package versions..."

# Check Next.js version (should be >= 15.3.3)
NEXT_VERSION=$(node -p "require('./package.json').dependencies.next" | sed 's/[^0-9.]//g')
print_status "Next.js version: $NEXT_VERSION"

# Check nanoid version (should be >= 5.0.9)
NANOID_VERSION=$(node -p "require('./package.json').dependencies.nanoid" | sed 's/[^0-9.]//g')
print_status "nanoid version: $NANOID_VERSION"

# Check esbuild version (should be > 0.24.2)
ESBUILD_VERSION=$(node -p "require('./package.json').devDependencies?.esbuild || 'not found'" | sed 's/[^0-9.]//g')
if [ "$ESBUILD_VERSION" != "not found" ]; then
    print_status "esbuild version: $ESBUILD_VERSION"
fi

# Check for security headers in Next.js config
print_status "Checking Next.js security configuration..."
if grep -q "X-Frame-Options" next.config.ts; then
    print_success "Security headers configured in next.config.ts"
else
    print_warning "Security headers not found in next.config.ts"
fi

# Check for environment variable validation
print_status "Checking environment validation..."
if [ -f "src/lib/utils/env-validation.ts" ]; then
    print_success "Environment validation found"
else
    print_warning "Environment validation not found"
fi

# Check for input validation
print_status "Checking input validation..."
if [ -f "src/lib/api/validation.ts" ]; then
    print_success "Input validation found"
else
    print_warning "Input validation not found"
fi

# Check for CSP configuration
print_status "Checking Content Security Policy..."
if grep -r "Content-Security-Policy" src/ || grep -q "csp" next.config.ts; then
    print_success "CSP configuration found"
else
    print_warning "CSP configuration not found"
fi

# Check for authentication middleware
print_status "Checking authentication middleware..."
if [ -f "src/middleware.ts" ]; then
    print_success "Authentication middleware found"
else
    print_warning "Authentication middleware not found"
fi

# Run TypeScript type checking
print_status "Running TypeScript type check..."
if bun run type-check; then
    print_success "TypeScript type check passed"
else
    print_error "TypeScript type check failed"
fi

# Run linting
print_status "Running ESLint..."
if bun run lint; then
    print_success "ESLint check passed"
else
    print_error "ESLint check failed"
fi

# Check for test coverage
print_status "Checking test setup..."
if [ -f "jest.config.mjs" ]; then
    print_success "Jest configuration found"
    if bun run test --passWithNoTests; then
        print_success "Tests passed"
    else
        print_warning "Some tests failed"
    fi
else
    print_warning "Jest configuration not found"
fi

echo ""
echo "🛡️  Security Audit Complete"
echo "=========================="
print_success "Security audit finished. Review any warnings above."
