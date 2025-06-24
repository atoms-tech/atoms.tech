-- Migration: Create diagram_element_links table for linking diagram elements to requirements
-- This enables traceability between visual diagrams and textual requirements

-- Create the diagram_element_links table
CREATE TABLE IF NOT EXISTS diagram_element_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagram_id UUID NOT NULL REFERENCES excalidraw_diagrams(id) ON DELETE CASCADE,
    element_id TEXT NOT NULL, -- Excalidraw element ID
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    link_type VARCHAR(20) DEFAULT 'manual' CHECK (link_type IN ('manual', 'auto_detected')),
    metadata JSONB DEFAULT '{}', -- Store element type, text, confidence scores, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique combination of diagram, element, and requirement
    UNIQUE(diagram_id, element_id, requirement_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_diagram_element_links_diagram_id ON diagram_element_links(diagram_id);
CREATE INDEX IF NOT EXISTS idx_diagram_element_links_element_id ON diagram_element_links(element_id);
CREATE INDEX IF NOT EXISTS idx_diagram_element_links_requirement_id ON diagram_element_links(requirement_id);
CREATE INDEX IF NOT EXISTS idx_diagram_element_links_created_by ON diagram_element_links(created_by);
CREATE INDEX IF NOT EXISTS idx_diagram_element_links_link_type ON diagram_element_links(link_type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_diagram_element_links_diagram_element ON diagram_element_links(diagram_id, element_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE diagram_element_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view links for diagrams in their organization
CREATE POLICY "Users can view diagram element links in their organization" ON diagram_element_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM excalidraw_diagrams ed
            WHERE ed.id = diagram_element_links.diagram_id
            AND ed.organization_id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Users can create links for diagrams in their organization
CREATE POLICY "Users can create diagram element links in their organization" ON diagram_element_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM excalidraw_diagrams ed
            WHERE ed.id = diagram_element_links.diagram_id
            AND ed.organization_id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
        AND created_by = auth.uid()
    );

-- Policy: Users can update their own links or links in their organization
CREATE POLICY "Users can update diagram element links in their organization" ON diagram_element_links
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM excalidraw_diagrams ed
            WHERE ed.id = diagram_element_links.diagram_id
            AND ed.organization_id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Users can delete their own links or links in their organization
CREATE POLICY "Users can delete diagram element links in their organization" ON diagram_element_links
    FOR DELETE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM excalidraw_diagrams ed
            WHERE ed.id = diagram_element_links.diagram_id
            AND ed.organization_id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_diagram_element_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_diagram_element_links_updated_at
    BEFORE UPDATE ON diagram_element_links
    FOR EACH ROW
    EXECUTE FUNCTION update_diagram_element_links_updated_at();

-- Create view for easier querying with joined data
CREATE OR REPLACE VIEW diagram_element_links_with_details AS
SELECT 
    del.*,
    ed.name as diagram_name,
    ed.project_id,
    ed.organization_id,
    r.name as requirement_name,
    r.description as requirement_description,
    r.external_id as requirement_external_id,
    r.priority as requirement_priority,
    r.status as requirement_status,
    u.email as created_by_email
FROM diagram_element_links del
JOIN excalidraw_diagrams ed ON del.diagram_id = ed.id
JOIN requirements r ON del.requirement_id = r.id
LEFT JOIN auth.users u ON del.created_by = u.id;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON diagram_element_links TO authenticated;
GRANT SELECT ON diagram_element_links_with_details TO authenticated;
GRANT USAGE ON SEQUENCE diagram_element_links_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE diagram_element_links IS 'Links between diagram elements and requirements for traceability';
COMMENT ON COLUMN diagram_element_links.element_id IS 'Excalidraw element ID from the diagram';
COMMENT ON COLUMN diagram_element_links.link_type IS 'Whether link was created manually or auto-detected';
COMMENT ON COLUMN diagram_element_links.metadata IS 'Additional data like element type, text, confidence scores';
COMMENT ON VIEW diagram_element_links_with_details IS 'Enriched view with diagram and requirement details';
