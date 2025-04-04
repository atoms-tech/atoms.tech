'use client';

import { motion } from 'framer-motion';
import { File, Filter, Grid, List, Trash, Upload } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
    useDeleteExternalDocument,
    useUploadExternalDocument,
} from '@/hooks/mutations/useExternalDocumentsMutations';
import { useExternalDocumentsByOrg } from '@/hooks/queries/useExternalDocuments';
import { useOrganization } from '@/lib/providers/organization.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';

export default function ExternalDocsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sortOption, setSortOption] = useState('name-asc');
    const [showSortOptions, setShowSortOptions] = useState(false);
    const { theme } = useTheme();
    const uploadDocument = useUploadExternalDocument();
    const deleteDocument = useDeleteExternalDocument();
    const organizationContext = useOrganization();
    const organization = organizationContext?.currentOrganization || null;
    const pathname = usePathname();
    const { toast } = useToast();

    // Extract orgId from URL path
    const pathOrgId = pathname ? pathname.split('/')[2] : null;

    // Use organization.id if available, otherwise fall back to path-based orgId
    const currentOrgId = organization?.id || pathOrgId;

    // Only fetch documents if we have a valid orgId
    const { data, refetch } = useExternalDocumentsByOrg(
        currentOrgId ? currentOrgId : '',
    );

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        if (!currentOrgId) {
            alert(
                'Organization ID is missing. Please try again or contact support.',
            );
            console.error('Missing organization ID for file upload');
            return;
        }

        try {
            setIsUploading(true);
            await uploadDocument.mutateAsync({ file, orgId: currentOrgId });
            toast({
                title: 'Success',
                description: 'File uploaded successfully!',
                variant: 'default',
            });
            refetch(); // Refresh the file list after upload
        } catch (error) {
            console.error('Failed to upload document', error);
            toast({
                title: 'Error',
                description: 'Failed to upload document.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    // Handle file deletion
    const handleFileDelete = async (documentId: string) => {
        if (!currentOrgId) {
            alert(
                'Organization ID is missing. Please try again or contact support.',
            );
            return;
        }

        try {
            setIsDeleting(true);
            await deleteDocument.mutateAsync({
                documentId,
                orgId: currentOrgId,
            });
            refetch(); // Refresh the file list after deletion
            toast({
                title: 'Success',
                description: 'File deleted successfully!',
                variant: 'default',
            });
        } catch (error) {
            console.error('Failed to delete document', error);
            toast({
                title: 'Error',
                description: 'Failed to delete document.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter files based on search term
    const filteredFiles = data?.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Sort files based on selected option
    const sortedFiles = filteredFiles?.sort((a, b) => {
        switch (sortOption) {
            case 'size':
                if (!a.size || !b.size) return 0;
                return a.size - b.size;
            case 'created_at':
                if (!a.created_at || !b.created_at) return 0;
                return (
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );
            case 'type':
                if (!a.type || !b.type) return 0;
                return a.type.localeCompare(b.type);
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });

    const openFile = (documentId: string) => {
        if (!currentOrgId) {
            alert('Organization ID is missing. Cannot open file.');
            return;
        }

        const filePath = `${currentOrgId}/${documentId}`;

        // Get a public URL for the file from Supabase storage
        const { data: publicUrl } = supabase.storage
            .from('external_documents')
            .getPublicUrl(filePath);

        // Open the file in a new tab
        if (publicUrl) {
            window.open(publicUrl.publicUrl, '_blank');
        } else {
            alert('Failed to get file URL. Please try again.');
        }
    };

    return (
        <div className="container p-6">
            <div className="mb-4 flex justify-between items-center">
                <div className="flex space-x-2">
                    <div className="relative flex space-x-0">
                        <Input
                            type="text"
                            placeholder="Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                            id="file-upload"
                            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                        />
                        <label htmlFor="file-upload">
                            <Button
                                variant="default"
                                className="w-9 h-9"
                                onClick={() =>
                                    document
                                        .getElementById('file-upload')
                                        ?.click()
                                }
                                disabled={!currentOrgId || isUploading}
                            >
                                <Upload className="w-4 h-4" />
                            </Button>
                        </label>
                    </div>
                    <div className="flex space-x-0">
                        <Button
                            variant="default"
                            className="w-9 h-9"
                            onClick={() => setShowSortOptions(!showSortOptions)}
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
                        <motion.select
                            initial={{ width: 0, opacity: 0 }}
                            animate={{
                                width: showSortOptions ? 'auto' : 0,
                                opacity: showSortOptions ? 1 : 0,
                            }}
                            transition={{ duration: 0.3 }}
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="border border-gray-300 p-1 text-gray-500 text-sm focus:outline-none"
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="size">Size</option>
                            <option value="created_at">Date Created</option>
                            <option value="type">Type</option>
                        </motion.select>
                    </div>
                </div>
                <div className="relative flex space-x-0">
                    <motion.div
                        className="absolute inset-0 bg-accent"
                        layout
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                        style={{
                            left: viewMode === 'list' ? 0 : '50%',
                            width: '50%',
                        }}
                    />
                    <Button
                        variant="link"
                        className={`w-9 h-9 relative z-10 ${viewMode === 'list' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-black'}`}
                        onClick={() => setViewMode('list')}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="link"
                        className={`w-9 h-9 relative z-10 ${viewMode === 'grid' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-black'}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {!currentOrgId ? (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">
                        Organization not found. Please select a valid
                        organization.
                    </p>
                </div>
            ) : (
                <>
                    {isUploading && (
                        <div className="text-center py-2">
                            <p className="text-muted-foreground">
                                Uploading document...
                            </p>
                        </div>
                    )}
                    <div
                        className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-2 justify-start`}
                    >
                        {sortedFiles?.map((file) => (
                            <div
                                key={file.id}
                                className={`border border-gray-300 ${
                                    theme === 'dark'
                                        ? 'hover:bg-accent'
                                        : 'hover:bg-gray-200'
                                } cursor-pointer`}
                                onClick={() => openFile(file.id)}
                                style={{
                                    margin: '1px',
                                    padding:
                                        viewMode === 'list' ? '13px' : '30px',
                                }} // Customize spacing, padding, and margins
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <File className="w-4 h-4 mr-4" />
                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                {file.name}
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                {file.type}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent div click from triggering
                                            handleFileDelete(file.id);
                                        }}
                                        className="text-red-500 hover:bg-background hover:text-red-700"
                                        disabled={isDeleting}
                                    >
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
