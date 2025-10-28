'use client';

import { motion } from 'framer-motion';
import { File, Grid, List, Trash, Upload } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
    useDeleteExternalDocument,
    useUploadExternalDocument,
} from '@/hooks/mutations/useExternalDocumentsMutations';
import { useExternalDocumentsByOrg } from '@/hooks/queries/useExternalDocuments';
import { useOrgMemberRole } from '@/hooks/queries/useOrgMember';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { OrganizationRole, hasOrganizationPermission } from '@/lib/auth/permissions';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';

interface ExternalDocsPageProps {
    onTotalUsageUpdate?: (totalUsage: number) => void;
}

export default function ExternalDocsPage({
    onTotalUsageUpdate = () => {},
}: ExternalDocsPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sortOption, setSortOption] = useState('');
    const [totalUsage, setTotalUsage] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { theme } = useTheme();
    const uploadDocument = useUploadExternalDocument();
    const deleteDocument = useDeleteExternalDocument();
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();
    const organizationContext = useOrganization();
    const organization = organizationContext?.currentOrganization || null;
    const pathname = usePathname();
    const { toast } = useToast();
    const { user } = useUser();

    // Extract orgId from URL path
    const pathOrgId = pathname ? pathname.split('/')[2] : null;

    // Use organization.id if available, otherwise fall back to path-based orgId
    const currentOrgId = organization?.id || pathOrgId;

    const { data: userRoleQuery } = useOrgMemberRole(currentOrgId || '', user?.id || '');
    const userRole: OrganizationRole | null = userRoleQuery ?? null;

    // Only fetch documents if we have a valid orgId
    const { data, refetch } = useExternalDocumentsByOrg(currentOrgId ? currentOrgId : '');

    // Calculate total usage
    useEffect(() => {
        const usage = data?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
        setTotalUsage(usage);
        onTotalUsageUpdate(usage);

        if (usage > 1000 * 1024 * 1024) {
            setErrorMessage(
                'You have reached the storage cap of 1000 MB. Please delete some documents to upload more.',
            );
        } else {
            setErrorMessage(null);
        }
    }, [data, onTotalUsageUpdate]);

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (totalUsage > 1000 * 1024 * 1024) {
            toast({
                title: 'Error',
                description: 'Storage cap reached. Cannot upload more documents.',
                variant: 'destructive',
            });
            return;
        }

        const file = e.target.files?.[0];

        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        if (!currentOrgId) {
            alert('Organization ID is missing. Please try again or contact support.');
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
            refetch();
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
            alert('Organization ID is missing. Please try again or contact support.');
            return;
        }

        try {
            setIsDeleting(true);
            await deleteDocument.mutateAsync({
                documentId,
                orgId: currentOrgId,
            });
            refetch();
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
    const sortedFiles = filteredFiles?.filter((file) =>
        sortOption ? file.type?.toLowerCase() === sortOption.toLowerCase() : true,
    );

    const openFile = (documentId: string) => {
        if (!currentOrgId) {
            alert('Organization ID is missing. Cannot open file.');
            return;
        }

        if (authLoading || !supabase) {
            toast({
                title: 'Authentication not ready',
                description: authError ?? 'Please try again in a moment.',
                variant: 'destructive',
            });
            return;
        }

        const filePath = `${currentOrgId}/${documentId}`;

        const { data: publicUrl } = supabase.storage
            .from('external_documents')
            .getPublicUrl(filePath);

        if (!publicUrl) {
            console.error('Failed to get file URL');
            toast({
                title: 'Error',
                description: 'Failed to get file URL. Please try again.',
                variant: 'destructive',
            });
            return;
        }

        window.open(publicUrl.publicUrl, '_blank');
    };

    return (
        <div className="container p-6">
            <div className="mb-4 flex justify-between items-center">
                <div className="flex w-full md:w-auto space-x-2">
                    <Input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {[
                                'pdf',
                                'doc',
                                'docx',
                                'txt',
                                'xls',
                                'xlsx',
                                'ppt',
                                'pptx',
                            ].map((type) => (
                                <DropdownMenuItem
                                    key={type}
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={() =>
                                        setSortOption((prev) =>
                                            prev === type ? '' : type,
                                        )
                                    }
                                >
                                    <span
                                        className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                            sortOption === type
                                                ? 'bg-primary'
                                                : 'bg-gray-200'
                                        }`}
                                    ></span>
                                    {type.toUpperCase()}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {hasOrganizationPermission(userRole, 'manageDocs') && (
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                            id="file-upload"
                            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                        />
                    )}
                    {hasOrganizationPermission(userRole, 'manageDocs') && (
                        <label htmlFor="file-upload">
                            <Button
                                variant="default"
                                className="w-9 h-9"
                                onClick={() =>
                                    document.getElementById('file-upload')?.click()
                                }
                                disabled={
                                    !currentOrgId ||
                                    isUploading ||
                                    totalUsage > 1000 * 1024 * 1024
                                }
                            >
                                <Upload className="w-4 h-4" />
                            </Button>
                        </label>
                    )}
                </div>
                <div className="relative flex space-x-0 border rounded-md overflow-hidden">
                    <motion.div
                        className="absolute inset-0 bg-primary"
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
                        className={`w-9 h-9 relative z-10 ${
                            viewMode === 'list'
                                ? 'text-white'
                                : theme === 'dark'
                                  ? 'text-white'
                                  : 'text-black'
                        }`}
                        onClick={() => setViewMode('list')}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="link"
                        className={`w-9 h-9 relative z-10 ${
                            viewMode === 'grid'
                                ? 'text-white'
                                : theme === 'dark'
                                  ? 'text-white'
                                  : 'text-black'
                        }`}
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {errorMessage && (
                <div className="text-center py-4 text-red-600">{errorMessage}</div>
            )}

            {!currentOrgId ? (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">
                        Organization not found. Please select a valid organization.
                    </p>
                </div>
            ) : (
                <>
                    {isUploading && (
                        <div className="text-center py-2">
                            <p className="text-muted-foreground">Uploading document...</p>
                        </div>
                    )}
                    {sortedFiles && sortedFiles.length > 0 ? (
                        <div
                            className={`grid ${
                                viewMode === 'grid'
                                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                                    : 'grid-cols-1'
                            } gap-2 justify-start`}
                        >
                            {sortedFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className={`border ${
                                        theme === 'dark'
                                            ? 'hover:bg-accent'
                                            : 'hover:bg-gray-200'
                                    } cursor-pointer`}
                                    onClick={() => openFile(file.id)}
                                    style={{
                                        margin: '1px',
                                        padding: viewMode === 'list' ? '13px' : '30px',
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center min-w-0 flex-1">
                                            <File className="w-4 h-4 mr-4 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h3
                                                    className="text-sm font-semibold truncate"
                                                    title={file.name}
                                                >
                                                    {file.name}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {file.type}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {file.size
                                                        ? `${(file.size / 1024).toFixed(2)} KB`
                                                        : 'Unknown size'}
                                                </p>
                                            </div>
                                        </div>
                                        {hasOrganizationPermission(
                                            userRole,
                                            'manageDocs',
                                        ) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFileDelete(file.id);
                                                }}
                                                className="text-red-500 hover:bg-background hover:text-red-700"
                                                disabled={isDeleting}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-lg">
                            <File className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">
                                No documents found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Please upload documents to share with your organization.
                            </p>
                            {hasOrganizationPermission(userRole, 'manageDocs') && (
                                <label htmlFor="file-upload">
                                    <Button
                                        variant="default"
                                        className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                                        onClick={() =>
                                            document
                                                .getElementById('file-upload')
                                                ?.click()
                                        }
                                        disabled={
                                            !currentOrgId ||
                                            isUploading ||
                                            totalUsage > 1000 * 1024 * 1024
                                        }
                                    >
                                        Upload Document
                                    </Button>
                                </label>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
