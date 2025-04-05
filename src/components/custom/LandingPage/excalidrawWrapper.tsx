'use client';

import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type {
    AppState,
    BinaryFiles,
    ExcalidrawImperativeAPI,
    ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase/supabaseBrowser';

import '@excalidraw/excalidraw/index.css';

import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';
import { usePathname } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import { useUser } from '@/lib/providers/user.provider';

const LAST_DIAGRAM_ID_KEY = 'lastExcalidrawDiagramId';

// Add a type definition for diagram data from Supabase
interface ExcalidrawDiagramData {
    elements: ExcalidrawElement[];
    appState: Partial<AppState>;
    files: BinaryFiles;
}

// Get the type for NormalizedZoomValue from @excalidraw/excalidraw
type NormalizedZoomValue = AppState['zoom']['value'];

interface ExcalidrawWrapperProps {
    onMounted?: (api: {
        addMermaidDiagram: (mermaidSyntax: string) => Promise<void>;
    }) => void;
}

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ onMounted }) => {
    const [diagramId, setDiagramId] = useState<string | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [initialData, setInitialData] =
        useState<ExcalidrawInitialDataState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExistingDiagram, setIsExistingDiagram] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );
    const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
    const lastSavedDataRef = useRef<{
        elements: readonly ExcalidrawElement[];
        appState: AppState;
    } | null>(null);

    const { user } = useUser();
    const organizationId = usePathname().split('/')[2];
    const projectId = usePathname().split('/')[4];

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

    // Initialize diagram ID and load data on mount
    useEffect(() => {
        const initializeDiagram = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const idFromUrl = urlParams.get('id');
                const lastDiagramId = localStorage.getItem(LAST_DIAGRAM_ID_KEY);

                // Priority: URL param > localStorage > new diagram
                let id: string | null = null;

                if (idFromUrl && isValidUuid(idFromUrl)) {
                    id = idFromUrl;
                } else if (lastDiagramId && isValidUuid(lastDiagramId)) {
                    id = lastDiagramId;
                    // Update URL with the stored ID
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('id', id);
                    window.history.pushState({}, '', newUrl);
                }

                if (id) {
                    setDiagramId(id);
                    localStorage.setItem(LAST_DIAGRAM_ID_KEY, id);

                    // Fetch existing diagram data
                    const { data, error } = await supabase
                        .from('excalidraw_diagrams')
                        .select('diagram_data')
                        .eq('id', id)
                        .single();

                    if (error) {
                        console.error('Error loading diagram:', error);
                        // If error is not found, create new diagram
                        if (error.code === 'PGRST116') {
                            createNewDiagram();
                        }
                    } else if (data?.diagram_data) {
                        setIsExistingDiagram(true);
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
                            },
                            files: files,
                        };
                        setInitialData(initialDataState);
                        lastSavedDataRef.current = {
                            elements:
                                initialDataState.elements as readonly ExcalidrawElement[],
                            appState: initialDataState.appState as AppState,
                        };
                    }
                } else {
                    createNewDiagram();
                }
            } catch (error) {
                console.error('Error initializing diagram:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Helper function to validate UUID
        const isValidUuid = (id: string): boolean => {
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id);
        };

        const createNewDiagram = () => {
            // Generate a UUID v4
            const newId = uuidv4();
            setDiagramId(newId);
            localStorage.setItem(LAST_DIAGRAM_ID_KEY, newId);

            // Update URL with the new ID
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('id', newId);
            window.history.pushState({}, '', newUrl);
        };

        initializeDiagram();
    }, []);

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
        ) => {
            if (!diagramId || isAutoSaving) return;

            // Only prevent saving if it's a new diagram and there are no elements
            if (!isExistingDiagram && (!elements || elements.length === 0)) {
                console.log('New diagram with no elements - skipping save');
                return;
            }

            // Check if there are actual changes to save
            if (!hasChanges(elements, appState)) {
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

                // Serialize the diagram data to ensure it's JSON compatible
                const serializedData = JSON.stringify(diagramData);

                const { error } = await supabase
                    .from('excalidraw_diagrams')
                    .upsert({
                        id: diagramId,
                        diagram_data: JSON.parse(serializedData),
                        updated_at: now,
                        updated_by: user?.id,
                        created_by: user?.id,
                        organization_id: organizationId,
                        project_id: projectId,
                    });

                if (error) {
                    console.error('Error saving diagram:', error);
                    return;
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
                localStorage.setItem(LAST_DIAGRAM_ID_KEY, diagramId);
                console.log('Diagram saved successfully');
            } catch (error) {
                console.error('Error saving diagram:', error);
            } finally {
                setIsAutoSaving(false);
            }
        },
        [
            diagramId,
            isAutoSaving,
            isExistingDiagram,
            hasChanges,
            organizationId,
            projectId,
            user?.id,
        ],
    );

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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ height: '720px', width: '1280px' }}>
            {lastSaved && (
                <div
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        fontSize: '12px',
                        color: '#666',
                    }}
                >
                    Last saved: {lastSaved.toLocaleTimeString()}
                </div>
            )}
            <Excalidraw
                onChange={handleChange}
                initialData={initialData}
                excalidrawAPI={(api) => {
                    excalidrawApiRef.current = api;
                }}
            />
        </div>
    );
};

export default ExcalidrawWrapper;
