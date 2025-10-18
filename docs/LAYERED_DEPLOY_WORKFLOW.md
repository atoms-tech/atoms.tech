# Layered Deploy Workflow

This document describes the automated layered deployment system that maintains a clean Git tree structure while ensuring safe deployments.

## Overview

The layered deploy workflow follows this pattern:
```
feature-branch → main → production
```

This ensures:
- ✅ Clean commit history
- ✅ Proper code review process
- ✅ Safe production deployments
- ✅ Rollback capabilities
- ✅ Audit trail

## Methods

### 1. GitHub Actions Workflow (Recommended)

**File**: `.github/workflows/layered-deploy.yml`

**Usage**: Go to Actions tab → "Layered Deploy Workflow" → "Run workflow"

**Inputs**:
- `feature_branch`: The branch to deploy (required)
- `deploy_to_production`: Whether to deploy to production (default: true)
- `pr_title`: Custom PR title (optional)
- `pr_body`: Custom PR body (optional)

**Features**:
- ✅ Automated PR creation
- ✅ Optional auto-merge
- ✅ Vercel deployment integration
- ✅ Comprehensive logging
- ✅ Error handling

### 2. Shell Script (Local)

**File**: `scripts/layered-deploy.sh`

**Usage**:
```bash
# Basic usage
./scripts/layered-deploy.sh fix/password-reset

# With options
./scripts/layered-deploy.sh feature/new-ui --auto-merge --vercel-deploy

# Skip production deployment
./scripts/layered-deploy.sh hotfix/security --no-production

# Custom PR details
./scripts/layered-deploy.sh fix/bug --title "Bug Fix" --body "Fixes critical issue"
```

**Options**:
- `--auto-merge`: Auto-merge PRs without waiting for approval
- `--no-production`: Skip production deployment
- `--vercel-deploy`: Deploy to Vercel after production merge
- `--title "PR Title"`: Custom PR title
- `--body "PR Body"`: Custom PR body
- `--help`: Show help message

## Prerequisites

### For GitHub Actions:
- Repository must have GitHub Actions enabled
- `GITHUB_TOKEN` must have appropriate permissions
- Vercel integration (optional)

### For Shell Script:
- GitHub CLI (`gh`) installed and authenticated
- Git repository with proper remote setup
- Vercel CLI (optional, for deployment)

## Workflow Steps

### 1. Feature Branch Validation
- Checks if feature branch exists on remote
- Validates branch is up to date
- Ensures clean working directory

### 2. PR to Main
- Creates PR from feature branch to main
- Generates appropriate title and body
- Assigns to current user
- Optionally auto-merges

### 3. Fast-forward Merge to Main
- Checks out main branch
- Fast-forward merges feature branch
- Pushes to remote main

### 4. PR to Production
- Creates PR from main to production
- Generates production-specific title and body
- Assigns to current user

### 5. Fast-forward Merge to Production
- Checks out production branch
- Fast-forward merges main
- Pushes to remote production

### 6. Vercel Deployment (Optional)
- Deploys to Vercel production
- Provides deployment URL

### 7. Cleanup
- Closes PRs if auto-merged
- Cleans up local branches
- Provides summary

## Examples

### Hotfix Deployment
```bash
# Create hotfix branch
git checkout -b hotfix/security-vulnerability
# ... make changes ...
git add . && git commit -m "Fix security vulnerability"
git push origin hotfix/security-vulnerability

# Deploy with auto-merge
./scripts/layered-deploy.sh hotfix/security-vulnerability --auto-merge --vercel-deploy
```

### Feature Deployment
```bash
# Create feature branch
git checkout -b feature/new-dashboard
# ... make changes ...
git add . && git commit -m "Add new dashboard"
git push origin feature/new-dashboard

# Deploy with manual review
./scripts/layered-deploy.sh feature/new-dashboard --vercel-deploy
```

### Emergency Fix
```bash
# Use GitHub Actions for immediate deployment
# Go to Actions → Layered Deploy Workflow → Run workflow
# Input: hotfix/emergency-fix
# Check: deploy_to_production
```

## Best Practices

### 1. Branch Naming
- Use descriptive names: `fix/password-reset`, `feature/user-dashboard`
- Include type prefix: `fix/`, `feature/`, `hotfix/`, `chore/`
- Keep names concise but clear

### 2. Commit Messages
- Use conventional commits: `fix:`, `feat:`, `chore:`
- Include detailed descriptions
- Reference issues when applicable

### 3. PR Descriptions
- Include summary of changes
- List verification steps
- Mention any breaking changes
- Include screenshots for UI changes

### 4. Testing
- Test locally before deploying
- Ensure all tests pass
- Verify functionality in staging

### 5. Rollback Strategy
- Keep production branch clean
- Use feature flags when possible
- Document rollback procedures

## Troubleshooting

### Common Issues

#### 1. Feature Branch Not Found
```
Error: Feature branch 'fix/example' does not exist on remote
```
**Solution**: Ensure branch is pushed to remote
```bash
git push origin fix/example
```

#### 2. Fast-forward Merge Failed
```
Error: fatal: Not possible to fast-forward
```
**Solution**: Rebase feature branch on main
```bash
git checkout fix/example
git rebase main
git push origin fix/example --force-with-lease
```

#### 3. GitHub CLI Not Authenticated
```
Error: Not authenticated with GitHub
```
**Solution**: Authenticate with GitHub
```bash
gh auth login
```

#### 4. Vercel Deployment Failed
```
Error: Vercel CLI not found
```
**Solution**: Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### Recovery Procedures

#### 1. Rollback Production
```bash
# Find last good commit
git log --oneline production -10

# Reset production to last good commit
git checkout production
git reset --hard <last-good-commit>
git push origin production --force

# Redeploy
vercel --prod
```

#### 2. Fix Broken Main
```bash
# Revert problematic commit
git checkout main
git revert <bad-commit>
git push origin main

# Update production
git checkout production
git merge main
git push origin production
```

## Security Considerations

### 1. Token Management
- Never expose tokens in logs
- Use environment variables
- Rotate tokens regularly

### 2. Access Control
- Limit who can trigger deployments
- Use branch protection rules
- Require reviews for critical changes

### 3. Audit Trail
- All deployments are logged
- PR history is maintained
- Rollback procedures documented

## Monitoring

### 1. Deployment Status
- Check GitHub Actions status
- Monitor Vercel deployments
- Verify application health

### 2. Error Tracking
- Review deployment logs
- Monitor application errors
- Set up alerts for failures

### 3. Performance
- Track deployment times
- Monitor application performance
- Optimize workflow as needed

## Advanced Usage

### 1. Custom Workflows
Create custom workflows for specific needs:
```yaml
# .github/workflows/custom-deploy.yml
name: Custom Deploy
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
        - staging
        - production
```

### 2. Integration with CI/CD
Integrate with existing CI/CD pipelines:
```yaml
# Add to existing workflow
- name: Deploy to Production
  if: github.ref == 'refs/heads/main'
  run: |
    ./scripts/layered-deploy.sh ${{ github.ref_name }} --auto-merge --vercel-deploy
```

### 3. Automated Testing
Add automated testing to the workflow:
```yaml
- name: Run Tests
  run: |
    npm test
    npm run lint
    npm run type-check
```

## Support

For issues or questions:
1. Check this documentation
2. Review GitHub Actions logs
3. Check shell script output
4. Create an issue in the repository

## Changelog

### v1.0.0
- Initial release
- GitHub Actions workflow
- Shell script implementation
- Comprehensive documentation