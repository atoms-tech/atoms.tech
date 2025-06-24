-- React Flow Migration Script
-- This script creates the necessary tables and functions for React Flow integration

-- 1. Create react_flow_diagrams table
CREATE TABLE IF NOT EXISTS react_flow_diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Diagram',
    description TEXT,
    
    -- React Flow specific data
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
    
    -- Configuration
    diagram_type VARCHAR(50) DEFAULT 'mixed' CHECK (diagram_type IN ('workflow', 'requirements', 'architecture', 'mixed')),
    layout_algorithm VARCHAR(50) DEFAULT 'dagre' CHECK (layout_algorithm IN ('dagre', 'elk', 'force', 'hierarchical', 'manual')),
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    
    -- Settings
    settings JSONB DEFAULT '{
        "snapToGrid": true,
        "showGrid": true,
        "allowZoom": true,
        "allowPan": true,
        "multiSelection": true
    }',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps and user tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Create indexes for performance
CREATE INDEX idx_react_flow_diagrams_project_id ON react_flow_diagrams(project_id);
CREATE INDEX idx_react_flow_diagrams_created_by ON react_flow_diagrams(created_by);
CREATE INDEX idx_react_flow_diagrams_diagram_type ON react_flow_diagrams(diagram_type);
CREATE INDEX idx_react_flow_diagrams_created_at ON react_flow_diagrams(created_at);

-- 3. Extend diagram_element_links table for React Flow
ALTER TABLE diagram_element_links ADD COLUMN IF NOT EXISTS node_type VARCHAR(50);
ALTER TABLE diagram_element_links ADD COLUMN IF NOT EXISTS edge_data JSONB;
ALTER TABLE diagram_element_links ADD COLUMN IF NOT EXISTS layout_data JSONB;
ALTER TABLE diagram_element_links ADD COLUMN IF NOT EXISTS tool_type VARCHAR(20) DEFAULT 'excalidraw' CHECK (tool_type IN ('excalidraw', 'reactflow'));

-- 4. Create diagram_migrations table for tracking migrations
CREATE TABLE IF NOT EXISTS diagram_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    excalidraw_diagram_id UUID,
    react_flow_diagram_id UUID REFERENCES react_flow_diagrams(id) ON DELETE CASCADE,
    migration_status VARCHAR(20) DEFAULT 'pending' CHECK (migration_status IN ('pending', 'in_progress', 'completed', 'failed')),
    migration_data JSONB DEFAULT '{}',
    element_mapping JSONB DEFAULT '{}',
    errors TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id)
);

-- 5. Create diagram_collaborators table for real-time collaboration
CREATE TABLE IF NOT EXISTS diagram_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagram_id UUID NOT NULL REFERENCES react_flow_diagrams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cursor_position JSONB DEFAULT '{"x": 0, "y": 0}',
    selection JSONB DEFAULT '[]',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(diagram_id, user_id)
);

-- 6. Create diagram_versions table for version control
CREATE TABLE IF NOT EXISTS diagram_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagram_id UUID NOT NULL REFERENCES react_flow_diagrams(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    nodes JSONB NOT NULL,
    edges JSONB NOT NULL,
    viewport JSONB,
    change_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(diagram_id, version_number)
);

-- 7. Create diagram_comments table for collaborative feedback
CREATE TABLE IF NOT EXISTS diagram_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagram_id UUID NOT NULL REFERENCES react_flow_diagrams(id) ON DELETE CASCADE,
    node_id VARCHAR(255), -- Optional: comment on specific node
    position JSONB, -- Position on canvas if not tied to node
    content TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 8. Create indexes for new tables
CREATE INDEX idx_diagram_migrations_excalidraw_id ON diagram_migrations(excalidraw_diagram_id);
CREATE INDEX idx_diagram_migrations_react_flow_id ON diagram_migrations(react_flow_diagram_id);
CREATE INDEX idx_diagram_migrations_status ON diagram_migrations(migration_status);

CREATE INDEX idx_diagram_collaborators_diagram_id ON diagram_collaborators(diagram_id);
CREATE INDEX idx_diagram_collaborators_user_id ON diagram_collaborators(user_id);
CREATE INDEX idx_diagram_collaborators_active ON diagram_collaborators(is_active);

