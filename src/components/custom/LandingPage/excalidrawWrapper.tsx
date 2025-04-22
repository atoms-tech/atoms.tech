'use client';

import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type {
    AppState,
    BinaryFiles,
    ExcalidrawImperativeAPI,
    ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import { Save } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase/supabaseBrowser';

import '@excalidraw/excalidraw/index.css';

import {
    convertToExcalidrawElements,
    exportToSvg,
} from '@excalidraw/excalidraw';
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUser } from '@/lib/providers/user.provider';

const LAST_DIAGRAM_ID_KEY = 'lastExcalidrawDiagramId';

// Define Supabase JSON-compatible type
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Add a type definition for diagram data from Supabase
interface ExcalidrawDiagramData {
    elements: ExcalidrawElement[];
    appState: Partial<AppState>;
    files: BinaryFiles;
}

// Define the type for diagram records in the database
interface DiagramRecord {
    id: string;
    diagram_data: Json; // Changed to match Supabase's JSON type
    updated_at: string;
    updated_by: string | undefined;
    created_by: string | undefined;
    organization_id: string | undefined;
    project_id: string | undefined;
    name: string;
    thumbnail_url: string | null;
}

// Get the type for NormalizedZoomValue from @excalidraw/excalidraw
type NormalizedZoomValue = AppState['zoom']['value'];

