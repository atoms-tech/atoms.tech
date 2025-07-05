'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamically import the Excalidraw test wrapper to avoid SSR issues
const ExcalidrawTestWrapper = dynamic(
    () => import('@/components/custom/Excalidraw/ExcalidrawTestWrapper'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[600px] bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading Excalidraw...</p>
                </div>
            </div>
        ),
    }
);

export default function ExcalidrawTestPage() {
    const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);

    const handleExcalidrawMount = (api: { addMermaidDiagram: (mermaidSyntax: string) => Promise<void> }) => {
        console.log('Excalidraw mounted with API:', api);
    };

    const handleDiagramSaved = (id: string) => {
        console.log('Diagram saved with ID:', id);
        setSelectedDiagramId(id);
    };

    const handleDiagramNameChange = (name: string) => {
        console.log('Diagram name changed to:', name);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-foreground">
                        Excalidraw Context Menu Test
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Test the new right-click context menu with requirement linking functionality.
                        <br />
                        <strong>Instructions:</strong>
                        <br />
                        1. Draw some shapes or elements
                        <br />
                        2. Right-click on an element to open the context menu
                        <br />
                        3. Select "Link to Requirement" to test the search functionality
                        <br />
                        4. Try different search terms and URL validation
                    </p>
                </div>
            </div>

            {/* Excalidraw Canvas */}
            <div className="h-[calc(100vh-120px)] w-full">
                <ExcalidrawTestWrapper />
            </div>
        </div>
    );
}
