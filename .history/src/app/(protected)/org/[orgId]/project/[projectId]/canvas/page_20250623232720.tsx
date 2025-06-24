'use client';

import {
    ChevronDown,
    CircleAlert,
    Grid,
    Palette,
    PenTool,
    Pencil,
    Settings,
    Zap,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGumloop } from '@/hooks/useGumloop';
import { supabase } from '@/lib/supabase/supabaseBrowser';

const DiagramGallery = dynamic(
    async () =>
        (await import('@/components/custom/Gallery/DiagramGallery')).default,
    {
        ssr: false,
    },
);

const ReactFlowCanvas = dynamic(
    async () =>
        (await import('@/components/reactflow/ReactFlowCanvas')).default,
    {
        ssr: false,
    },
);

type DiagramType = 'flowchart' | 'sequence' | 'class';

export default function Draw() {
    // const organizationId = '9badbbf0-441c-49f6-91e7-3d9afa1c13e6';
    const organizationId = usePathname().split('/')[2];
    const [prompt, setPrompt] = useState('');
    const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
    // React Flow is now the only diagramming tool

    // Gallery/editor state management
    const [activeTab, setActiveTab] = useState<string>('editor');
    const [lastActiveTab, setLastActiveTab] = useState<string>('editor');
    const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(
        null,
    );
    const [shouldRefreshGallery, setShouldRefreshGallery] =
        useState<boolean>(false);
    const [instanceKey, setInstanceKey] = useState<string>('initial');
    const isInitialRender = useRef(true);
    // Track generation status with refs to avoid re-renders triggering effects
    const hasProcessedUrlPrompt = useRef(false);
    const isManualGeneration = useRef(false);

    // Gumloop state management
    const { startPipeline, getPipelineRun } = useGumloop();
    const [pipelineRunId, setPipelineRunId] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string>('');

    // Diagram name management
    const [currentDiagramName, setCurrentDiagramName] =
        useState<string>('Untitled Diagram');
    const [isRenameDialogOpen, setIsRenameDialogOpen] =
        useState<boolean>(false);
    const [newDiagramName, setNewDiagramName] = useState<string>('');

    // Add state for pending requirementId
    const [pendingRequirementId, setPendingRequirementId] = useState<
        string | null
    >(null);

    // Add state for pending documentId
    const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(
        null,
    );

    // On mount, check sessionStorage for pending diagram prompt and requirementId
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const pendingPrompt = sessionStorage.getItem('pendingDiagramPrompt');
        const pendingReqId = sessionStorage.getItem(
            'pendingDiagramRequirementId',
        );
        const pendingDocId = sessionStorage.getItem('pendingDiagramDocumentId');

        console.log('[Canvas] Reading sessionStorage:', {
            pendingPrompt: pendingPrompt
                ? pendingPrompt.substring(0, 20) + '...'
                : null,
            pendingReqId,
            pendingDocId,
        });

        if (pendingPrompt) {
            setPrompt(pendingPrompt);
            sessionStorage.removeItem('pendingDiagramPrompt');
        }
        // Read requirementId
        if (pendingReqId) {
            setPendingRequirementId(pendingReqId);
            sessionStorage.removeItem('pendingDiagramRequirementId');
        }
        // Read documentId
        if (pendingDocId) {
            console.log('[Canvas] Reading documentId:', pendingDocId);
            setPendingDocumentId(pendingDocId);
            sessionStorage.removeItem('pendingDiagramDocumentId');
        }
    }, []);

    // Handle tab changes
    useEffect(() => {
        // Skip first render
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        // If we're coming from gallery to editor AND we have a selected diagram,
        // update the instance key to force remount
        if (
            lastActiveTab === 'gallery' &&
            activeTab === 'editor' &&
            selectedDiagramId
        ) {
            // Add timestamp to force remount and refresh diagram data including name
            setInstanceKey(`diagram-${selectedDiagramId}-${Date.now()}`);
        }

        // Update last active tab
        setLastActiveTab(activeTab);
    }, [activeTab, lastActiveTab, selectedDiagramId]);

    // Get pipeline run data
    const { data: pipelineResponse } = getPipelineRun(
        pipelineRunId,
        organizationId,
    );

    // React Flow doesn't need the Mermaid generation pipeline
    // This functionality can be removed or adapted for React Flow if needed

    // Auto-generation removed for React Flow

    // Pipeline response handling removed for React Flow

    // Manual generation and Excalidraw mount handlers removed

    // Handle creating a new diagram from gallery
    const handleNewDiagram = useCallback(() => {
        // Remove "id" from the URL so React Flow won't try to load it
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('id');
        window.history.pushState({}, '', newUrl);

        // Also remove the old localStorage key
        const projectId = window.location.pathname.split('/')[4];
        const projectStorageKey = `lastReactFlowDiagramId_${projectId}`;
        localStorage.removeItem(projectStorageKey);

        setSelectedDiagramId(null);
        setActiveTab('editor');
        setInstanceKey(`new-diagram-${Date.now()}`);
    }, []);

    // Handle selecting a diagram from gallery
    const handleSelectDiagram = useCallback((diagramId: string) => {
        setSelectedDiagramId(diagramId);
        setActiveTab('editor');
        setInstanceKey(`diagram-${diagramId}`);
    }, []);

    // Handle diagram saved callback
    const handleDiagramSaved = useCallback(() => {
        setShouldRefreshGallery(true);
    }, []);

    // Reset the refresh flag after the gallery is refreshed
    useEffect(() => {
        if (shouldRefreshGallery && activeTab === 'gallery') {
            setShouldRefreshGallery(false);
        }
    }, [activeTab, shouldRefreshGallery]);

    // Handle rename diagram
    const handleRenameDiagram = async () => {
        if (!selectedDiagramId || !newDiagramName.trim()) return;

        try {
            const { error } = await supabase
                .from('excalidraw_diagrams')
                .update({ name: newDiagramName.trim() })
                .eq('id', selectedDiagramId);

            if (error) {
                console.error('Error renaming diagram:', error);
                return;
            }

            // Update local state
            setCurrentDiagramName(newDiagramName.trim());

            // Close dialog and reset input
            setIsRenameDialogOpen(false);
            setNewDiagramName('');
        } catch (err) {
            console.error('Error in handleRenameDiagram:', err);
        }
    };

    // Handle diagram name changes from ExcalidrawWrapper
    const handleDiagramNameChange = useCallback((name: string) => {
        setCurrentDiagramName(name);
    }, []);

    // Tool switching functionality
    const tools = [
        {
            id: 'excalidraw' as DiagramTool,
            name: 'Excalidraw',
            description: 'Hand-drawn style diagrams',
            icon: '✏️',
            features: ['Quick sketching', 'Natural feel', 'Simple interface'],
            bestFor: 'Brainstorming, quick sketches, informal diagrams',
            color: 'bg-blue-50 border-blue-200',
        },
        {
            id: 'reactflow' as DiagramTool,
            name: 'React Flow',
            description: 'Professional structured diagrams',
            icon: '🎯',
            features: ['Custom nodes', 'Advanced linking', 'Layout algorithms'],
            bestFor:
                'Professional diagrams, requirement traceability, workflows',
            color: 'bg-green-50 border-green-200',
            recommended: true,
        },
    ];

    const handleToolChange = (tool: DiagramTool) => {
        setSelectedTool(tool);
        setShowToolSelector(false);
        toast.success(`Switched to ${tools.find((t) => t.id === tool)?.name}`);
    };

    const handleMigration = () => {
        if (selectedTool === 'excalidraw') {
            setSelectedTool('reactflow');
            toast.success('Migrated to React Flow with enhanced features!');
        } else {
            setSelectedTool('excalidraw');
            toast.success('Switched to Excalidraw for quick sketching!');
        }
    };

    return (
        <div className="flex flex-col gap-4 p-5 h-full">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {activeTab === 'editor' && selectedDiagramId ? (
                        <>
                            <h1 className="text-2xl font-bold">
                                {currentDiagramName}
                            </h1>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-1"
                                onClick={() => {
                                    setNewDiagramName(currentDiagramName);
                                    setIsRenameDialogOpen(true);
                                }}
                            >
                                <Pencil size={16} />
                            </Button>
                            {/* Tool Indicator */}
                            <Badge variant="outline" className="ml-2">
                                {selectedTool === 'excalidraw'
                                    ? '✏️ Excalidraw'
                                    : '🎯 React Flow'}
                            </Badge>
                        </>
                    ) : (
                        <h1 className="text-2xl font-bold">Diagrams</h1>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {/* Tool Switcher */}
                    {activeTab === 'editor' && selectedDiagramId && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowToolSelector(true)}
                                className="h-8"
                            >
                                <Settings className="w-4 h-4 mr-1" />
                                Switch Tool
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMigration}
                                className="h-8"
                            >
                                {selectedTool === 'excalidraw' ? (
                                    <>
                                        <Zap className="w-4 h-4 mr-1" />
                                        Upgrade
                                    </>
                                ) : (
                                    <>
                                        <Palette className="w-4 h-4 mr-1" />
                                        Sketch Mode
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-auto"
                    >
                        <TabsList>
                            <TabsTrigger
                                value="editor"
                                className="flex items-center gap-1.5"
                            >
                                <PenTool size={16} />
                                Editor
                            </TabsTrigger>
                            <TabsTrigger
                                value="gallery"
                                className="flex items-center gap-1.5"
                            >
                                <Grid size={16} />
                                Gallery
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {activeTab === 'gallery' ? (
                <DiagramGallery
                    onNewDiagram={handleNewDiagram}
                    onSelectDiagram={handleSelectDiagram}
                    key={shouldRefreshGallery ? 'refresh' : 'default'}
                />
            ) : (
                <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-150px)]">
                    <div className="flex-grow h-full min-h-[500px] overflow-hidden relative">
                        {selectedTool === 'excalidraw' ? (
                            <ExcalidrawWithClientOnly
                                onMounted={handleExcalidrawMount}
                                diagramId={selectedDiagramId}
                                onDiagramSaved={handleDiagramSaved}
                                onDiagramNameChange={handleDiagramNameChange}
                                onDiagramIdChange={setSelectedDiagramId}
                                key={`pendingReq-${pendingRequirementId}-${instanceKey}`}
                                pendingRequirementId={pendingRequirementId}
                                pendingDocumentId={pendingDocumentId}
                            />
                        ) : (
                            <ReactFlowCanvas
                                diagramId={selectedDiagramId}
                                projectId={organizationId}
                                collaborationEnabled={true}
                                onSave={(nodes, edges) => {
                                    // Handle React Flow save
                                    console.log('React Flow saved:', {
                                        nodes,
                                        edges,
                                    });
                                }}
                            />
                        )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-2.5 p-5 bg-gray-100 dark:bg-sidebar rounded-lg h-fit">
                        <h3 className="text-xl text-BLACK dark:text-white">
                            Text to Diagram
                        </h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Describe your diagram here..."
                            className="w-[300px] h-[150px] p-2.5 rounded-none border border-[#454545] resize-y"
                        />
                        <div className="mb-2.5">
                            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                                Diagram Type
                            </label>
                            <div className="relative">
                                <select
                                    value={diagramType}
                                    onChange={(e) =>
                                        setDiagramType(
                                            e.target.value as DiagramType,
                                        )
                                    }
                                    className="w-full p-2.5 bg-white dark:bg-secondary rounded-none border appearance-none cursor-pointer"
                                >
                                    <option value="flowchart">Flowchart</option>
                                    <option value="sequence">Sequence</option>
                                    <option value="class">Class</option>
                                </select>
                                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleManualGenerate}
                            disabled={isGenerating}
                            className={`px-5 py-2.5 bg-[#993CF6] text-white border-none rounded-none font-bold ${
                                isGenerating
                                    ? 'opacity-70 cursor-default'
                                    : 'opacity-100 cursor-pointer'
                            }`}
                        >
                            {isGenerating ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                </div>
                            ) : (
                                'Generate'
                            )}
                        </button>
                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-100 p-2 rounded text-sm">
                                <CircleAlert className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        {pipelineResponse?.state === 'DONE' && (
                            <div className="text-emerald-600 bg-emerald-100 p-2 rounded text-sm">
                                Diagram generated successfully!
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tool Selector Dialog */}
            <Dialog open={showToolSelector} onOpenChange={setShowToolSelector}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Choose Your Diagram Tool</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {tools.map((tool) => (
                                <Card
                                    key={tool.id}
                                    className={`relative cursor-pointer transition-all hover:shadow-lg ${tool.color} ${
                                        selectedTool === tool.id
                                            ? 'ring-2 ring-blue-500'
                                            : ''
                                    }`}
                                    onClick={() => handleToolChange(tool.id)}
                                >
                                    {tool.recommended && (
                                        <Badge className="absolute -top-2 -right-2 bg-green-500">
                                            Recommended
                                        </Badge>
                                    )}
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-3xl">
                                                {tool.icon}
                                            </span>
                                            <div>
                                                <h3 className="text-xl font-bold">
                                                    {tool.name}
                                                </h3>
                                                <p className="text-gray-600">
                                                    {tool.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="font-semibold mb-2">
                                                    Features
                                                </h4>
                                                <ul className="text-sm space-y-1">
                                                    {tool.features.map(
                                                        (feature, index) => (
                                                            <li
                                                                key={index}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <span className="text-green-500">
                                                                    ✓
                                                                </span>
                                                                {feature}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold mb-1">
                                                    Best For
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {tool.bestFor}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full mt-4"
                                            variant={
                                                selectedTool === tool.id
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                        >
                                            {selectedTool === tool.id
                                                ? 'Currently Selected'
                                                : `Switch to ${tool.name}`}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-4">
                                You can switch between tools anytime. Your
                                diagrams will be preserved.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog
                open={isRenameDialogOpen}
                onOpenChange={setIsRenameDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Diagram</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newDiagramName}
                            onChange={(e) => setNewDiagramName(e.target.value)}
                            placeholder="Diagram name"
                            className="mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsRenameDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRenameDiagram}
                                disabled={!newDiagramName.trim()}
                            >
                                Rename
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
