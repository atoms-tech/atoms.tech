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

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';

import '@excalidraw/excalidraw/index.css';

import { convertToExcalidrawElements, exportToSvg } from '@excalidraw/excalidraw';
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    onDiagramIdChange?: (id: string | null) => void;
    pendingRequirementId?: string | null;
    pendingDocumentId?: string | null;
}

// Utility to add requirementId and documentId to elements
function addRequirementIdToElements<T extends ExcalidrawElement>(
    elements: readonly T[] | T[],
    requirementId: string | null,
    documentId: string | null = null,
): T[] {
    if (!requirementId) return elements as T[];
    return elements.map((el) => ({
        ...el,
        requirementId,
        documentId: documentId || undefined,
    })) as T[];
}

// Update the ElementWithRequirementProps to be a proper type
type ElementWithRequirementProps = ExcalidrawElement & {
    requirementId?: string;
    documentId?: string;
};

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({
    onMounted,
    diagramId: externalDiagramId,
    onDiagramSaved,
    onDiagramNameChange,
    onDiagramIdChange,
    pendingRequirementId,
    pendingDocumentId,
}) => {
    const [diagramId, setDiagramId] = useState<string | null>(externalDiagramId || null);
    const [diagramName, setDiagramName] = useState<string>('Untitled Diagram');
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isExistingDiagram, setIsExistingDiagram] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isSaveAsDialogOpen, setIsSaveAsDialogOpen] = useState(false);
    const [newDiagramName, setNewDiagramName] = useState('');

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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
    const router = useRouter();
    const {
        isLoading: supabaseLoading,
        error: supabaseError,
        getClientOrThrow,
    } = useAuthenticatedSupabase();

    // Tooltip state for selected requirement-linked element
    const [linkTooltip, setLinkTooltip] = useState<{
        x: number;
        y: number;
        requirementId: string;
        documentId?: string;
    } | null>(null);
    // Keep track of previously selected element to prevent update loops
    const prevSelectedElementRef = useRef<string | null>(null);

    // Add state for a bounding box overlay
    const [boundingBoxOverlay, setBoundingBoxOverlay] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
        requirementId: string;
    } | null>(null);

    // Add refs to track previous scroll and zoom state
    const prevScrollXRef = useRef<number | null>(null);
    const prevScrollYRef = useRef<number | null>(null);
    const prevZoomRef = useRef<number | null>(null);

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
                const svgString = new XMLSerializer().serializeToString(svgElement);
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
                if (supabaseLoading) {
                    return false;
                }

                if (supabaseError) {
                    setAuthError('Authentication error: ' + supabaseError);
                    return false;
                }

                const supabase = getClientOrThrow();
                // Fetch existing diagram data with authorization check
                const { data, error } = await supabase
                    .from('excalidraw_diagrams')
                    .select('diagram_data, project_id, name')
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Error loading diagram:', error);
                    if (error.message.includes('multiple (or no) rows returned')) {
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
                            currentItemFontFamily: appState?.currentItemFontFamily || 1,
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
        [getClientOrThrow, isDarkMode, projectId, supabaseError, supabaseLoading],
    );

    // Function to refresh just the diagram name from the database
    const refreshDiagramName = useCallback(async () => {
        if (!diagramId) return;

        try {
            if (supabaseLoading) return;
            if (supabaseError) {
                console.error('Authentication error:', supabaseError);
                return;
            }

            const supabase = getClientOrThrow();
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
    }, [diagramId, diagramName, getClientOrThrow, supabaseError, supabaseLoading]);

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

        console.log('created new diagram');

        setIsLoading(false);
    }, [projectId, isDarkMode]);

    // Move the function definition to a useCallback
    const addMermaidDiagram = useCallback(
        async (mermaidSyntax: string) => {
            try {
                const { elements: skeletonElements } =
                    await parseMermaidToExcalidraw(mermaidSyntax);

                let excalidrawElements = convertToExcalidrawElements(skeletonElements);

                // Attach requirementId if present (for requirement→diagram flow)
                console.log('Before check');
                if (pendingRequirementId) {
                    console.log('pendingrequirementId was present', pendingRequirementId);
                    excalidrawElements = addRequirementIdToElements(
                        excalidrawElements as unknown as ExcalidrawElement[],
                        pendingRequirementId,
                        pendingDocumentId,
                    ) as unknown as typeof excalidrawElements;
                    console.log(
                        '[Excalidraw] requirementId attached to mermaid elements',
                        {
                            pendingRequirementId,
                            documentId: pendingDocumentId,
                            elementCount: excalidrawElements.length,
                            elements: excalidrawElements,
                        },
                    );
                }

                if (excalidrawApiRef.current) {
                    const currentElements = excalidrawApiRef.current.getSceneElements();

                    // Calculate bounding boxes
                    const getBoundingBox = (elements: readonly ExcalidrawElement[]) => {
                        if (!elements.length) return null;
                        let minX = Infinity,
                            minY = Infinity,
                            maxX = -Infinity,
                            maxY = -Infinity;
                        for (const el of elements) {
                            if (el.isDeleted) continue;
                            minX = Math.min(minX, el.x);
                            minY = Math.min(minY, el.y);
                            maxX = Math.max(maxX, el.x + (el.width || 0));
                            maxY = Math.max(maxY, el.y + (el.height || 0));
                        }
                        return {
                            minX,
                            minY,
                            maxX,
                            maxY,
                            width: maxX - minX,
                            height: maxY - minY,
                        };
                    };

                    const existingBox = getBoundingBox(currentElements);
                    const newBox = getBoundingBox(excalidrawElements);

                    // Find non-overlapping position
                    let offsetX = 0,
                        offsetY = 0;
                    if (existingBox && newBox) {
                        //place to the right
                        const margin = 80;
                        offsetX = existingBox.maxX - newBox.minX + margin;
                        offsetY = 0;
                    } else if (!existingBox && newBox) {
                        //center the new diagram at (0,0)
                        const centerX = newBox.minX + newBox.width / 2;
                        const centerY = newBox.minY + newBox.height / 2;
                        offsetX = -centerX;
                        offsetY = -centerY;
                    }

                    //Offset new elements
                    if (offsetX !== 0 || offsetY !== 0) {
                        excalidrawElements = excalidrawElements.map((el) => ({
                            ...el,
                            x: el.x + offsetX,
                            y: el.y + offsetY,
                        }));
                    }

                    // Collect new element IDs for selection
                    const newElementIds = excalidrawElements.map((el) => el.id);
                    const selectedElementIds = Object.fromEntries(
                        newElementIds.map((id) => [id, true as const]),
                    );

                    excalidrawApiRef.current.updateScene({
                        elements: [...currentElements, ...excalidrawElements],
                        appState: {
                            // preserve theme and other appState, but set selection
                            ...(excalidrawApiRef.current.getAppState?.() || {}),
                            selectedElementIds,
                        },
                    });

                    //scroll to new content
                    setTimeout(() => {
                        excalidrawApiRef.current?.scrollToContent(excalidrawElements, {
                            fitToContent: true,
                            animate: true,
                            duration: 600,
                        });
                    }, 50);
                }
            } catch (error) {
                console.error('Error converting mermaid to excalidraw:', error);
                throw error;
            }
        },
        [pendingRequirementId, pendingDocumentId, excalidrawApiRef],
    );

    // Expose the addMermaidDiagram function to parent
    useEffect(() => {
        if (onMounted) {
            console.log('onMounted called, pendingRequirementId:', pendingRequirementId);
            onMounted({ addMermaidDiagram });
        }
    }, [onMounted, pendingRequirementId, addMermaidDiagram]);

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
                        const urlParams = new URLSearchParams(window.location.search);
                        const idFromUrl = urlParams.get('id');
                        const lastDiagramId = localStorage.getItem(projectStorageKey);

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
        pendingRequirementId,
        pendingDocumentId,
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
            const prevViewBg = lastSavedDataRef.current.appState.viewBackgroundColor;
            if (currentViewBg !== prevViewBg) return true;

            const currentZoom = appState.zoom;
            const prevZoom = lastSavedDataRef.current.appState.zoom;
            if (JSON.stringify(currentZoom) !== JSON.stringify(prevZoom)) return true;

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
            if (!forceSave && !customDiagramId && !hasChanges(elements, appState)) {
                console.log('No changes detected - skipping save');
                return;
            }

            try {
                if (supabaseLoading) {
                    console.warn('Supabase client still initializing; skipping save');
                    return;
                }

                if (supabaseError) {
                    setAuthError('Authentication error: ' + supabaseError);
                    return;
                }

                const supabase = getClientOrThrow();
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
                const thumbnailUrl = await generateThumbnail(elements, appState);

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
            generateThumbnail,
            getClientOrThrow,
            hasChanges,
            isAutoSaving,
            isExistingDiagram,
            onDiagramSaved,
            organizationId,
            projectId,
            supabaseError,
            supabaseLoading,
            user?.id,
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
        await saveDiagram(elements, appState, files, newId, newDiagramName.trim(), true);

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

    // Modify handleChange to update tooltip and position it over all related elements
    const handleChange = useCallback(
        (
            elements: readonly ExcalidrawElement[],
            appState: AppState,
            files: BinaryFiles,
        ) => {
            debouncedSave(elements, appState, files);

            // Check if canvas position or zoom has changed
            const hasCanvasMoved =
                prevScrollXRef.current !== null &&
                prevScrollYRef.current !== null &&
                prevZoomRef.current !== null &&
                (prevScrollXRef.current !== appState.scrollX ||
                    prevScrollYRef.current !== appState.scrollY ||
                    prevZoomRef.current !== appState.zoom.value);

            // Update previous values
            prevScrollXRef.current = appState.scrollX;
            prevScrollYRef.current = appState.scrollY;
            prevZoomRef.current = appState.zoom.value;

            // Clear tooltip and bounding box if canvas has moved
            if (hasCanvasMoved) {
                setLinkTooltip(null);
                setBoundingBoxOverlay(null);
                prevSelectedElementRef.current = null;
                return;
            }

            // Determine if a single element with requirementId is selected
            const selectedIds = Object.keys(appState.selectedElementIds || {});
            if (selectedIds.length >= 1 && excalidrawApiRef.current) {
                const selectedId = selectedIds[0];
                // Only process if this is a new selection
                if (prevSelectedElementRef.current !== selectedId) {
                    prevSelectedElementRef.current = selectedId;

                    const selEl = elements.find((el) => el.id === selectedId);
                    const reqId = (selEl as ElementWithRequirementProps)?.requirementId;
                    const docId = (selEl as ElementWithRequirementProps)?.documentId;

                    if (selEl && reqId) {
                        // Find all elements with the same requirementId
                        const allSameRequirementElements = elements.filter(
                            (el) =>
                                (el as ElementWithRequirementProps)?.requirementId ===
                                reqId,
                        );

                        // Get connected elements
                        const relatedElements = getSpatialCluster(
                            allSameRequirementElements,
                            selEl,
                        );

                        const boundingBox = calculateBoundingBox(relatedElements);

                        // Update the bounding box
                        setBoundingBoxOverlay({
                            x: boundingBox.minX,
                            y: boundingBox.minY,
                            width: boundingBox.width,
                            height: boundingBox.height,
                            requirementId: reqId,
                        });

                        const zoom = appState.zoom.value;
                        const { scrollX, scrollY } = appState;
                        const tooltipWidth = 120; // Approximate width of tooltip in pixels
                        const boxRightX =
                            boundingBox.minX +
                            boundingBox.width -
                            tooltipWidth / zoom -
                            5; // Account for tooltip width
                        const boxTopY = boundingBox.minY - 5; // Place it slightly above the top edge

                        const screenX = (boxRightX + scrollX) * zoom;
                        const screenY = (boxTopY + scrollY) * zoom;

                        setLinkTooltip({
                            x: screenX,
                            y: screenY,
                            requirementId: reqId,
                            documentId: docId,
                        });
                    } else {
                        setLinkTooltip(null);
                        setBoundingBoxOverlay(null);
                    }
                }
            } else if (
                selectedIds.length === 0 &&
                prevSelectedElementRef.current !== null
            ) {
                // Clear selection tracking and tooltip when nothing is selected
                prevSelectedElementRef.current = null;
                setLinkTooltip(null);
                setBoundingBoxOverlay(null);
            }
        },
        [debouncedSave],
    );

    // Function to calculate bounding box for a group of elements
    const calculateBoundingBox = (elements: readonly ExcalidrawElement[]) => {
        if (!elements.length) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        elements.forEach((el) => {
            if (el.isDeleted) return;

            // Get coordinates
            const x = el.x;
            const y = el.y;
            const width = el.width || 0;
            const height = el.height || 0;

            // Update bounds
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
        });

        // Calculate dimensions
        const width = maxX - minX;
        const height = maxY - minY;

        return { minX, minY, maxX, maxY, width, height };
    };

    // Function to cluster elements based on spatial proximity
    const getSpatialCluster = (
        elements: readonly ExcalidrawElement[],
        selectedElement: ExcalidrawElement,
        proximityThreshold = 100, // Adjust this value to control clustering sensitivity
    ): ExcalidrawElement[] => {
        if (!elements.length) return [];

        // Initialize with the selected element
        const cluster: ExcalidrawElement[] = [selectedElement];
        const processedIds = new Set<string>([selectedElement.id]);
        const elementsToProcess = [selectedElement];

        // Keep adding elements to the cluster as long as we find new connected elements
        while (elementsToProcess.length > 0) {
            const currentElement = elementsToProcess.shift()!;
            const currentBounds = {
                x1: currentElement.x,
                y1: currentElement.y,
                x2: currentElement.x + (currentElement.width || 0),
                y2: currentElement.y + (currentElement.height || 0),
            };

            // Find all nearby elements not already in the cluster
            const nearbyElements = elements.filter((el) => {
                if (processedIds.has(el.id) || el.isDeleted) return false;

                const elBounds = {
                    x1: el.x,
                    y1: el.y,
                    x2: el.x + (el.width || 0),
                    y2: el.y + (el.height || 0),
                };

                // Calculate the distance between bounding boxes
                const xDistance = Math.max(
                    0,
                    Math.max(
                        currentBounds.x1 - elBounds.x2,
                        elBounds.x1 - currentBounds.x2,
                    ),
                );
                const yDistance = Math.max(
                    0,
                    Math.max(
                        currentBounds.y1 - elBounds.y2,
                        elBounds.y1 - currentBounds.y2,
                    ),
                );

                // Use Euclidean distance
                const distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
                return distance <= proximityThreshold;
            });

            // Add all nearby elements to the cluster and queue them for processing
            nearbyElements.forEach((el) => {
                cluster.push(el);
                processedIds.add(el.id);
                elementsToProcess.push(el);
            });
        }

        return cluster;
    };

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

    // Whenever diagramId changes, notify parent
    useEffect(() => {
        if (onDiagramIdChange) {
            onDiagramIdChange(diagramId);
        }
    }, [diagramId, onDiagramIdChange]);

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
                    <Save size={14} className="mr-1 dark:hover:text-white" /> Save As
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
            <Dialog open={isSaveAsDialogOpen} onOpenChange={setIsSaveAsDialogOpen}>
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

            {/* Tooltip for requirement link */}
            {linkTooltip && (
                <div
                    className="absolute z-[1001] px-2 py-1 bg-primary text-white text-xs rounded shadow cursor-pointer"
                    style={{
                        left: linkTooltip.x,
                        top: linkTooltip.y,
                        transform: 'none',
                    }}
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            sessionStorage.setItem(
                                'jumpToRequirementId',
                                linkTooltip.requirementId,
                            );
                            console.log(
                                'Set requirementId in sessionStorage:',
                                linkTooltip.requirementId,
                            );
                        }
                        router.push(
                            `/org/${organizationId}/project/${projectId}/documents/${linkTooltip.documentId}`,
                        );
                    }}
                >
                    Jump to Requirement
                </div>
            )}

            {/* Bounding box overlay for diagram from requirement */}
            {boundingBoxOverlay && excalidrawApiRef.current && (
                <div
                    className="absolute z-[1000] pointer-events-none border-2 border-primary rounded-md"
                    style={{
                        left:
                            (boundingBoxOverlay.x +
                                excalidrawApiRef.current.getAppState().scrollX) *
                            excalidrawApiRef.current.getAppState().zoom.value,
                        top:
                            (boundingBoxOverlay.y +
                                excalidrawApiRef.current.getAppState().scrollY) *
                            excalidrawApiRef.current.getAppState().zoom.value,
                        width:
                            boundingBoxOverlay.width *
                            excalidrawApiRef.current.getAppState().zoom.value,
                        height:
                            boundingBoxOverlay.height *
                            excalidrawApiRef.current.getAppState().zoom.value,
                        opacity: 0.5,
                    }}
                />
            )}
        </div>
    );
};

export default ExcalidrawWrapper;
