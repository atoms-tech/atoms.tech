'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { atomsApiClient } from '@/lib/atoms-api';

// Define the interface for the diagram item based on the actual database schema
interface DiagramItem {
    id: string;
    name: string;
    thumbnail_url: string | null;
    updated_at: string;
    created_by: string | null;
}

// Define the database response structure
interface DiagramDatabaseRow {
    id: string;
    name: string | null;
    thumbnail_url: string | null;
    updated_at: string | null;
    created_by: string | null;
}

interface DiagramGalleryProps {
    onNewDiagram: () => void;
    onSelectDiagram: (diagramId: string) => void;
}

const DiagramGallery: React.FC<DiagramGalleryProps> = ({
    onNewDiagram,
    onSelectDiagram,
}) => {
    const [diagrams, setDiagrams] = useState<DiagramItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);
    const [renameDialog, setRenameDialog] = useState<{
        isOpen: boolean;
        diagramId: string | null;
        name: string;
    }>({
        isOpen: false,
        diagramId: null,
        name: '',
    });
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        diagramId: string | null;
    }>({
        isOpen: false,
        diagramId: null,
    });
    const [error, setError] = useState<string | null>(null);

    const pathname = usePathname();
    const projectId = pathname.split('/')[4];

    // Fetch all diagrams for the current project
    const fetchDiagrams = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!projectId) return;

            const api = atomsApiClient();
            const list = await api.diagrams.listByProject(projectId);
            const mappedData: DiagramItem[] = (list as any[]).map((item: DiagramDatabaseRow) => ({
                id: item.id,
                name: item.name || 'Untitled Diagram',
                thumbnail_url: item.thumbnail_url,
                updated_at: item.updated_at || new Date().toISOString(),
                created_by: item.created_by,
            }));

            setDiagrams(mappedData);
        } catch (err) {
            console.error('Error in fetchDiagrams:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    // Fetch diagrams when component mounts or projectId changes
    useEffect(() => {
        if (projectId) {
            fetchDiagrams();
        }
    }, [projectId, fetchDiagrams]);

    const handleSelectDiagram = (diagramId: string) => {
        setSelectedDiagramId(diagramId);
        onSelectDiagram(diagramId);

        // Update URL with selected diagram ID
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', diagramId);
        window.history.pushState({}, '', newUrl);
    };

    const handleRenameDiagram = async (diagramId: string, newName: string) => {
        if (!newName.trim()) return;

        try {
            const api = atomsApiClient();
            await api.diagrams.updateName(diagramId, newName.trim());

            // Update local state
            setDiagrams((prev) =>
                prev.map((d) =>
                    d.id === diagramId ? { ...d, name: newName.trim() } : d,
                ),
            );
            setRenameDialog({ isOpen: false, diagramId: null, name: '' });
        } catch (err) {
            console.error('Error in handleRenameDiagram:', err);
            setError('An unexpected error occurred');
        }
    };

    const handleDeleteDiagram = async (diagramId: string) => {
        try {
            const api = atomsApiClient();
            await api.diagrams.delete(diagramId);

            // Remove from local state
            setDiagrams((prev) => prev.filter((d) => d.id !== diagramId));
            setDeleteDialog({ isOpen: false, diagramId: null });

            // If the deleted diagram was selected, clear selection
            if (selectedDiagramId === diagramId) {
                setSelectedDiagramId(null);
            }
        } catch (err) {
            console.error('Error in handleDeleteDiagram:', err);
            setError('An unexpected error occurred');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            console.error('Error in formatDate:', error);
            return 'Unknown date';
        }
    };

    return (
        <div className="p-5 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold">Diagram Gallery</h2>
                <Button onClick={onNewDiagram} className="flex items-center gap-1">
                    <Plus size={16} />
                    New Diagram
                </Button>
            </div>

            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-md mb-5">{error}</div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            ) : diagrams.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-sidebar rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        No diagrams found
                    </p>
                    <Button onClick={onNewDiagram}>Create Your First Diagram</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {diagrams.map((diagram) => (
                        <div
                            key={diagram.id}
                            className={`bg-white dark:bg-sidebar rounded-lg overflow-hidden border ${
                                selectedDiagramId === diagram.id
                                    ? 'border-indigo-500 ring-2 ring-indigo-300'
                                    : 'border-gray-200 dark:border-sidebar-foreground'
                            } shadow-sm hover:shadow-md transition-all cursor-pointer`}
                        >
                            <div
                                className="h-40 bg-gray-100 dark:bg-sidebar flex items-center justify-center"
                                onClick={() => handleSelectDiagram(diagram.id)}
                            >
                                {diagram.thumbnail_url ? (
                                    <Image
                                        src={diagram.thumbnail_url}
                                        alt={diagram.name || 'Untitled Diagram'}
                                        className="w-full h-full object-contain"
                                        width={300}
                                        height={160}
                                    />
                                ) : (
                                    <div className="text-center p-4">
                                        <p className="text-gray-400 truncate">
                                            {diagram.name || 'Untitled Diagram'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-center">
                                    <h3
                                        className="font-medium truncate"
                                        title={diagram.name || 'Untitled Diagram'}
                                    >
                                        {diagram.name || 'Untitled Diagram'}
                                    </h3>
                                    <div className="flex gap-1">
                                        <Dialog
                                            open={
                                                renameDialog.isOpen &&
                                                renameDialog.diagramId === diagram.id
                                            }
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    setRenameDialog({
                                                        isOpen: false,
                                                        diagramId: null,
                                                        name: '',
                                                    });
                                                }
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenameDialog({
                                                            isOpen: true,
                                                            diagramId: diagram.id,
                                                            name:
                                                                diagram.name ||
                                                                'Untitled Diagram',
                                                        });
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Rename Diagram
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <Input
                                                        value={renameDialog.name}
                                                        onChange={(e) =>
                                                            setRenameDialog({
                                                                ...renameDialog,
                                                                name: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Diagram name"
                                                        className="mb-4"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                setRenameDialog({
                                                                    isOpen: false,
                                                                    diagramId: null,
                                                                    name: '',
                                                                })
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                if (
                                                                    renameDialog.diagramId
                                                                ) {
                                                                    handleRenameDiagram(
                                                                        renameDialog.diagramId,
                                                                        renameDialog.name,
                                                                    );
                                                                }
                                                            }}
                                                            disabled={
                                                                !renameDialog.name.trim()
                                                            }
                                                        >
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog
                                            open={
                                                deleteDialog.isOpen &&
                                                deleteDialog.diagramId === diagram.id
                                            }
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    setDeleteDialog({
                                                        isOpen: false,
                                                        diagramId: null,
                                                    });
                                                }
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteDialog({
                                                            isOpen: true,
                                                            diagramId: diagram.id,
                                                        });
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Delete Diagram
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <p>
                                                        Are you sure you want to delete
                                                        &quot;
                                                        {diagram.name ||
                                                            'Untitled Diagram'}
                                                        &quot;?
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        This action cannot be undone.
                                                    </p>
                                                    <div className="flex justify-end gap-2 mt-4">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                setDeleteDialog({
                                                                    isOpen: false,
                                                                    diagramId: null,
                                                                })
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() => {
                                                                if (
                                                                    deleteDialog.diagramId
                                                                ) {
                                                                    handleDeleteDiagram(
                                                                        deleteDialog.diagramId,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Last updated: {formatDate(diagram.updated_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DiagramGallery;
// No direct Supabase import; using atoms-api client
