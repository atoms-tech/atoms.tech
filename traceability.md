# Requirements Traceability System Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for the Requirements Traceability System in the Atoms platform, focusing on link column functionality that enables parent-child relationships between requirements within the same organization and project.

## Current Database Schema Analysis

### Existing Traceability Infrastructure

#### Key Tables for Traceability

**`trace_links` Table** - Core relationship management

```sql
- source_id (UUID) → requirements.id
- target_id (UUID) → requirements.id
- source_type (entity_type ENUM) → 'requirement'
- target_type (entity_type ENUM) → 'requirement'
- link_type (trace_link_type ENUM) → derived_from, satisfies, conflicts_with, depends_on, etc.
- description (TEXT) → relationship description
- version (BIGINT) → version tracking
```

**`requirements` Table** - Core entity

```sql
- id (UUID, PK) → requirement identifier
- document_id (UUID) → documents.id
- block_id (UUID) → blocks.id
- name (TEXT) → requirement title
- properties (JSONB) → custom metadata including link column data
- version (BIGINT) → version control
```

**`properties` Table** - Custom property definitions

```sql
- id (UUID, PK) → property identifier
- name (TEXT) → property name
- property_type (TEXT) → data type (supports 'entity_reference')
- options (JSONB) → configuration including entity filtering
- org_id/project_id/document_id → scope hierarchy
```

**`columns` Table** - Table column configuration

```sql
- id (UUID, PK) → column identifier
- block_id (UUID) → blocks.id
- property_id (UUID) → properties.id
- position (DOUBLE PRECISION) → column ordering
- is_hidden/is_pinned (BOOLEAN) → visibility control
```

### Current Capabilities Analysis

**✅ Strong Foundation Elements:**

- Flexible bi-directional relationship system via `trace_links`
- Hierarchical scoping (organization → project → document → block → requirement)
- Version control across all entities
- Soft delete patterns with audit trails
- JSONB-based flexible metadata in `properties.options`
- Multi-tenant architecture with proper isolation

**❌ Missing Critical Components:**

1. **Link Column Implementation**: No requirement-specific UI/logic for entity_reference properties
2. **Validation System**: Missing cycle detection and relationship constraint validation
3. **Table-based Interface**: No integrated UI for managing links within requirement tables
4. **Bulk Operations**: No API for bulk relationship creation/updates
5. **Performance Optimization**: No specialized indexes for deep hierarchy traversal

## Implementation Architecture

### Phase 1: Database Schema Extensions

#### 1.1 Property Type Extension

```sql
-- Extend property_type to support requirement linking
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'requirement_link';

-- Example property configuration for link columns
{
  "property_type": "requirement_link",
  "options": {
    "entity_types": ["requirement"],
    "scope": "same_project", // same_document, same_project, same_organization
    "link_type": "parent_child", // parent_child, dependency, reference
    "multiple": true, // allow multiple selections
    "constraints": {
      "prevent_cycles": true,
      "max_depth": 10,
      "allowed_statuses": ["draft", "approved"]
    }
  }
}
```

#### 1.2 Database Indexes for Performance

```sql
-- Composite indexes for traceability queries
CREATE INDEX idx_trace_links_source_type ON trace_links(source_id, source_type);
CREATE INDEX idx_trace_links_target_type ON trace_links(target_id, target_type);
CREATE INDEX idx_trace_links_project_scope ON trace_links(source_id, target_id)
  WHERE source_type = 'requirement' AND target_type = 'requirement';

-- JSONB indexes for property queries
CREATE INDEX idx_requirements_properties_gin ON requirements USING gin(properties);
```

#### 1.3 Validation Functions

```sql
-- Cycle detection function
CREATE OR REPLACE FUNCTION detect_requirement_cycle(
  p_source_id UUID,
  p_target_id UUID,
  p_max_depth INTEGER DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
  cycle_detected BOOLEAN := FALSE;
BEGIN
  -- Recursive CTE to detect cycles in requirement relationships
  WITH RECURSIVE requirement_hierarchy AS (
    SELECT source_id, target_id, 1 as depth
    FROM trace_links
    WHERE source_id = p_target_id
      AND source_type = 'requirement'
      AND target_type = 'requirement'
      AND link_type = 'parent_child'

    UNION ALL

    SELECT tl.source_id, tl.target_id, rh.depth + 1
    FROM trace_links tl
    INNER JOIN requirement_hierarchy rh ON tl.source_id = rh.target_id
    WHERE rh.depth < p_max_depth
      AND tl.source_type = 'requirement'
      AND tl.target_type = 'requirement'
      AND tl.link_type = 'parent_child'
  )
  SELECT EXISTS(
    SELECT 1 FROM requirement_hierarchy
    WHERE target_id = p_source_id
  ) INTO cycle_detected;

  RETURN cycle_detected;
END;
$$ LANGUAGE plpgsql;
```

