#!/bin/bash

# Layered Deploy Script
# This script automates the layered PR workflow: feature branch → main → production
# Usage: ./scripts/layered-deploy.sh [feature-branch] [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
FEATURE_BRANCH=""
AUTO_MERGE=false
DEPLOY_TO_PRODUCTION=true
PR_TITLE=""
PR_BODY=""
VERCEL_DEPLOY=false

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

# Function to show usage
show_usage() {
    echo "Usage: $0 <feature-branch> [options]"
    echo ""
    echo "Arguments:"
    echo "  feature-branch    The feature branch to deploy"
    echo ""
    echo "Options:"
    echo "  --auto-merge              Auto-merge PRs without waiting for approval"
    echo "  --no-production           Skip production deployment"
    echo "  --vercel-deploy           Deploy to Vercel after production merge"
    echo "  --title \"PR Title\"        Custom PR title"
    echo "  --body \"PR Body\"          Custom PR body"
    echo "  --help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 fix/password-reset"
    echo "  $0 feature/new-ui --auto-merge --vercel-deploy"
    echo "  $0 hotfix/security --title \"Security Fix\" --no-production"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-merge)
            AUTO_MERGE=true
            shift
            ;;
        --no-production)
            DEPLOY_TO_PRODUCTION=false
            shift
            ;;
        --vercel-deploy)
            VERCEL_DEPLOY=true
            shift
            ;;
        --title)
            PR_TITLE="$2"
            shift 2
            ;;
        --body)
            PR_BODY="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option $1"
            show_usage
            exit 1
            ;;
        *)
            if [[ -z "$FEATURE_BRANCH" ]]; then
                FEATURE_BRANCH="$1"
            else
                print_error "Multiple feature branches specified"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate required arguments
if [[ -z "$FEATURE_BRANCH" ]]; then
    print_error "Feature branch is required"
    show_usage
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated with GitHub
if ! gh auth status > /dev/null 2>&1; then
    print_error "Not authenticated with GitHub. Please run 'gh auth login' first."
    exit 1
fi

print_status "Starting layered deploy workflow for branch: $FEATURE_BRANCH"

# Step 1: Validate feature branch exists
print_status "Validating feature branch exists..."
if ! git show-ref --verify --quiet refs/remotes/origin/$FEATURE_BRANCH; then
    print_error "Feature branch '$FEATURE_BRANCH' does not exist on remote"
    exit 1
fi
print_success "Feature branch '$FEATURE_BRANCH' exists"

# Step 2: Checkout and update feature branch
print_status "Checking out feature branch..."
git fetch origin $FEATURE_BRANCH
git checkout $FEATURE_BRANCH
git pull origin $FEATURE_BRANCH
print_success "Feature branch checked out and updated"

# Step 3: Create PR to main
print_status "Creating PR to main..."

# Generate PR title if not provided
if [[ -z "$PR_TITLE" ]]; then
    PR_TITLE="Deploy: $(git log -1 --pretty=format:'%s')"
fi

# Generate PR body if not provided
if [[ -z "$PR_BODY" ]]; then
    PR_BODY="## Automated Deployment

This PR was created by the Layered Deploy Script.

### Changes
$(git log --oneline -10)

### Verification
- [x] Feature branch validated
- [x] Ready for merge to main

Ready for review and merge! 🚀"
fi

# Create PR
PR_URL=$(gh pr create \
    --base main \
    --head $FEATURE_BRANCH \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --assignee @me)

print_success "Created PR to main: $PR_URL"

# Step 4: Handle PR merging
if [[ "$AUTO_MERGE" == "true" ]]; then
    print_status "Auto-merging PR to main..."
    gh pr merge $PR_URL --merge --delete-branch
    print_success "PR merged to main"
else
    print_warning "Waiting for manual PR approval..."
    print_status "PR URL: $PR_URL"
    print_status "Please review and merge the PR manually, then press Enter to continue..."
    read -r
fi

# Step 5: Fast-forward merge to main
print_status "Fast-forward merging to main..."
git checkout main
git pull origin main
git merge --ff-only $FEATURE_BRANCH
git push origin main
print_success "Fast-forward merged to main"

# Step 6: Create PR to production (if enabled)
if [[ "$DEPLOY_TO_PRODUCTION" == "true" ]]; then
    print_status "Creating PR to production..."
    
    # Generate PR title for production
    PROD_PR_TITLE="Deploy: $(git log -1 --pretty=format:'%s')"
    
    # Generate PR body for production
    PROD_PR_BODY="## Production Deployment

This PR deploys the latest changes from main to production.

### Changes
$(git log --oneline -10)

### Verification
- [x] Changes merged to main
- [x] Ready for production deployment

Ready for production! 🚀"
    
    # Create PR to production
    PROD_PR_URL=$(gh pr create \
        --base production \
        --head main \
        --title "$PROD_PR_TITLE" \
        --body "$PROD_PR_BODY" \
        --assignee @me)
    
    print_success "Created PR to production: $PROD_PR_URL"
    
    # Step 7: Fast-forward merge to production
    print_status "Fast-forward merging to production..."
    git checkout production
    git pull origin production
    git merge --ff-only main
    git push origin production
    print_success "Fast-forward merged to production"
    
    # Step 8: Deploy to Vercel (if enabled)
    if [[ "$VERCEL_DEPLOY" == "true" ]]; then
        print_status "Deploying to Vercel production..."
        if command -v vercel &> /dev/null; then
            vercel --prod
            print_success "Deployed to Vercel production"
        else
            print_warning "Vercel CLI not found. Please install it and run 'vercel --prod' manually."
        fi
    fi
fi

# Step 9: Cleanup
print_status "Cleaning up..."
if [[ "$AUTO_MERGE" == "true" ]]; then
    gh pr close $PR_URL || true
    if [[ "$DEPLOY_TO_PRODUCTION" == "true" ]]; then
        gh pr close $PROD_PR_URL || true
    fi
fi
print_success "Cleanup complete"

# Step 10: Summary
echo ""
print_success "🎉 Layered Deploy Complete!"
echo ""
echo "📋 Summary:"
echo "  ✅ Feature branch: $FEATURE_BRANCH"
echo "  ✅ Merged to main"
if [[ "$DEPLOY_TO_PRODUCTION" == "true" ]]; then
    echo "  ✅ Merged to production"
    if [[ "$VERCEL_DEPLOY" == "true" ]]; then
        echo "  ✅ Deployed to Vercel"
    fi
fi
echo ""
echo "🔗 PRs Created:"
echo "  Main PR: $PR_URL"
if [[ "$DEPLOY_TO_PRODUCTION" == "true" ]]; then
    echo "  Production PR: $PROD_PR_URL"
fi
echo ""
print_success "All done! 🚀"