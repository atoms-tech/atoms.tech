# INTEGRATIONS SETTINGS PAGE - COMPREHENSIVE DEVELOPMENT PLAN

## 🎯 PROJECT OVERVIEW

### Primary Objective

**Create Integrations Settings Page** - MCP integrations management for chat agent/AI with OAuth integration management for Google, GitHub, Jira, Slack SSO with connect/disconnect functionality.

### Success Criteria

- All build/lint/tsc checks pass before PR
- Screenshots and video documentation included
- Stylistically aligned with existing design system
- Intuitive user experience for integration management
- Tenanted authentication by organization using Supabase Vault

## 📋 WORK BREAKDOWN STRUCTURE (WBS)

### PHASE 1: INTEGRATIONS PAGE FOUNDATION (Sprint 1 - Week 1)

**Duration**: 4-6 days
**Priority**: High

#### 2.1 Settings Page Structure

- **Task**: Create integrations settings page
- **Location**: `src/app/(protected)/org/[orgId]/settings/integrations/page.tsx`
- **Components**:
    - IntegrationsPage (main container)
    - IntegrationCard (individual integration)
    - ConnectionStatus (status indicator)
    - OAuthButton (connect/disconnect)

#### 2.2 MCP Integrations Management

- **Task**: Create MCP integration components
- **Location**: `src/components/custom/Integrations/`
- **Components**:
    - MCPIntegrationsList
    - MCPConfigurationModal
    - MCPStatusIndicator
    - MCPTestConnection

#### 2.3 OAuth Integration Framework

- **Task**: Create OAuth management system
- **Location**: `src/lib/integrations/oauth/`
- **Files**:
    - `oauthManager.ts` - Core OAuth logic
    - `providers/` - Individual provider implementations
    - `types.ts` - TypeScript interfaces
    - `supabaseVault.ts` - Secrets management

### PHASE 3: OAUTH PROVIDERS IMPLEMENTATION (Sprint 2 - Week 3)

**Duration**: 5-7 days
**Priority**: Medium

#### 3.1 Google OAuth Integration

- **Task**: Implement Google OAuth for integrations
- **Scope**: Drive, Gmail, Calendar APIs
- **Components**:
    - GoogleOAuthProvider
    - GoogleIntegrationCard
    - GooglePermissionsModal

#### 3.2 GitHub OAuth Integration

- **Task**: Extend existing GitHub OAuth
- **Scope**: Repositories, Issues, Pull Requests
- **Components**:
    - GitHubIntegrationCard
    - GitHubRepoSelector
    - GitHubWebhookManager

#### 3.3 Jira OAuth Integration

- **Task**: Implement Jira OAuth
- **Scope**: Projects, Issues, Workflows
- **Components**:
    - JiraOAuthProvider
    - JiraIntegrationCard
    - JiraProjectSelector

#### 3.4 Slack OAuth Integration

- **Task**: Implement Slack OAuth
- **Scope**: Channels, Messages, Notifications
- **Components**:
    - SlackOAuthProvider
    - SlackIntegrationCard
    - SlackChannelSelector

### PHASE 4: SUPABASE VAULT INTEGRATION (Sprint 2 - Week 4)

**Duration**: 3-4 days
**Priority**: High

#### 4.1 Vault Configuration

- **Task**: Set up Supabase Vault for secrets
- **Components**:
    - Vault client configuration
    - Encryption/decryption utilities
    - Organization-scoped secrets

#### 4.2 Tenanted Authentication

- **Task**: Implement org-scoped auth
- **Features**:
    - Organization-specific OAuth apps
    - Tenant isolation
    - Permission management

## 🛠 TECHNICAL ARCHITECTURE

### Component Structure