interface ExcalidrawWrapperProps {
    onMounted?: (api: {
        addMermaidDiagram: (mermaidSyntax: string) => Promise<void>;
    }) => void;
    diagramId?: string | null;
    onDiagramSaved?: (id: string) => void;
    onDiagramNameChange?: (name: string) => void;
}

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({
    onMounted,
    diagramId: externalDiagramId,
    onDiagramSaved,
    onDiagramNameChange,
}) => {
    const [diagramId, setDiagramId] = useState<string | null>(
        externalDiagramId || null,
    );
    const [diagramName, setDiagramName] = useState<string>('Untitled Diagram');
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [initialData, setInitialData] =
        useState<ExcalidrawInitialDataState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExistingDiagram, setIsExistingDiagram] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isSaveAsDialogOpen, setIsSaveAsDialogOpen] = useState(false);
    const [newDiagramName, setNewDiagramName] = useState('');

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );
    const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
    const lastSavedDataRef = useRef<{
        elements: readonly ExcalidrawElement[];
        appState: AppState;
    } | null>(null);

    // Get theme from next-themes
    const { theme, resolvedTheme } = useTheme();
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Update dark mode state whenever theme changes
    useEffect(() => {
        setIsDarkMode(theme === 'dark' || resolvedTheme === 'dark');
    }, [theme, resolvedTheme]);

    const { user } = useUser();
    const organizationId = usePathname().split('/')[2];
    const projectId = usePathname().split('/')[4];

    // Function to generate a thumbnail of the current diagram
    const generateThumbnail = useCallback(
        async (
            elements: readonly ExcalidrawElement[],
            appState: AppState,
        ): Promise<string | null> => {
            try {
                if (!excalidrawApiRef.current || elements.length === 0) {
                    return null;
                }

                // Generate SVG
                const svgElement = await exportToSvg({
                    elements,
                    appState: {
                        ...appState,
                        exportWithDarkMode: isDarkMode,
                        exportBackground: true,
                        viewBackgroundColor: appState.viewBackgroundColor,
                    },
                    files: excalidrawApiRef.current.getFiles(),
                });

                // Convert SVG to data URL
                const svgString = new XMLSerializer().serializeToString(
                    svgElement,
                );
                const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

                return dataUrl;
            } catch (error) {
                console.error('Error generating thumbnail:', error);
                return null;
            }
        },
        [isDarkMode],
    );

    // Function to load a diagram by ID
    const loadDiagram = useCallback(
        async (id: string) => {
            setIsLoading(true);
            setAuthError(null);

            try {
                // Fetch existing diagram data with authorization check
                const { data, error } = await supabase
                    .from('excalidraw_diagrams')
                    .select('diagram_data, project_id, name')
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Error loading diagram:', error);
                    if (
                        error.message.includes('multiple (or no) rows returned')
                    ) {
                        console.log(
                            'No diagram found with ID:',
                            id,
                            '- treating as new diagram',
                        );
                        return false;
                    }

                    //handle it as a real error
                    setAuthError('Error loading diagram: ' + error.message);
                    return false;
                }

                if (data && data.diagram_data) {
                    // Verify diagram belongs to current project
                    if (data.project_id !== projectId) {
                        console.error(
                            'Unauthorized: Diagram does not belong to current project',
                        );
                        setAuthError(
                            'Unauthorized: Diagram does not belong to current project',
                        );
                        return false;
                    }

                    // Set diagram name
                    setDiagramName(data.name || 'Untitled Diagram');

                    // Parse diagram data from Supabase
                    const diagramData =
                        typeof data.diagram_data === 'string'
                            ? (JSON.parse(
                                  data.diagram_data,
                              ) as unknown as ExcalidrawDiagramData)
                            : (data.diagram_data as unknown as ExcalidrawDiagramData);

                    // Extract the properties we need
                    const elements = diagramData.elements || [];
                    const appState = diagramData.appState || {};
                    const files = diagramData.files || {};

                    const initialDataState: ExcalidrawInitialDataState = {
                        elements: elements,
                        appState: {
                            ...appState,
                            collaborators: new Map(),
                            currentItemFontFamily:
                                appState?.currentItemFontFamily || 1,
                            viewBackgroundColor:
                                appState?.viewBackgroundColor || '#ffffff',
                            zoom: appState?.zoom || {
                                value: 1 as NormalizedZoomValue,
                            },
                            theme: isDarkMode ? 'dark' : 'light',
                        },
                        files: files,
                    };
                    setInitialData(initialDataState);
                    lastSavedDataRef.current = {
                        elements:
                            initialDataState.elements as readonly ExcalidrawElement[],
                        appState: initialDataState.appState as AppState,
                    };

                    setIsExistingDiagram(true);
                    setIsLoading(false);

                    // Update URL and localStorage
                    const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
                    localStorage.setItem(projectStorageKey, id);

                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('id', id);
                    window.history.pushState({}, '', newUrl);

                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error loading diagram:', error);
                setAuthError('Failed to load diagram');
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [projectId, isDarkMode],
    );

    // Function to refresh just the diagram name from the database
    const refreshDiagramName = useCallback(async () => {
        if (!diagramId) return;

        try {
            const { data, error } = await supabase
                .from('excalidraw_diagrams')
                .select('name')
                .eq('id', diagramId)
                .single();

            if (error) {
                console.error('Error refreshing diagram name:', error);
                return;
            }

            if (data && data.name !== diagramName) {
                console.log('Updating diagram name from database:', data.name);
                setDiagramName(data.name || 'Untitled Diagram');
            }
        } catch (err) {
            console.error('Error in refreshDiagramName:', err);
        }
    }, [diagramId, diagramName]);

    // Periodically check for name updates in the database
    useEffect(() => {
        if (!diagramId) return;

        // Initial refresh
        refreshDiagramName();

        // Set up interval to check for name updates
        const intervalId = setInterval(refreshDiagramName, 5000); // Check every 5 seconds

        return () => {
            clearInterval(intervalId);
        };
    }, [diagramId, refreshDiagramName]);

    const createNewDiagram = useCallback(() => {
        // Generate a UUID v4
        const newId = uuidv4();
        setDiagramId(newId);
        setDiagramName('Untitled Diagram');
        setInitialData(null);
        lastSavedDataRef.current = null;
        setIsExistingDiagram(false);

        const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
        localStorage.setItem(projectStorageKey, newId);

        // Clear auth error since we're starting with a fresh diagram
        setAuthError(null);

        // Update URL with the new ID
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', newId);
        window.history.pushState({}, '', newUrl);

        // Reset the Excalidraw canvas
        if (excalidrawApiRef.current) {
            excalidrawApiRef.current.updateScene({
                elements: [],
                appState: {
                    theme: isDarkMode ? 'dark' : 'light',
                },
            });
        }

        setIsLoading(false);
    }, [projectId, isDarkMode]);

    // Function to add mermaid diagram to canvas
    const addMermaidDiagram = async (mermaidSyntax: string) => {
        try {
            const { elements: skeletonElements } =
                await parseMermaidToExcalidraw(mermaidSyntax);

            const excalidrawElements =
                convertToExcalidrawElements(skeletonElements);

            if (excalidrawApiRef.current) {
                const currentElements =
                    excalidrawApiRef.current.getSceneElements();
                // Add new elements to existing ones
                excalidrawApiRef.current.updateScene({
                    elements: [...currentElements, ...excalidrawElements],
                });
            }
        } catch (error) {
            console.error('Error converting mermaid to excalidraw:', error);
            throw error;
        }
    };

    // Expose the addMermaidDiagram function to parent
    useEffect(() => {
        if (onMounted) {
            onMounted({ addMermaidDiagram });
        }
    }, [onMounted]);

    // Watch for external diagramId changes
    useEffect(() => {
        if (externalDiagramId !== undefined) {
            setDiagramId(externalDiagramId);

            if (externalDiagramId) {
                loadDiagram(externalDiagramId);
            }
        }
    }, [externalDiagramId, loadDiagram]);

    // Reset loading state when component unmounts or when diagram ID changes
    useEffect(() => {
        return () => {
            setIsLoading(false);
        };
    }, [diagramId]);

    // Update theme in Excalidraw when dark mode changes
    useEffect(() => {
        if (excalidrawApiRef.current) {
            excalidrawApiRef.current.updateScene({
                appState: {
                    theme: isDarkMode ? 'dark' : 'light',
                },
            });
        }
    }, [isDarkMode]);

    // Initialize diagram ID and load data on mount
    useEffect(() => {
        const initializeDiagram = async () => {
            try {
                // Clear previous diagram when project changes
                if (projectId) {
                    // Only load diagram if no external ID was provided
                    if (!externalDiagramId) {
                        // Use a project-specific storage key to prevent leakage between projects
                        const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
                        const urlParams = new URLSearchParams(
                            window.location.search,
                        );
                        const idFromUrl = urlParams.get('id');
                        const lastDiagramId =
                            localStorage.getItem(projectStorageKey);

                        // Priority: URL param > localStorage > new diagram
                        let id: string | null = null;

                        if (idFromUrl && isValidUuid(idFromUrl)) {
                            id = idFromUrl;
                        } else if (
                            lastDiagramId &&
                            isValidUuid(lastDiagramId)
                        ) {
                            id = lastDiagramId;
                            // Update URL with the stored ID
                            const newUrl = new URL(window.location.href);
                            newUrl.searchParams.set('id', id);
                            window.history.pushState({}, '', newUrl);
                        }

                        if (id) {
                            setDiagramId(id);
                            localStorage.setItem(projectStorageKey, id);

                            const loadSuccess = await loadDiagram(id);
                            if (!loadSuccess) {
                                createNewDiagram();
                            }
                        } else {
                            createNewDiagram();
                        }
                    }
                }
            } catch (error) {
                console.error('Error initializing diagram:', error);
                setIsLoading(false);
            }
        };

        // Helper function to validate UUID
        const isValidUuid = (id: string): boolean => {
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id);
        };

        initializeDiagram();
    }, [
        isDarkMode,
        projectId,
        externalDiagramId,
        loadDiagram,
        createNewDiagram,
    ]);

    const hasChanges = useCallback(
        (elements: readonly ExcalidrawElement[], appState: AppState) => {
            if (!lastSavedDataRef.current) return true;

            // Compare elements
            const prevElements = lastSavedDataRef.current.elements;
            if (prevElements.length !== elements.length) return true;

            // Deep compare elements
            for (let i = 0; i < elements.length; i++) {
                const curr = elements[i];
                const prev = prevElements[i];
                if (JSON.stringify(curr) !== JSON.stringify(prev)) return true;
            }

            // Compare relevant appState properties that we care about
            const currentViewBg = appState.viewBackgroundColor;
            const prevViewBg =
                lastSavedDataRef.current.appState.viewBackgroundColor;
            if (currentViewBg !== prevViewBg) return true;

            const currentZoom = appState.zoom;
            const prevZoom = lastSavedDataRef.current.appState.zoom;
            if (JSON.stringify(currentZoom) !== JSON.stringify(prevZoom))
                return true;

            return false;
        },
        [],
    );

    const saveDiagram = useCallback(
        async (
            elements: readonly ExcalidrawElement[],
            appState: AppState,
            files: BinaryFiles,
            customDiagramId?: string,
            customName?: string,
            forceSave = false,
        ) => {
            const idToUse = customDiagramId || diagramId;
            const nameToUse = customName || diagramName;

            if (!idToUse || isAutoSaving) return;

            // Only prevent saving if it's a new diagram and there are no elements
            if (
                !forceSave &&
                !isExistingDiagram &&
                (!elements || elements.length === 0)
            ) {
                console.log('New diagram with no elements - skipping save');
                return;
            }

            // Check if there are actual changes to save
            if (
                !forceSave &&
                !customDiagramId &&
                !hasChanges(elements, appState)
            ) {
                console.log('No changes detected - skipping save');
                return;
            }

            try {
                setIsAutoSaving(true);

                const diagramData = {
                    elements: elements,
                    appState: {
                        ...appState,
                    },
                    files: files,
                };

                const now = new Date().toISOString();

                // Generate thumbnail
                const thumbnailUrl = await generateThumbnail(
                    elements,
                    appState,
                );

                // Serialize the diagram data to ensure it's JSON compatible
                const serializedData = JSON.stringify(diagramData);

                // Create the record to upsert
                const diagramRecord: DiagramRecord = {
                    id: idToUse,
                    diagram_data: JSON.parse(serializedData),
                    updated_at: now,
                    updated_by: user?.id,
                    created_by: user?.id,
                    organization_id: organizationId,
                    project_id: projectId,
                    name: nameToUse,
                    thumbnail_url: thumbnailUrl,
                };

                const { error } = await supabase
                    .from('excalidraw_diagrams')
                    .upsert(diagramRecord);

                if (error) {
                    console.error('Error saving diagram:', error);
                    return;
                }

                // If this was a "Save As" operation, update the current diagram ID
                if (customDiagramId) {
                    setDiagramId(customDiagramId);
                    setDiagramName(customName || 'Untitled Diagram');

                    // Update URL with the new ID
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('id', customDiagramId);
                    window.history.pushState({}, '', newUrl);

                    // Update localStorage
                    const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
                    localStorage.setItem(projectStorageKey, customDiagramId);

                    // Notify parent component if callback is provided
                    if (onDiagramSaved) {
                        onDiagramSaved(customDiagramId);
                    }
                }

                // Update last saved data reference
                lastSavedDataRef.current = {
                    elements,
                    appState: {
                        ...appState,
                        collaborators: new Map(),
                    },
                };

                setIsExistingDiagram(true); // Mark as existing after first successful save
                setLastSaved(new Date());
                const projectStorageKey = `${LAST_DIAGRAM_ID_KEY}_${projectId}`;
                localStorage.setItem(projectStorageKey, idToUse);
                console.log('Diagram saved successfully');
            } catch (error) {
                console.error('Error saving diagram:', error);
            } finally {
                setIsAutoSaving(false);
            }
        },
        [
            diagramId,
            diagramName,
            isAutoSaving,
            isExistingDiagram,
            hasChanges,
            organizationId,
            projectId,
            user?.id,
            onDiagramSaved,
            generateThumbnail,
        ],
    );

    // Handle Save As operation
    const handleSaveAs = async () => {
        if (!excalidrawApiRef.current || !newDiagramName.trim()) return;

        const elements = excalidrawApiRef.current.getSceneElements();
        const appState = excalidrawApiRef.current.getAppState();
        const files = excalidrawApiRef.current.getFiles();

        // Generate a new UUID
        const newId = uuidv4();

        // Save with the new ID and name
        await saveDiagram(
            elements,
            appState,
            files,
            newId,
            newDiagramName.trim(),
            true,
        );

        // Close the dialog
        setIsSaveAsDialogOpen(false);
        setNewDiagramName('');
    };

    // Debounced save function to avoid too many API calls
    const debouncedSave = useCallback(
        (
            elements: readonly ExcalidrawElement[],
            appState: AppState,
            files: BinaryFiles,
        ) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                saveDiagram(elements, appState, files);
            }, 2000);
        },
        [saveDiagram],
    );

    const handleChange = useCallback(
        (
            elements: readonly ExcalidrawElement[],
            appState: AppState,
            files: BinaryFiles,
        ) => {
            debouncedSave(elements, appState, files);
        },
        [debouncedSave],
    );

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Notify parent component when diagram name changes
    useEffect(() => {
        if (onDiagramNameChange) {
            onDiagramNameChange(diagramName);
        }
    }, [diagramName, onDiagramNameChange]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="h-full w-full min-h-[500px] relative">
            <div className="absolute top-2.5 right-2.5 flex items-center gap-2.5 z-[1000]">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-white dark:bg-sidebar"
                    onClick={() => {
                        setNewDiagramName('');
                        setIsSaveAsDialogOpen(true);
                    }}
                >
                    <Save size={14} className="mr-1 dark:hover:text-white" />{' '}
                    Save As
                </Button>
            </div>

            {lastSaved && (
                <div className="absolute top-2.5 right-20 text-xs text-gray-400 dark:text-gray-400 z-[1000]">
                    Last saved: {lastSaved.toLocaleTimeString()}
                </div>
            )}

            {authError && (
                <div className="absolute top-12 left-2.5 text-sm text-red-600 bg-red-100 bg-opacity-80 p-2 rounded z-[1000]">
                    {authError}
                </div>
            )}

            <Excalidraw
                onChange={handleChange}
                initialData={{
                    ...initialData,
                    appState: {
                        ...(initialData?.appState || {}),
                        theme: isDarkMode ? 'dark' : 'light',
                    },
                }}
                theme={isDarkMode ? 'dark' : 'light'}
                excalidrawAPI={(api) => {
                    excalidrawApiRef.current = api;
                }}
            >
                <MainMenu>
                    <MainMenu.DefaultItems.LoadScene />
                    <MainMenu.DefaultItems.SaveToActiveFile />
                    <MainMenu.DefaultItems.SaveAsImage />
                    <MainMenu.DefaultItems.ClearCanvas />
                    <MainMenu.DefaultItems.Export />
                </MainMenu>
            </Excalidraw>

            {/* Save As Dialog */}
            <Dialog
                open={isSaveAsDialogOpen}
                onOpenChange={setIsSaveAsDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Diagram As</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newDiagramName}
                            onChange={(e) => setNewDiagramName(e.target.value)}
                            placeholder="New diagram name"
                            className="mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsSaveAsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveAs}
                                disabled={!newDiagramName.trim()}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ExcalidrawWrapper;