CREATE INDEX idx_diagram_versions_diagram_id ON diagram_versions(diagram_id);
CREATE INDEX idx_diagram_versions_version ON diagram_versions(diagram_id, version_number);

CREATE INDEX idx_diagram_comments_diagram_id ON diagram_comments(diagram_id);
CREATE INDEX idx_diagram_comments_created_by ON diagram_comments(created_by);
CREATE INDEX idx_diagram_comments_resolved ON diagram_comments(resolved);

-- 9. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create triggers for updated_at
CREATE TRIGGER update_react_flow_diagrams_updated_at 
    BEFORE UPDATE ON react_flow_diagrams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagram_comments_updated_at 
    BEFORE UPDATE ON diagram_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Enable Row Level Security (RLS)
ALTER TABLE react_flow_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_comments ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for react_flow_diagrams
CREATE POLICY "Users can view diagrams in their projects" ON react_flow_diagrams
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create diagrams in their projects" ON react_flow_diagrams
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update diagrams in their projects" ON react_flow_diagrams
    FOR UPDATE USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete diagrams they created" ON react_flow_diagrams
    FOR DELETE USING (created_by = auth.uid());

-- 13. Create RLS policies for other tables
CREATE POLICY "Users can view collaborators in accessible diagrams" ON diagram_collaborators
    FOR SELECT USING (
        diagram_id IN (
            SELECT id FROM react_flow_diagrams
            WHERE project_id IN (
                SELECT p.id FROM projects p
                JOIN project_members pm ON p.id = pm.project_id
                WHERE pm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage their own collaboration data" ON diagram_collaborators
    FOR ALL USING (user_id = auth.uid());

-- Similar policies for other tables...
CREATE POLICY "Users can view versions of accessible diagrams" ON diagram_versions
    FOR SELECT USING (
        diagram_id IN (
            SELECT id FROM react_flow_diagrams
            WHERE project_id IN (
                SELECT p.id FROM projects p
                JOIN project_members pm ON p.id = pm.project_id
                WHERE pm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view comments on accessible diagrams" ON diagram_comments
    FOR SELECT USING (
        diagram_id IN (
            SELECT id FROM react_flow_diagrams
            WHERE project_id IN (
                SELECT p.id FROM projects p
                JOIN project_members pm ON p.id = pm.project_id
                WHERE pm.user_id = auth.uid()
            )
        )
    );

-- 14. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON react_flow_diagrams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON diagram_migrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON diagram_collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON diagram_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON diagram_comments TO authenticated;

-- 15. Create helper functions
CREATE OR REPLACE FUNCTION get_diagram_stats(diagram_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    node_count INTEGER;
    edge_count INTEGER;
    link_count INTEGER;
BEGIN
    SELECT 
        jsonb_array_length(nodes),
        jsonb_array_length(edges)
    INTO node_count, edge_count
    FROM react_flow_diagrams
    WHERE id = diagram_id;
    
    SELECT COUNT(*)
    INTO link_count
    FROM diagram_element_links
    WHERE diagram_id = get_diagram_stats.diagram_id;
    
    result := jsonb_build_object(
        'nodeCount', COALESCE(node_count, 0),
        'edgeCount', COALESCE(edge_count, 0),
        'linkCount', COALESCE(link_count, 0)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create migration helper function
CREATE OR REPLACE FUNCTION migrate_excalidraw_to_reactflow(excalidraw_diagram_id UUID)
RETURNS UUID AS $$
DECLARE
    new_diagram_id UUID;
    project_id UUID;
BEGIN
    -- This is a placeholder for the actual migration logic
    -- The real implementation would convert Excalidraw elements to React Flow nodes/edges
    
    -- Get project_id from excalidraw diagram (assuming it exists)
    -- SELECT project_id INTO project_id FROM excalidraw_diagrams WHERE id = excalidraw_diagram_id;
    
    -- Create new React Flow diagram
    INSERT INTO react_flow_diagrams (project_id, name, nodes, edges)
    VALUES (project_id, 'Migrated Diagram', '[]', '[]')
    RETURNING id INTO new_diagram_id;
    
    -- Record migration
    INSERT INTO diagram_migrations (excalidraw_diagram_id, react_flow_diagram_id, migration_status)
    VALUES (excalidraw_diagram_id, new_diagram_id, 'completed');
    
    RETURN new_diagram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration completed successfully
SELECT 'React Flow migration completed successfully' AS status;
