# Layered Deploy - Quick Reference

## 🚀 Quick Start

### GitHub Actions (Recommended)
1. Go to **Actions** tab
2. Select **"Layered Deploy Workflow"**
3. Click **"Run workflow"**
4. Enter feature branch name
5. Click **"Run workflow"**

### Shell Script
```bash
# Basic deployment
./scripts/layered-deploy.sh fix/password-reset

# Auto-merge + Vercel deploy
./scripts/layered-deploy.sh feature/new-ui --auto-merge --vercel-deploy

# Skip production
./scripts/layered-deploy.sh hotfix/security --no-production
```

## 📋 Common Commands

### Create and Deploy Feature
```bash
# 1. Create feature branch
git checkout -b feature/user-dashboard
# ... make changes ...
git add . && git commit -m "Add user dashboard"
git push origin feature/user-dashboard

# 2. Deploy
./scripts/layered-deploy.sh feature/user-dashboard --vercel-deploy
```

### Hotfix Deployment
```bash
# 1. Create hotfix branch
git checkout -b hotfix/security-vulnerability
# ... make changes ...
git add . && git commit -m "Fix security vulnerability"
git push origin hotfix/security-vulnerability

# 2. Deploy with auto-merge
./scripts/layered-deploy.sh hotfix/security-vulnerability --auto-merge --vercel-deploy
```

### Emergency Rollback
```bash
# 1. Find last good commit
git log --oneline production -10

# 2. Reset production
git checkout production
git reset --hard <last-good-commit>
git push origin production --force

# 3. Redeploy
vercel --prod
```

## 🔧 Troubleshooting

### Feature Branch Not Found
```bash
git push origin your-branch-name
```

### Fast-forward Merge Failed
```bash
git checkout your-branch
git rebase main
git push origin your-branch --force-with-lease
```

### GitHub CLI Not Authenticated
```bash
gh auth login
```

### Vercel CLI Not Found
```bash
npm install -g vercel
vercel login
```

## 📊 Workflow Options

| Option | Description | Example |
|--------|-------------|---------|
| `--auto-merge` | Auto-merge PRs | `--auto-merge` |
| `--no-production` | Skip production | `--no-production` |
| `--vercel-deploy` | Deploy to Vercel | `--vercel-deploy` |
| `--title "Title"` | Custom PR title | `--title "Bug Fix"` |
| `--body "Body"` | Custom PR body | `--body "Fixes critical issue"` |

## 🎯 Branch Naming

| Type | Prefix | Example |
|------|--------|---------|
| Bug Fix | `fix/` | `fix/password-reset` |
| Feature | `feature/` | `feature/user-dashboard` |
| Hotfix | `hotfix/` | `hotfix/security-vulnerability` |
| Chore | `chore/` | `chore/update-dependencies` |

## 📝 Commit Messages

```bash
# Good
git commit -m "fix: resolve password reset email issue"
git commit -m "feat: add user dashboard with charts"
git commit -m "chore: update dependencies to latest versions"

# Bad
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "updates"
```

## 🔍 Verification Checklist

Before deploying:
- [ ] All tests pass
- [ ] Code is linted
- [ ] No console.log statements
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] Documentation updated

After deploying:
- [ ] Application loads correctly
- [ ] Key features work
- [ ] No errors in logs
- [ ] Performance is acceptable
- [ ] Rollback plan ready

## 🆘 Emergency Contacts

- **GitHub Issues**: Create issue in repository
- **Slack**: #dev-support channel
- **Email**: dev-team@company.com

## 📚 Full Documentation

See [LAYERED_DEPLOY_WORKFLOW.md](./LAYERED_DEPLOY_WORKFLOW.md) for complete documentation.