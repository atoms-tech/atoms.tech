'use client';

import { ChevronDown, CircleAlert, Grid, PenTool, Pencil } from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
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

const ExcalidrawWithClientOnly = dynamic(
    async () =>
        (await import('@/components/custom/LandingPage/excalidrawWrapper'))
            .default,
    {
        ssr: false,
    },
);

const DiagramGallery = dynamic(
    async () =>
        (await import('@/components/custom/Gallery/DiagramGallery')).default,
    {
        ssr: false,
    },
);

type DiagramType = 'flowchart' | 'sequence' | 'class';

export default function Draw() {
    // const organizationId = '9badbbf0-441c-49f6-91e7-3d9afa1c13e6';
    const organizationId = usePathname().split('/')[2];
    const searchParams = useSearchParams();
    const [prompt, setPrompt] = useState('');
    const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
    const [excalidrawApi, setExcalidrawApi] = useState<{
        addMermaidDiagram: (mermaidSyntax: string) => Promise<void>;
    } | null>(null);

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

    // Read diagram ID and diagram prompt from URL on mount
    useEffect(() => {
        const urlDiagramId = searchParams.get('id');
        const diagramPromptFromUrl = searchParams.get('diagramPrompt');

        // Set prompt from URL if present
        if (diagramPromptFromUrl) {
            console.log('Found diagram prompt in URL:', diagramPromptFromUrl);
            setPrompt(decodeURIComponent(diagramPromptFromUrl));
            // Mark that we've seen a URL prompt, but don't auto-generate yet
            // We'll handle auto-generation in a separate effect when excalidrawApi is ready
            hasProcessedUrlPrompt.current = false;
        } else {
            // No diagram prompt in URL - reset flag
            hasProcessedUrlPrompt.current = true;
        }

        // Handle diagram ID loading/creation
        if (urlDiagramId) {
            console.log('Found diagram ID in URL:', urlDiagramId);
            setSelectedDiagramId(urlDiagramId);
            setInstanceKey(`diagram-${urlDiagramId}`);
        } else {
            const projectId = window.location.pathname.split('/')[4];
            const projectStorageKey = `lastExcalidrawDiagramId_${projectId}`;
            const lastDiagramId = localStorage.getItem(projectStorageKey);

            if (lastDiagramId) {
                console.log(
                    'Found last used diagram ID in localStorage:',
                    lastDiagramId,
                );
                setSelectedDiagramId(lastDiagramId);
                setInstanceKey(`diagram-${lastDiagramId}`);

                const newUrl = new URL(window.location.href);
                if (!newUrl.searchParams.has('id')) {
                    // Only set if ID is not already in URL
                    newUrl.searchParams.set('id', lastDiagramId);
                    window.history.pushState({}, '', newUrl);
                }
            }
            // ExcalidrawWrapper handles new diagram creation if no ID
        }
    }, [searchParams]); // Rerun when searchParams change

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

    const handleGenerate = useCallback(async () => {
        if (!excalidrawApi) {
            console.error('Excalidraw API not initialized for generation');
            return;
        }

        if (!prompt.trim()) {
            console.log('Prompt is empty, skipping generation.');
            return;
        }

        // Already generating, don't trigger again
        if (isGenerating || pipelineRunId) {
            console.log('Already generating, skipping duplicate request');
            return;
        }

        setError('');
        setIsGenerating(true);

        // Safety timeout to ensure the button doesn't get stuck in "generating" state
        const safetyTimer = setTimeout(() => {
            console.log(
                'Safety timeout triggered - resetting generation state',
            );
            setIsGenerating(false);
            setPipelineRunId('');
        }, 15000); // 15 seconds timeout

        try {
            const { run_id } = await startPipeline({
                pipelineType: 'text-to-mermaid',
                customPipelineInputs: [
                    {
                        input_name: 'Requirements(s)',
                        value: prompt.trim(),
                    },
                    {
                        input_name: 'Diagram-type',
                        value: diagramType,
                    },
                ],
            });
            setPipelineRunId(run_id);
            // Clear the safety timeout since we got a successful response
            clearTimeout(safetyTimer);
        } catch (error) {
            console.error('Failed to start pipeline:', error);
            setError('Failed to start diagram generation');
            setIsGenerating(false);
            setPipelineRunId('');
            // Reset the flags regardless of success or failure
            isManualGeneration.current = false;
            // Clear the safety timeout since we're handling the error
            clearTimeout(safetyTimer);
        }
    }, [
        excalidrawApi,
        prompt,
        diagramType,
        startPipeline,
        isGenerating,
        pipelineRunId,
    ]);

    // Separate auto-generation from manual generation
    // This effect only handles auto-generation from URL parameters
    useEffect(() => {
        const diagramPromptFromUrl = searchParams.get('diagramPrompt');

        // Only auto-generate when:
        // 1. We have a URL prompt that hasn't been processed
        // 2. ExcalidrawApi is initialized
        // 3. We're not already generating
        // 4. We have a prompt value set
        if (
            diagramPromptFromUrl &&
            !hasProcessedUrlPrompt.current &&
            excalidrawApi &&
            !isGenerating &&
            !pipelineRunId &&
            prompt
        ) {
            console.log(
                'Auto-generating diagram from URL prompt (one-time)...',
            );
            // Mark that we've handled this URL prompt
            hasProcessedUrlPrompt.current = true;

            // Not a manual generation
            isManualGeneration.current = false;

            // Call generate
            handleGenerate();

            // Remove the diagramPrompt parameter from the URL
            // to prevent regeneration on refresh
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('diagramPrompt');
            window.history.replaceState({}, '', newUrl);
        }
    }, [
        excalidrawApi,
        prompt,
        searchParams,
        handleGenerate,
        isGenerating,
        pipelineRunId,
    ]);

    // Handle the pipeline response
    useEffect(() => {
        if (!pipelineResponse) return;

        switch (pipelineResponse.state) {
            case 'DONE': {
                console.log('Pipeline response: DONE');

                // Parse the JSON string from outputs.output
                let parsedOutput;
                try {
                    const output = pipelineResponse.outputs?.output;
                    if (!output || typeof output !== 'string') {
                        throw new Error('Invalid output format');
                    }
                    parsedOutput = JSON.parse(output);
                    const mermaidSyntax = parsedOutput?.mermaid_syntax;

                    if (!mermaidSyntax) {
                        console.error('No mermaid syntax found in response');
                        console.log('parsedOutput: ', parsedOutput);
                        setError(
                            'Failed to generate diagram: No mermaid syntax in response',
                        );
                        break;
                    }

                    // Clean the mermaid syntax
                    const syntaxStr = Array.isArray(mermaidSyntax)
                        ? mermaidSyntax[0]
                        : mermaidSyntax;
                    let cleanedSyntax = syntaxStr.replace(
                        /```[\s\S]*?```/g,
                        (match: string) => {
                            const content = match
                                .replace(/```[\w]*\n?/, '')
                                .replace(/\n?```$/, '');
                            return content;
                        },
                    );
                    cleanedSyntax = cleanedSyntax
                        .replace(/^```[\w]*\n?/, '')
                        .replace(/\n?```$/, '');
                    cleanedSyntax = cleanedSyntax.trim();

                    // console.log('Cleaned mermaid syntax:', cleanedSyntax);

                    if (excalidrawApi) {
                        excalidrawApi
                            .addMermaidDiagram(cleanedSyntax)
                            .catch((err) => {
                                console.error(
                                    'Error rendering mermaid diagram:',
                                    err,
                                );
                                setError('Failed to render diagram');
                            });
                    }
                } catch (err) {
                    console.error('Error parsing pipeline output:', err);
                    setError('Failed to parse diagram data');
                } finally {
                    // Always reset these states, regardless of parsing success or failure
                    setPipelineRunId('');
                    setIsGenerating(false);
                }
                break;
            }
            case 'FAILED': {
                console.error('Pipeline failed');
                setError('Failed to generate diagram');

                // Reset states
                setPipelineRunId('');
                setIsGenerating(false);
                break;
            }
            default:
                // For states like RUNNING or others, just log and don't reset
                console.log(
                    'Pipeline in progress, state:',
                    pipelineResponse.state,
                );
                return;
        }
    }, [pipelineResponse, excalidrawApi]);

    // This function is called by the "Generate" button
    const handleManualGenerate = useCallback(() => {
        // This is a manual generation
        isManualGeneration.current = true;
        handleGenerate();
    }, [handleGenerate]);

    const handleExcalidrawMount = useCallback(
        (api: {
            addMermaidDiagram: (mermaidSyntax: string) => Promise<void>;
        }) => {
            setExcalidrawApi(api);
        },
        [],
    );

    // Handle creating a new diagram from gallery
    const handleNewDiagram = useCallback(() => {
        // Remove "id" from the URL so ExcalidrawWrapper won't try to load it
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('id');
        window.history.pushState({}, '', newUrl);

        // Also remove the old localStorage key so ExcalidrawWrapper doesn't load it again
        const projectId = window.location.pathname.split('/')[4];
        const projectStorageKey = `lastExcalidrawDiagramId_${projectId}`;
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
                        </>
                    ) : (
                        <h1 className="text-2xl font-bold">Diagrams</h1>
                    )}
                </div>
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

            {activeTab === 'gallery' ? (
                <DiagramGallery
                    onNewDiagram={handleNewDiagram}
                    onSelectDiagram={handleSelectDiagram}
                    key={shouldRefreshGallery ? 'refresh' : 'default'}
                />
            ) : (
                <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-150px)]">
                    <div className="flex-grow h-full min-h-[500px] overflow-hidden">
                        <ExcalidrawWithClientOnly
                            onMounted={handleExcalidrawMount}
                            diagramId={selectedDiagramId}
                            onDiagramSaved={handleDiagramSaved}
                            onDiagramNameChange={handleDiagramNameChange}
                            key={instanceKey}
                        />
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