### Phase 2: Core Component Implementation

#### 2.1 Link Column Editor Component

```typescript
interface RequirementLinkEditorProps {
  requirement: Requirement;
  property: Property;
  value: string[] | null; // Array of requirement IDs
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const RequirementLinkEditor: React.FC<RequirementLinkEditorProps> = ({
  requirement,
  property,
  value = [],
  onChange,
  disabled = false
}) => {
  // Fetch available requirements based on property scope
  const { data: availableRequirements } = useQuery({
    queryKey: ['requirements', 'linkable', requirement.document_id, property.id],
    queryFn: () => getAvailableRequirements({
      documentId: requirement.document_id,
      projectId: requirement.project_id,
      organizationId: requirement.organization_id,
      currentRequirementId: requirement.id,
      scope: property.options.scope,
      constraints: property.options.constraints
    })
  });

  return (
    <MultiSelect
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={availableRequirements?.map(req => ({
        value: req.id,
        label: `${req.name} (${req.external_id})`,
        description: req.description?.substring(0, 100)
      }))}
      placeholder="Select related requirements..."
      searchable={true}
      renderOption={RequirementOption}
    />
  );
};
```

#### 2.2 Traceability Service Layer

```typescript
class TraceabilityService {
    // Create parent-child link with validation
    async createParentChildLink(
        parentId: string,
        childId: string,
        options: {
            validateCycles?: boolean;
            description?: string;
        } = {},
    ): Promise<TraceLink> {
        if (options.validateCycles && (await this.detectCycle(parentId, childId))) {
            throw new Error('Creating this link would create a circular dependency');
        }

        return this.supabase
            .from('trace_links')
            .insert({
                source_id: parentId,
                target_id: childId,
                source_type: 'requirement',
                target_type: 'requirement',
                link_type: 'parent_child',
                description: options.description,
            })
            .single();
    }

    // Bulk operations for link column updates
    async updateRequirementLinks(
        requirementId: string,
        propertyId: string,
        targetIds: string[],
    ): Promise<void> {
        // Remove existing links for this property
        await this.supabase
            .from('trace_links')
            .delete()
            .eq('source_id', requirementId)
            .eq('metadata->property_id', propertyId);

        // Create new links
        const newLinks = targetIds.map((targetId) => ({
            source_id: requirementId,
            target_id: targetId,
            source_type: 'requirement',
            target_type: 'requirement',
            link_type: 'parent_child',
            metadata: { property_id: propertyId },
        }));

        if (newLinks.length > 0) {
            await this.supabase.from('trace_links').insert(newLinks);
        }

        // Update requirement properties JSONB
        await this.supabase
            .from('requirements')
            .update({
                properties: {
                    ...requirement.properties,
                    [propertyId]: targetIds,
                },
            })
            .eq('id', requirementId);
    }

    // Get requirement hierarchy
    async getRequirementHierarchy(
        requirementId: string,
        direction: 'children' | 'parents' | 'both' = 'both',
    ): Promise<RequirementNode[]> {
        const query = this.supabase.rpc('get_requirement_hierarchy', {
            p_requirement_id: requirementId,
            p_direction: direction,
            p_max_depth: 10,
        });

        return query;
    }
}
```

#### 2.3 Database Functions for Hierarchy Queries

