# Diagram Element Linking to Requirements - Implementation Plan

## Overview
Implement functionality to link diagram elements to requirements from project documents, similar to Excalidraw with enhanced requirement linking capabilities.

## User Requirements Analysis
Based on the conversation:
- **James**: Link diagram elements to requirements from project, with UI to make whatever element user wants, then extra option to link to a requirement in their docs
- **Koosha**: Components can have embedded URI (internal only or external too?), parser for LBL components as extra to recognize and suggest links  
- **Chris**: When you click on a box, there's an option (on the left side or top-right of box) to add a link, with easy UI component to understand what requirement they want to link
- **dwbv**: Internal links, behaves similar to Excalidraw or others, right-click element shows dropdown with actions including hyperlinking, plus parser on Labels that can detect and auto-link to existing artifacts

## Current System Analysis
- **Canvas System**: Uses Excalidraw wrapper at `/src/components/custom/LandingPage/excalidrawWrapper.tsx`
- **Requirements System**: Full requirements management with documents, traceability, and linking
- **Existing Linking**: TraceLinks system exists for requirement-to-requirement linking
- **UI Components**: Dropdown menus, context menus, and dialog systems available

## Implementation Phases

### Phase 1: Core Infrastructure (Foundation)
**Objective**: Set up the basic infrastructure for element-requirement linking

#### 1.1 Database Schema Extension
- Extend `excalidraw_diagrams` table to support element metadata
- Create `diagram_element_links` table:
  ```sql
  - id (uuid, primary key)
  - diagram_id (uuid, foreign key to excalidraw_diagrams)
  - element_id (text, Excalidraw element ID)
  - requirement_id (uuid, foreign key to requirements)
  - link_type (enum: 'manual', 'auto_detected')
  - created_at, updated_at, created_by
  ```

#### 1.2 API Layer
- Create hooks for diagram element links CRUD operations
- Extend existing requirement queries to include diagram links
- Add element link validation and conflict resolution

#### 1.3 Type Definitions
- Define TypeScript interfaces for element links
- Extend existing Excalidraw types with link metadata
- Create validation schemas

### Phase 2: Context Menu System (User Interaction)
**Objective**: Implement right-click context menu for element linking

#### 2.1 Context Menu Component
- Create `DiagramElementContextMenu` component
- Integrate with Excalidraw's event system
- Handle element selection and context menu positioning

#### 2.2 Link Management UI
- "Add Link to Requirement" menu option
- "Edit Link" for existing links
- "Remove Link" functionality
- Visual indicators for linked elements

#### 2.3 Requirement Selection Dialog
- Searchable requirement picker
- Filter by project/document
- Recent requirements quick access
- Requirement preview with description

### Phase 3: Visual Indicators & Navigation (User Experience)
**Objective**: Provide clear visual feedback and navigation

#### 3.1 Element Visual Indicators
- Subtle border/icon overlay for linked elements
- Hover tooltips showing linked requirement info
- Different visual states (linked, loading, error)

#### 3.2 Navigation Features
- Click linked element to navigate to requirement
- Breadcrumb navigation back to diagram
- "Show in Requirements" context menu option

#### 3.3 Link Status Panel
- Side panel showing all element links in current diagram
- Bulk link management
- Link validation status

### Phase 4: Label Parser & Auto-Detection (Intelligence)
**Objective**: Automatically detect and suggest requirement links

#### 4.1 Label Analysis Engine
- Parse element text for requirement patterns (REQ-001, etc.)
- Detect requirement keywords and phrases
- Match against existing requirement database

#### 4.2 Auto-Link Suggestions
- Non-intrusive suggestion UI
- Confidence scoring for matches
- Batch approval for multiple suggestions

#### 4.3 Smart Linking
- Learn from user linking patterns
- Suggest requirements based on diagram context
- Integration with requirement tagging system

### Phase 5: Advanced Features (Enhancement)
**Objective**: Advanced linking capabilities and integrations

#### 5.1 Bidirectional Linking
- Show diagram references in requirement views
- Navigate from requirement to linked diagrams
- Update notifications when linked requirements change

#### 5.2 Link Analytics
- Track link usage and effectiveness
- Identify orphaned or broken links
- Link coverage reports

#### 5.3 Export & Integration
- Include links in diagram exports
- API endpoints for external integrations
- Webhook notifications for link changes

## Technical Implementation Details

### Database Schema
```sql
CREATE TABLE diagram_element_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagram_id UUID NOT NULL REFERENCES excalidraw_diagrams(id),
    element_id TEXT NOT NULL,
    requirement_id UUID NOT NULL REFERENCES requirements(id),
    link_type VARCHAR(20) DEFAULT 'manual',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(diagram_id, element_id, requirement_id)
);
```

### Key Components to Create/Modify
1. `DiagramElementContextMenu.tsx` - Right-click context menu
2. `RequirementLinkDialog.tsx` - Requirement selection dialog  
3. `ElementLinkIndicator.tsx` - Visual link indicators
4. `LabelParser.ts` - Text analysis for auto-detection
5. `useDiagramElementLinks.ts` - React hooks for link management
6. Extend `excalidrawWrapper.tsx` - Integration with existing canvas

### Integration Points
- Excalidraw event handlers for right-click and selection
- Existing requirement system hooks and queries
- TraceLinks system for consistency
- Supabase RLS policies for security

## Success Criteria
- [ ] Right-click any diagram element shows context menu with link option
- [ ] Easy requirement selection with search and preview
- [ ] Visual indicators clearly show linked elements
- [ ] Click linked element navigates to requirement
- [ ] Label parser detects and suggests requirement links
- [ ] All links persist across diagram saves/loads
- [ ] Performance remains smooth with 100+ linked elements
- [ ] Mobile-responsive context menu and dialogs

## Implementation Status

### ✅ Completed
- [x] **Phase 1: Core Infrastructure** - Database schema, types, API hooks
- [x] **Phase 2: Context Menu System** - Right-click context menu with linking options
- [x] **Phase 3: Visual Indicators** - Link indicators and navigation
- [x] **Phase 4: Label Parser** - Auto-detection engine for requirement patterns
- [x] **Integration** - Full integration with ExcalidrawWrapper
- [x] **Demo Environment** - Comprehensive demo page for testing

### 🔄 In Progress
- [ ] Database migration execution
- [ ] Testing with real data
- [ ] Performance optimization
- [ ] Mobile responsiveness testing

### 📋 Next Steps
1. ~~Create GitHub issue for this feature~~ (Issues disabled)
2. ✅ Set up development environment
3. ✅ Complete Phase 1-4 implementation
4. ✅ Create demo/testing environment
5. Execute database migration
6. Comprehensive testing with Playwright
7. Performance testing with large diagrams
8. Documentation and PR creation

## Notes
- Focus on internal linking first (external URIs in future iteration)
- Maintain consistency with existing UI patterns
- Ensure accessibility compliance
- Consider performance with large diagrams
- Plan for mobile/touch device support
