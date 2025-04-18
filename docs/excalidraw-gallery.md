# Excalidraw Gallery Feature

The Excalidraw Gallery feature allows users to create, save, manage, and switch between multiple diagrams within a project.

## Features

### Gallery View
- View all diagrams in a project in a grid layout
- Each diagram displays a thumbnail preview and metadata (name, last updated)
- Create new diagrams directly from the gallery
- Rename or delete existing diagrams

### Canvas Editor 
- Create and edit diagrams using the Excalidraw canvas
- Name your diagrams for better organization
- "Save As" functionality to create copies of diagrams
- Text-to-diagram generation using the AI assistant

## Using the Gallery

1. Navigate to the Canvas section of your project
2. Toggle between "Gallery" and "Editor" views using the tabs at the top
3. In Gallery view:
   - Click on any diagram to open it in the editor
   - Use the "New Diagram" button to create a fresh canvas
   - Hover over diagrams to see rename and delete options

4. In Editor view:
   - Draw directly on the canvas using Excalidraw tools
   - Use "Save As" to create a copy with a different name
   - Click the diagram name to rename it
   - Use the AI diagram generator to create diagrams from text descriptions

## URL Structure

The application uses a clean URL structure:
- The project context is determined by the URL path: `/org/[orgId]/project/[projectId]/canvas`
- Specific diagrams are accessed via a query parameter: `?id=[diagramId]`
- The system verifies that the requested diagram belongs to the current project

## Database Schema

The gallery feature extends the existing `excalidraw_diagrams` table with:

- `name`: Stores the diagram name (defaults to "Untitled Diagram")
- `thumbnail_url`: Stores an SVG preview of the diagram for the gallery

## Implementation Details

- Diagrams are auto-saved every 2 seconds when changes are detected
- Thumbnails are generated as SVG data URLs when diagrams are saved
- Database access follows existing project permissions
- Gallery refreshes automatically when diagrams are created or saved

## Deployment

To enable this feature in an existing installation, run the SQL script:

```bash
psql -d your_database_name -f scripts/update_excalidraw_schema.sql
```

Or apply the changes using the Supabase dashboard in the SQL editor. 