```sql
-- Get requirement hierarchy with depth and path
CREATE OR REPLACE FUNCTION get_requirement_hierarchy(
  p_requirement_id UUID,
  p_direction TEXT DEFAULT 'both',
  p_max_depth INTEGER DEFAULT 10
) RETURNS TABLE(
  requirement_id UUID,
  name TEXT,
  external_id TEXT,
  level INTEGER,
  path UUID[],
  relationship_type TEXT
) AS $$
BEGIN
  IF p_direction = 'children' OR p_direction = 'both' THEN
    RETURN QUERY
    WITH RECURSIVE requirement_tree AS (
      -- Base case: direct children
      SELECT
        r.id,
        r.name,
        r.external_id,
        1 as level,
        ARRAY[p_requirement_id, r.id] as path,
        'child' as relationship_type
      FROM requirements r
      INNER JOIN trace_links tl ON tl.target_id = r.id
      WHERE tl.source_id = p_requirement_id
        AND tl.source_type = 'requirement'
        AND tl.target_type = 'requirement'
        AND tl.link_type = 'parent_child'

      UNION ALL

      -- Recursive case: children of children
      SELECT
        r.id,
        r.name,
        r.external_id,
        rt.level + 1,
        rt.path || r.id,
        'descendant' as relationship_type
      FROM requirements r
      INNER JOIN trace_links tl ON tl.target_id = r.id
      INNER JOIN requirement_tree rt ON tl.source_id = rt.requirement_id
      WHERE rt.level < p_max_depth
        AND NOT r.id = ANY(rt.path) -- Prevent infinite loops
        AND tl.source_type = 'requirement'
        AND tl.target_type = 'requirement'
        AND tl.link_type = 'parent_child'
    )
    SELECT * FROM requirement_tree;
  END IF;

  -- Similar logic for parents if p_direction = 'parents' or 'both'
  -- ... (parent hierarchy query)
END;
$$ LANGUAGE plpgsql;
```

### Phase 3: User Interface Implementation

#### 3.1 Table Integration

```typescript
const RequirementLinkCell: React.FC<{
  requirement: Requirement;
  property: Property;
  value: string[];
}> = ({ requirement, property, value }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="requirement-link-cell">
      {!isEditing ? (
        <div className="link-display" onClick={() => setIsEditing(true)}>
          {value?.length > 0 ? (
            <div className="linked-items">
              {value.map(reqId => (
                <RequirementChip
                  key={reqId}
                  requirementId={reqId}
                  onClick={() => navigateToRequirement(reqId)}
                />
              ))}
              <span className="count-badge">+{value.length}</span>
            </div>
          ) : (
            <span className="placeholder">Click to link requirements</span>
          )}
        </div>
      ) : (
        <RequirementLinkEditor
          requirement={requirement}
          property={property}
          value={value}
          onChange={(newValue) => {
            updateRequirementProperty(requirement.id, property.id, newValue);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
};
```

#### 3.2 Traceability Visualization Page

```typescript
const TraceabilityPage: React.FC = () => {
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'matrix'>('tree');

  const { data: hierarchy } = useQuery({
    queryKey: ['traceability', selectedRequirement],
    queryFn: () => selectedRequirement ?
      traceabilityService.getRequirementHierarchy(selectedRequirement, 'both') :
      null,
    enabled: !!selectedRequirement
  });

  return (
    <div className="traceability-page">
      <header className="page-header">
        <h1>Requirements Traceability</h1>
        <div className="view-controls">
          <ToggleGroup value={viewMode} onValueChange={setViewMode}>
            <ToggleGroupItem value="tree">Tree View</ToggleGroupItem>
            <ToggleGroupItem value="matrix">Matrix View</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>

      <div className="traceability-content">
        <aside className="requirements-sidebar">
          <RequirementSelector
            onSelect={setSelectedRequirement}
            selected={selectedRequirement}
          />
        </aside>

        <main className="visualization-area">
          {viewMode === 'tree' ? (
            <RequirementTreeView
              hierarchy={hierarchy}
              onNodeSelect={setSelectedRequirement}
            />
          ) : (
            <TraceabilityMatrix
              requirements={requirements}
              links={links}
            />
          )}
        </main>
      </div>
    </div>
  );
};
```

### Phase 4: Advanced Features

#### 4.1 Cross-Project Linking (Future Enhancement)

