# Excalidraw Enhancement Project Plan

## Project Overview
Enhance Excalidraw integration with custom right-click context menus, requirement linking, and deep system integration to create a seamless workflow for the atoms.tech platform.

## Work Breakdown Structure (WBS)

### Phase 1: Custom Right-Click Context Menu with Requirement Linking ⚡ CURRENT
**Sprint Duration**: 2-3 days  
**Status**: In Progress  
**Priority**: High  

#### 1.1 Context Menu Infrastructure
- [ ] Implement custom context menu component
- [ ] Add right-click event detection
- [ ] Position menu based on mouse coordinates
- [ ] Handle menu dismissal and focus management

#### 1.2 Requirement Search & Linking
- [ ] Create requirement search modal/dropdown
- [ ] Implement search by ID, name, and other parameters
- [ ] Add URL validation for atoms.tech domains (localhost, vercel.app)
- [ ] Store requirement links in element metadata
- [ ] Visual indicators for linked elements

#### 1.3 Integration Points
- [ ] Connect to existing requirement system
- [ ] Supabase integration for requirement data
- [ ] Real-time search functionality
- [ ] Link persistence and retrieval

#### 1.4 Testing & Documentation
- [ ] Playwright testing with provided credentials
- [ ] Screenshot and video documentation (1920x1080)
- [ ] Full flow recording and GIF conversion
- [ ] PR creation with embedded assets

### Phase 2: Enhanced UI Components (Planned)
**Sprint Duration**: 2-3 days  
**Status**: Planned  
**Priority**: Medium  

#### 2.1 Custom Toolbar Elements
- [ ] Add custom toolbar buttons for workflow actions
- [ ] Integrate with existing UI design system
- [ ] Quick actions for common operations

#### 2.2 Property Panels
- [ ] Custom property panels for linked elements
- [ ] Requirement metadata display
- [ ] Link management interface

### Phase 3: Deep System Integration (Planned)
**Sprint Duration**: 3-4 days  
**Status**: Planned  
**Priority**: Medium  

#### 3.1 Element Metadata System
- [ ] Custom element properties for requirements
- [ ] Document linking capabilities
- [ ] Version tracking and history

#### 3.2 Export/Import Enhancements
- [ ] Custom export formats with metadata
- [ ] Import with requirement preservation
- [ ] Backup and restore functionality

### Phase 4: Advanced Features (Future)
**Sprint Duration**: 4-5 days  
**Status**: Future  
**Priority**: Low  

#### 4.1 Collaboration Features
- [ ] Real-time requirement updates
- [ ] Collaborative editing indicators
- [ ] Comment system integration

#### 4.2 Analytics & Insights
- [ ] Usage tracking for linked requirements
- [ ] Diagram complexity analysis
- [ ] Workflow optimization suggestions

## Technical Architecture

### Context Menu System
```
ExcalidrawWrapper
├── CustomContextMenu
│   ├── RequirementLinkOption
│   ├── StandardOptions
│   └── URLValidation
├── RequirementSearchModal
│   ├── SearchInput
│   ├── ResultsList
│   └── LinkConfirmation
└── ElementMetadata
    ├── RequirementLinks
    ├── URLReferences
    └── CustomProperties
```

### Data Flow
1. Right-click detection → Context menu display
2. "Link to Requirement" selection → Search modal open
3. Search input → API query → Results display
4. Selection → URL validation → Link creation
5. Element update → Metadata storage → Visual indicator

## Implementation Details

### Phase 1 Technical Specifications

#### Context Menu Component
- Position: Absolute positioning based on mouse coordinates
- Styling: Match existing UI design system (zero border radius, CSS variables)
- Accessibility: Keyboard navigation, ARIA labels
- Dismissal: Click outside, ESC key, item selection

#### Requirement Search
- Search Fields: ID, name, description, tags
- API Integration: Supabase real-time queries
- Debounced Input: 300ms delay for performance
- Results Limit: 10 items with pagination

#### URL Validation
- Allowed Domains: 
  - `localhost:*`
  - `*.vercel.app`
  - `atoms.tech`
  - `*.atoms.tech`
- Protocol Support: `http://`, `https://`
- Path Validation: Requirement-specific routes

#### Element Metadata
- Storage: Custom properties in Excalidraw element
- Structure:
  ```typescript
  {
    requirementId: string;
    requirementName: string;
    linkedUrl: string;
    linkType: 'requirement' | 'document' | 'external';
    createdAt: timestamp;
    updatedAt: timestamp;
  }
  ```

## Testing Strategy

### Playwright Test Scenarios
1. **Basic Context Menu**
   - Right-click on canvas → Menu appears
   - Click outside → Menu dismisses
   - ESC key → Menu dismisses

2. **Requirement Linking**
   - Select "Link to Requirement" → Search modal opens
   - Type requirement name → Results appear
   - Select requirement → Link created
   - Visual indicator appears on element

3. **URL Validation**
   - Valid atoms.tech URL → Link accepted
   - Invalid domain → Error message
   - Localhost URL → Link accepted (dev mode)

4. **Integration Testing**
   - Link persistence across page refresh
   - Multiple elements with different links
   - Link editing and removal

### Documentation Requirements
- Screenshots: All major UI states
- Videos: Complete user flows
- GIFs: Key interactions and animations
- Code documentation: JSDoc comments

## Success Criteria

### Phase 1 Completion Criteria
- [ ] Right-click context menu functional
- [ ] Requirement search working with real data
- [ ] URL validation preventing invalid links
- [ ] Visual indicators for linked elements
- [ ] All tests passing (format, lint, tsc, build)
- [ ] Playwright tests covering main flows
- [ ] Complete documentation with screenshots/videos
- [ ] PR created with embedded assets

### Quality Gates
- Code coverage > 80% for new components
- Performance: Context menu appears < 100ms
- Accessibility: WCAG 2.1 AA compliance
- Browser compatibility: Chrome, Firefox, Safari, Edge

## Risk Assessment

### High Risk
- Context menu positioning edge cases
- Performance impact on large diagrams
- Supabase query performance

### Medium Risk
- URL validation complexity
- Element metadata persistence
- Theme integration consistency

### Low Risk
- UI component styling
- Basic event handling
- Documentation creation

## Resources & Dependencies

### External Dependencies
- Excalidraw API for custom context menus
- Supabase for requirement data
- Existing UI component library

### Internal Dependencies
- Requirement system API
- Authentication system
- Theme provider

## Timeline

### Phase 1: Days 1-3
- Day 1: Context menu infrastructure
- Day 2: Requirement search implementation
- Day 3: Testing, documentation, PR creation

### Future Phases
- Phase 2: Days 4-6
- Phase 3: Days 7-10
- Phase 4: Days 11-15

## Notes
- This plan will be updated as development progresses
- Each phase completion will trigger plan review and updates
- Agile methodology with daily progress updates
- Focus on MVP for Phase 1, then iterate