```
src/
├── app/(protected)/org/[orgId]/settings/integrations/
│   ├── page.tsx                    # Main integrations page
│   └── components/
│       ├── IntegrationsLayout.tsx
│       ├── IntegrationCard.tsx
│       └── ConnectionStatus.tsx
├── components/custom/
│   ├── BlockCanvas/components/EditableTable/
│   │   ├── MaterialUITableDemo.tsx
│   │   ├── MantineTableDemo.tsx
│   │   └── index.ts (updated)
│   └── Integrations/
│       ├── MCPIntegrationsList.tsx
│       ├── OAuthProviders/
│       │   ├── GoogleProvider.tsx
│       │   ├── GitHubProvider.tsx
│       │   ├── JiraProvider.tsx
│       │   └── SlackProvider.tsx
│       └── Common/
│           ├── OAuthButton.tsx
│           └── IntegrationModal.tsx
└── lib/
    ├── integrations/
    │   ├── oauth/
    │   │   ├── oauthManager.ts
    │   │   ├── providers/
    │   │   └── supabaseVault.ts
    │   └── mcp/
    │       ├── mcpManager.ts
    │       └── types.ts
    └── supabase/
        └── vault.ts
```

### Database Schema Extensions

```sql
-- OAuth integrations table
CREATE TABLE oauth_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    provider VARCHAR(50) NOT NULL,
    access_token_vault_key VARCHAR(255),
    refresh_token_vault_key VARCHAR(255),
    expires_at TIMESTAMP,
    scopes TEXT[],
    user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- MCP configurations table
CREATE TABLE mcp_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    configuration JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 DESIGN SPECIFICATIONS

### Visual Design System

- **Color Scheme**: Existing ATOMS design tokens
- **Typography**: Inter font family
- **Spacing**: 8px grid system
- **Components**: Shadcn/ui components
- **Icons**: Lucide React icons
- **Animations**: Framer Motion for transitions

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Settings Navigation                      │
├─────────────────────────────────────────┤
│ Integrations Header                     │
├─────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐        │
│ │   Google    │ │   GitHub    │        │
│ │ ○ Connected │ │ ● Connected │        │
│ │ [Disconnect]│ │ [Disconnect]│        │
│ └─────────────┘ └─────────────┘        │
│ ┌─────────────┐ ┌─────────────┐        │
│ │    Jira     │ │    Slack    │        │
│ │ ○ Not Conn. │ │ ○ Not Conn. │        │
│ │ [Connect]   │ │ [Connect]   │        │
│ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────┤
│ MCP Integrations Section                │
└─────────────────────────────────────────┘
```

## 🧪 TESTING STRATEGY

### Automated Testing

- **Unit Tests**: Jest for component logic
- **Integration Tests**: React Testing Library
- **E2E Tests**: Playwright for full workflows
- **Type Checking**: TypeScript strict mode

### Manual Testing Checklist

- [ ] Table demos render correctly
- [ ] OAuth flows complete successfully
- [ ] Connect/disconnect buttons work
- [ ] MCP integrations configure properly
- [ ] Responsive design functions
- [ ] Dark/light theme compatibility
- [ ] Accessibility compliance (WCAG 2.1)

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📦 DEPENDENCIES

### New Dependencies

```json
{
    "@mui/material": "^5.15.0",
    "@mui/x-data-grid": "^6.18.0",
    "@mui/icons-material": "^5.15.0",
    "@mantine/core": "^7.4.0",
    "@mantine/datatable": "^7.4.0",
    "@tabler/icons-react": "^3.0.0"
}
```

### Environment Variables

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=

# Supabase Vault
SUPABASE_VAULT_KEY=
```

## 🚀 DEPLOYMENT STRATEGY

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] ESLint checks passed
- [ ] Build process completed
- [ ] Environment variables configured
- [ ] Database migrations applied

### Rollout Plan

1. **Development**: Feature branch testing
2. **Staging**: Integration testing
3. **Production**: Gradual rollout with monitoring

## 📊 SUCCESS METRICS

### Technical Metrics

- Build time < 2 minutes
- Bundle size increase < 500KB
- Page load time < 3 seconds
- Zero TypeScript errors
- 100% test coverage for new components

### User Experience Metrics

- Integration setup time < 5 minutes
- OAuth success rate > 95%
- User satisfaction score > 4.5/5
- Support ticket reduction by 30%

## 🔄 MAINTENANCE PLAN

### Regular Updates

- Monthly dependency updates
- Quarterly security reviews
- OAuth token refresh automation
- Performance monitoring

### Documentation

- API documentation updates
- User guide creation
- Developer onboarding materials
- Troubleshooting guides

---

**Next Steps**: Begin Phase 1 implementation with table demos, followed by integrations page foundation.