```typescript
interface CrossProjectLinkOptions {
    sourceProjectId: string;
    targetProjectId: string;
    organizationId: string;
    linkType: 'reference' | 'derived_from';
    bidirectional?: boolean;
}

class CrossProjectTraceabilityService extends TraceabilityService {
    async createCrossProjectLink(
        sourceReqId: string,
        targetReqId: string,
        options: CrossProjectLinkOptions,
    ): Promise<TraceLink> {
        // Validate cross-project permissions
        const hasPermission = await this.validateCrossProjectAccess(
            options.sourceProjectId,
            options.targetProjectId,
            options.organizationId,
        );

        if (!hasPermission) {
            throw new Error('Insufficient permissions for cross-project linking');
        }

        return this.createTraceLink(sourceReqId, targetReqId, {
            linkType: options.linkType,
            metadata: {
                cross_project: true,
                source_project_id: options.sourceProjectId,
                target_project_id: options.targetProjectId,
            },
        });
    }
}
```

#### 4.2 Bulk Operations API

```typescript
// API endpoint for bulk link operations
async function bulkUpdateRequirementLinks(
    projectId: string,
    operations: Array<{
        requirementId: string;
        propertyId: string;
        action: 'add' | 'remove' | 'replace';
        targetIds: string[];
    }>,
): Promise<void> {
    const validatedOps = await Promise.all(
        operations.map(async (op) => {
            // Validate each operation
            if (op.action === 'add') {
                // Check for cycles
                for (const targetId of op.targetIds) {
                    if (await detectCycle(op.requirementId, targetId)) {
                        throw new Error(
                            `Cycle detected: ${op.requirementId} -> ${targetId}`,
                        );
                    }
                }
            }
            return op;
        }),
    );

    // Execute operations in transaction
    await supabase.rpc('bulk_update_requirement_links', {
        p_operations: validatedOps,
    });
}
```

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

1. **Database Schema Updates**
    - Add requirement_link property type
    - Create performance indexes
    - Implement validation functions
    - Add cycle detection logic

2. **Core Service Layer**
    - Implement TraceabilityService
    - Create API endpoints for link management
    - Add validation middleware

### Phase 2: UI Components (Weeks 3-4)

1. **Link Column Editor**
    - Requirement selection component
    - Multi-select with search
    - Validation feedback

2. **Table Integration**
    - Link cell renderer
    - Inline editing capabilities
    - Visual relationship indicators

### Phase 3: Visualization (Weeks 5-6)

1. **Traceability Page**
    - Tree view implementation
    - Matrix view for complex relationships
    - Interactive navigation

2. **Performance Optimization**
    - Lazy loading for large hierarchies
    - Caching strategies
    - Database query optimization

### Phase 4: Advanced Features (Weeks 7-8)

1. **Bulk Operations**
    - Batch link creation/updates
    - Import/export capabilities
    - Validation across operations

2. **Cross-Project Linking**
    - Organization-scoped relationships
    - Permission validation
    - UI for cross-project navigation

## Database Tables to Utilize

### Primary Tables

- **`trace_links`** - Store all requirement relationships
- **`requirements`** - Core entities with JSONB properties for link data
- **`properties`** - Define link column configurations
- **`columns`** - Table column display settings

### Supporting Tables

- **`projects`** - Project scoping for links
- **`documents`** - Document scoping for links
- **`blocks`** - Table/block context for columns
- **`audit_logs`** - Track all relationship changes

### Performance Tables

- **`document_summary`** - Cache relationship counts
- Custom materialized views for complex hierarchy queries

## Missing Components Analysis

### Critical Gaps

1. **Property Type**: Need 'requirement_link' property type
2. **UI Components**: No table-integrated requirement selection
3. **Validation Service**: Missing cycle detection and constraints
4. **APIs**: No bulk operations for relationship management
5. **Performance**: No specialized indexes for traceability queries

### Moderate Gaps

1. **Cross-Project**: No organization-scoped linking
2. **Visualization**: No dedicated traceability views
3. **Import/Export**: No bulk relationship data management
4. **Notifications**: No alerts for relationship changes

### Nice-to-Have

1. **Impact Analysis**: Track requirement change impacts
2. **Compliance**: Traceability reporting for standards
3. **Templates**: Pre-defined relationship patterns
4. **Integration**: External tool synchronization

## Performance Considerations

### Database Optimization

```sql
-- Specialized indexes for common traceability queries
CREATE INDEX idx_trace_links_requirement_hierarchy
ON trace_links(source_id, target_id, link_type)
WHERE source_type = 'requirement' AND target_type = 'requirement';

-- Partial index for active requirements only
CREATE INDEX idx_requirements_active_links
ON requirements(id)
WHERE deleted_at IS NULL;

-- JSONB indexes for property-based queries
CREATE INDEX idx_requirements_properties_links
ON requirements USING gin((properties->'link_columns'));
```

