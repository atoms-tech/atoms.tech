'use client';

import React from 'react';
import ReactFlowCanvas from '@/components/reactflow/ReactFlowCanvas';

export default function ReactFlowTestPage() {
    const handleSave = (nodes: any[], edges: any[]) => {
        console.log('Saving diagram:', { nodes, edges });
        // Here you would typically save to your backend
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                            ReactFlow Drag & Drop Test
                        </h1>
                        <p className="text-muted-foreground">
                            Test the drag and drop functionality of the NodeToolbar widget
                        </p>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-muted/50 border rounded-lg p-4 mb-4">
                    <h2 className="font-semibold mb-2">How to test drag & drop:</h2>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>1. Look for the "Add Nodes" widget in the top-left corner</li>
                        <li>2. Try dragging any node type from the widget onto the canvas</li>
                        <li>3. Alternatively, click on any node type to add it at a random position</li>
                        <li>4. You can also connect nodes by dragging from one node's edge to another</li>
                        <li>5. Use the controls in the bottom-left to zoom and pan</li>
                    </ul>
                </div>
            </div>

            {/* ReactFlow Canvas */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="border rounded-lg bg-card" style={{ height: '600px' }}>
                    <ReactFlowCanvas
                        diagramId="test-diagram"
                        projectId="test-project"
                        onSave={handleSave}
                        readOnly={false}
                    />
                </div>
            </div>

            {/* Debug Info */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-muted/50 border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Troubleshooting:</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>If drag & drop doesn't work:</strong></p>
                        <ul className="ml-4 space-y-1">
                            <li>• Make sure you're dragging from the node buttons in the toolbar</li>
                            <li>• Try clicking the node buttons instead (fallback method)</li>
                            <li>• Check browser console for any JavaScript errors</li>
                            <li>• Ensure the ReactFlow canvas area is properly loaded</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
