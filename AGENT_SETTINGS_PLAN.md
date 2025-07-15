# Agent Settings & MCP Integrations - Comprehensive Development Plan

## Project Overview
Develop a comprehensive settings page for chat agent/AI with MCP (Model Context Protocol) integrations and add guardrails for requirement document tables with automatic ID generation.

## Phase 1: Analysis & Planning ✅

### Current State Analysis
- **Authentication System**: OAuth flows for Google/GitHub via Supabase
- **Settings Infrastructure**: Basic AgentSettings component exists with N8N webhook configuration
- **REQ-ID System**: Multiple ID generation strategies (org, document, project scoped)
- **Table Components**: 3 implementations (EditableTable, TanStackEditableTable, GlideEditableTable)
- **MCP Integration**: N8N workflow with MCP trigger exists

### Key Findings
1. Existing OAuth patterns can be extended for new integrations
2. Supabase vault integration needed for secrets management
3. REQ-ID system needs consolidation and validation improvements
4. Settings page needs expansion for MCP integrations

## Phase 2: Settings Page Development

### 2.1 Core Settings Infrastructure
- [ ] Extend AgentSettings component with tabbed interface
- [ ] Add MCP integrations section
- [ ] Implement organization-scoped settings storage
- [ ] Create settings persistence layer

### 2.2 OAuth Integration Framework
**Target Integrations**: Google, GitHub, Jira, Slack

#### Components to Create:
- `MCPIntegrationCard` - Individual integration management
- `OAuthButton` - Reusable OAuth connection component
- `IntegrationStatus` - Connection status display
- `DisconnectButton` - OAuth disconnection handler

#### OAuth Flow Pattern:
```
1. User clicks "Connect [Service]"
2. Redirect to service OAuth endpoint
3. Handle callback with organization context
4. Store tokens in Supabase vault
5. Update UI to show connected state
6. Provide disconnect functionality
```

### 2.3 Supabase Vault Integration
- [ ] Create vault storage functions
- [ ] Implement encrypted token storage
- [ ] Add organization-scoped secret management
- [ ] Create token refresh mechanisms

### 2.4 Settings UI Components
- [ ] Tabbed settings interface
- [ ] Integration cards with status indicators
- [ ] Connection/disconnection flows
- [ ] Error handling and feedback

## Phase 3: REQ-ID Guardrails Enhancement

### 3.1 Current Issues to Address
- Multiple ID scoping strategies causing confusion
- Double increment issues in ID generation
- Missing validation for duplicate IDs
- Auto-insertion failures on new row creation

### 3.2 Consolidation Strategy
**Decision**: Use organization-scoped REQ-IDs only (REQ-{ORG_PREFIX}-001)

#### Implementation Plan:
- [ ] Remove document and project scoped generators
- [ ] Enhance organization-scoped validation
- [ ] Add duplicate detection with red highlighting
- [ ] Implement edit restrictions for existing IDs
- [ ] Fix auto-insertion on new row creation

### 3.3 Validation Components
- [ ] `RequirementIdValidator` - Real-time validation
- [ ] `DuplicateIdWarning` - Visual feedback component
- [ ] `IdEditRestriction` - Prevent editing existing IDs
- [ ] `BulkIdAssignment` - Modal for bulk operations

## Phase 4: Integration Testing & Documentation

### 4.1 Testing Strategy
- [ ] Unit tests for ID generation and validation
- [ ] Integration tests for OAuth flows
- [ ] E2E tests for settings page functionality
- [ ] Playwright tests for UI interactions

### 4.2 Documentation Requirements
- [ ] Settings page user guide
- [ ] MCP integration setup instructions
- [ ] REQ-ID system documentation
- [ ] Developer API documentation

## Technical Architecture

### Settings Page Structure
```
/org/[orgId]/settings/agent
├── General Settings Tab
├── MCP Integrations Tab
│   ├── Google Integration Card
│   ├── GitHub Integration Card
│   ├── Jira Integration Card
│   └── Slack Integration Card
└── Advanced Settings Tab
```

### Database Schema Extensions
```sql
-- Organization settings table
CREATE TABLE organization_agent_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    mcp_integrations JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- OAuth tokens in Supabase vault
-- Stored as encrypted secrets with organization context
```

### API Endpoints
- `POST /api/oauth/[provider]/connect` - Initiate OAuth flow
- `GET /api/oauth/[provider]/callback` - Handle OAuth callback
- `DELETE /api/oauth/[provider]/disconnect` - Remove integration
- `GET /api/settings/agent/[orgId]` - Get agent settings
- `PUT /api/settings/agent/[orgId]` - Update agent settings

## Success Criteria

### Phase 2 Success Metrics
- [ ] Settings page accessible at `/org/[orgId]/settings/agent`
- [ ] All 4 OAuth integrations functional (Google, GitHub, Jira, Slack)
- [ ] Connect/disconnect flows working
- [ ] Tokens securely stored in Supabase vault
- [ ] Organization-scoped settings persistence

### Phase 3 Success Metrics
- [ ] Single REQ-ID scoping strategy implemented
- [ ] Duplicate ID detection with visual feedback
- [ ] Edit restrictions on existing IDs
- [ ] Auto-insertion working on new row creation
- [ ] Bulk ID assignment modal functional

### Quality Gates
- [ ] All TypeScript compilation passes
- [ ] ESLint linting passes
- [ ] 100% test coverage maintained
- [ ] Playwright tests pass
- [ ] Performance benchmarks met

## Risk Mitigation

### Technical Risks
1. **OAuth Token Security**: Use Supabase vault encryption
2. **ID Collision**: Implement atomic increment with locks
3. **Performance**: Lazy load integrations, cache settings
4. **Browser Compatibility**: Test across major browsers

### User Experience Risks
1. **Complex UI**: Progressive disclosure, clear navigation
2. **Error Handling**: Comprehensive error messages and recovery
3. **Loading States**: Skeleton screens and progress indicators

## Next Steps
1. Create feature branch: `feature/agent-settings-mcp-integrations`
2. Implement Phase 2.1 - Core Settings Infrastructure
3. Set up Playwright testing environment
4. Begin OAuth integration development

---
*This plan will be updated throughout development following agile methodology*