### Caching Strategy

- **Client-side**: Cache requirement lists per project/document
- **Server-side**: Cache hierarchy calculations for frequently accessed requirements
- **Database**: Materialized views for complex traceability reports

## Security & Compliance

### Access Control

- Enforce organization-level isolation
- Project-level permissions for link creation
- Document-level read permissions for requirement selection

### Audit Trail

- Log all link creation/deletion in audit_logs
- Track property changes in requirements table
- Maintain version history for compliance

## Testing Strategy

### Unit Tests

- Link validation functions
- Cycle detection algorithms
- Property type handling

### Integration Tests

- API endpoint functionality
- Database transaction integrity
- UI component behavior

### Performance Tests

- Large hierarchy traversal
- Bulk operation efficiency
- Concurrent link updates

---

## Recent Implementation Updates (January 2025)

### ✅ Completed: Project-Wide Requirements Scope Extension

**Issue Addressed**: The trace page was previously limited to requirements within the same document, severely restricting cross-document traceability within projects.

**Solution Implemented**:

1. **Hook Migration**: Replaced `useDocumentRequirements(documentId)` with `useProjectRequirements(projectId)`
2. **UI Enhancement**: Added document source indicators to show requirement origins
3. **Database Query**: Leveraged existing `useProjectRequirements` hook with JOIN on documents table

#### Code Changes Made

**File**: `src/app/(protected)/org/[orgId]/project/[projectId]/requirements/[requirementSlug]/trace/page.tsx`

```typescript
// Before: Document-scoped requirements
const documentId = searchParams.get('documentId') || '';
const { data: requirements } = useDocumentRequirements(documentId);

// After: Project-scoped requirements
const projectId = params.projectId as string;
const { data: requirements } = useProjectRequirements(projectId);
```

**Import Updates**:

```typescript
// Updated import
import {
    useProjectRequirements, // Changed from useDocumentRequirements
    useRequirementsByIds,
} from '@/hooks/queries/useRequirement';
```

**UI Enhancement**:

```typescript
// Added document source indication in requirement selection list
{req.documents && (
    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded w-fit">
        📄 {req.documents.name}
    </div>
)}
```

#### Database Query Impact

The `useProjectRequirements` hook executes:

```sql
SELECT requirements.*, documents.id, documents.name
FROM requirements
INNER JOIN documents ON requirements.document_id = documents.id
WHERE documents.project_id = $projectId
  AND requirements.is_deleted = false
ORDER BY requirements.created_at DESC
```

#### Benefits Achieved

1. **Cross-Document Traceability**: Users can now link requirements across all documents in a project
2. **Enhanced Visibility**: Document source is clearly labeled for each requirement
3. **Improved Workflow**: No need to navigate between documents to create relationships
4. **Maintained Performance**: Existing query optimization preserved
5. **Better UX**: Search functionality now spans entire project scope

#### User Experience Improvements

| Aspect                     | Before                       | After                     |
| -------------------------- | ---------------------------- | ------------------------- |
| **Available Requirements** | Same document only           | Entire project            |
| **Visual Context**         | No document indication       | Document name badge       |
| **Workflow Efficiency**    | Limited cross-document links | Full project connectivity |
| **Search Scope**           | Document-restricted          | Project-wide search       |

### Current Implementation Status

#### ✅ Working Features

- Project-wide requirement selection in trace pages
- Cross-document relationship creation
- Document source identification in UI
- Parent/Child relationship types
- ReactFlow visualization
- Trace link CRUD operations

#### 🔄 In Progress Features

- Link column implementation (per original plan)
- Table-integrated inline editing
- Cycle detection validation
- Performance optimization indexes

#### 📋 Next Priority Items

1. **Link Column Integration**: Implement requirement_link property type in table cells
2. **Validation System**: Add cycle detection and constraint validation
3. **Performance Optimization**: Add specialized indexes for traceability queries
4. **Bulk Operations**: Enable batch relationship updates

---

This comprehensive implementation plan provides the foundation for building a robust requirements traceability system that leverages the existing Atoms platform architecture while adding the necessary components for link column functionality and parent-child requirement relationships.
