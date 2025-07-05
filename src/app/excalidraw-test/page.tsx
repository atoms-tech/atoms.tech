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
    const [showDemo, setShowDemo] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

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
                        <br />
                        <br />
                        <strong>Demo Buttons:</strong>
                        <br />
                        <button
                            onClick={() => setShowDemo(true)}
                            className="mr-2 px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                        >
                            Demo Context Menu
                        </button>
                        <button
                            onClick={() => setShowSearchModal(true)}
                            className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                        >
                            Demo Search Modal
                        </button>
                    </p>
                </div>
            </div>

            {/* Excalidraw Canvas */}
            <div className="h-[calc(100vh-120px)] w-full">
                <ExcalidrawTestWrapper />
            </div>

            {/* Demo Context Menu */}
            {showDemo && (
                <div
                    className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
                    onClick={() => setShowDemo(false)}
                >
                    <div className="relative">
                        <div className="bg-popover border border-border shadow-lg min-w-[200px] animate-in fade-in-0 zoom-in-95 duration-100">
                            <div className="p-1">
                                <div className="flex items-center justify-between px-2 py-1 border-b border-border mb-1">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Element Actions
                                    </span>
                                    <button
                                        className="h-6 w-6 p-0 hover:bg-accent rounded"
                                        onClick={() => setShowDemo(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <button
                                    className="w-full justify-start gap-2 h-8 px-2 text-sm hover:bg-accent rounded flex items-center"
                                    onClick={() => {
                                        setShowDemo(false);
                                        setShowSearchModal(true);
                                    }}
                                >
                                    🔗 Link to Requirement
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Demo Search Modal */}
            {showSearchModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-card border border-border rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                🔍 Link to Requirement (Demo)
                            </h2>
                        </div>
                        <div className="p-6 flex-1 min-h-0">
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name, description, ID, or tags..."
                                        className="w-full pl-10 pr-4 py-2 border border-border rounded bg-input"
                                    />
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">🔍</span>
                                </div>
                                <div className="border border-border rounded">
                                    <div className="p-2 border-b border-border bg-muted/30">
                                        <span className="text-sm font-medium">Available Requirements (Mock Data)</span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        <div className="p-3 hover:bg-muted/50 cursor-pointer border-l-2 border-l-primary bg-primary/10">
                                            <div className="font-medium text-sm">User Authentication System</div>
                                            <div className="text-xs text-muted-foreground mt-1">ID: REQ-001</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                The system shall provide secure user authentication using multi-factor authentication
                                            </div>
                                            <div className="flex gap-1 mt-2">
                                                <span className="px-2 py-1 text-xs bg-secondary rounded">security</span>
                                                <span className="px-2 py-1 text-xs bg-secondary rounded">authentication</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Requirement URL</label>
                                    <input
                                        type="text"
                                        value="http://localhost:3000/org/demo/project/demo/requirements/1"
                                        className="w-full px-3 py-2 border border-border rounded bg-input"
                                        readOnly
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        URL validated for atoms.tech, localhost, or *.vercel.app domains
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex justify-end gap-2">
                            <button
                                className="px-4 py-2 border border-border rounded hover:bg-accent"
                                onClick={() => setShowSearchModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                onClick={() => setShowSearchModal(false)}
                            >
                                Link Requirement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
