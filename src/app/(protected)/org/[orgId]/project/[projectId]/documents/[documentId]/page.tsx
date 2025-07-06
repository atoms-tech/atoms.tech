'use client';

import { Table } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { AssignRequirementIdsModal } from '@/components/custom/BlockCanvas/components/EditableTable/components/AssignRequirementIdsModal';
import {
    BlockCanvas,
    BlockCanvasGlide,
    BlockCanvasTanStack,
} from '@/components/custom/BlockCanvas/indexExport';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import LayoutView from '@/components/views/LayoutView';
import { useDocumentRequirementScanner } from '@/hooks/useDocumentRequirementScanner';
import { supabase } from '@/lib/supabase/supabaseBrowser';

export default function DocumentPage() {
    const params = useParams();
    const documentId = params?.documentId as string;
    const organizationId = params?.orgId as string;

    //const [useTanStackTable, setUseTanStackTable] = useState(false);
    const [tableType, setTableType] = useState<
        'default' | 'tanstack' | 'glide'
    >('default');

    // Global REQ-ID assignment trigger
    const [triggerAssignIds, setTriggerAssignIds] = useState(0);

    // Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Use the document requirement scanner
    const {
        isScanning,
        isAssigning,
        requirementsWithoutIds,
        scanDocumentRequirements,
        assignRequirementIds,
    } = useDocumentRequirementScanner({
        documentId,
        organizationId,
    });

    //scroll to requirement if requirementId is in sessionStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        //get requirementId from sessionStorage
        const requirementId = sessionStorage.getItem('jumpToRequirementId');
        console.log(
            'Checking sessionStorage for requirementId:',
            requirementId,
        );

        if (requirementId) {
            const timeout = setTimeout(() => {
                console.log(
                    'Attempting to find element with ID:',
                    `requirement-${requirementId}`,
                );
                const element = document.getElementById(
                    `requirement-${requirementId}`,
                );

                if (element) {
                    //clear the requirementId from sessionStorage only after finding the element
                    sessionStorage.removeItem('jumpToRequirementId');
                    console.log(
                        'Element found, cleared sessionStorage, scrolling to it',
                    );

                    //scroll to element
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });

                    setTimeout(() => {
                        console.log('Adding highlight class');
                        element.style.backgroundColor =
                            'rgba(153, 59, 246, 0.3)';
                        element.classList.add('highlight-requirement');

                        setTimeout(() => {
                            console.log('Removing highlight');
                            element.style.backgroundColor = '';
                            element.classList.remove('highlight-requirement');
                        }, 3000);
                    }, 100);
                } else {
                    console.log(
                        'Element not found for requirementId:',
                        requirementId,
                    );
                }
            }, 1500);

            return () => clearTimeout(timeout);
        }

        // Return undefined explicitly for the case where requirementId is null
        return undefined;
    }, []);

    // REQ-ID assignment handler - scans document and shows modal
    const handleCheckRequirementIds = async () => {
        try {
            toast.loading('Scanning document for requirements without IDs...', {
                id: 'scanning',
            });

            const foundRequirements = await scanDocumentRequirements();

            toast.dismiss('scanning');

            if (foundRequirements.length === 0) {
                toast.success('All requirements already have proper REQ-IDs!');
                return;
            }

            // Show modal with detected requirements
            setShowAssignModal(true);
            toast.success(
                `Found ${foundRequirements.length} requirement${foundRequirements.length === 1 ? '' : 's'} needing IDs`,
            );
        } catch (error) {
            toast.dismiss('scanning');
            console.error('Error scanning requirements:', error);
            toast.error('Failed to scan document requirements');
        }
    };

    // Handle modal confirmation
    const handleAssignConfirm = async (selectedIds: string[]) => {
        if (selectedIds.length === 0) {
            toast.error(
                'Please select at least one requirement to assign an ID',
            );
            return;
        }

        try {
            console.log('🚀 Starting REQ-ID assignment for:', selectedIds);
            toast.loading(
                `Assigning REQ-IDs to ${selectedIds.length} requirement${selectedIds.length === 1 ? '' : 's'}...`,
                { id: 'assigning' },
            );

            await assignRequirementIds(selectedIds);

            toast.dismiss('assigning');
            toast.success(
                `Successfully assigned ${selectedIds.length} REQ-ID${selectedIds.length === 1 ? '' : 's'}!`,
            );

            console.log('✅ REQ-ID assignment completed successfully');

            // Close modal immediately
            setShowAssignModal(false);

            // Trigger a re-scan to update the UI
            setTriggerAssignIds((prev) => prev + 1);

            // Also refresh the page after a short delay to ensure all changes are visible
            setTimeout(() => {
                console.log('🔄 Refreshing page to show updated REQ-IDs');
                window.location.reload();
            }, 1500);
        } catch (error) {
            toast.dismiss('assigning');
            console.error('❌ Error assigning REQ-IDs:', error);
            toast.error(
                `Failed to assign REQ-IDs: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );

            // Don't close modal on error so user can retry
        }
    };

    // Handle modal close - always allow closing
    const handleModalClose = () => {
        console.log('🚪 Closing REQ-ID assignment modal');
        setShowAssignModal(false);
    };

    // Auto-cleanup is now handled in the scanner
    const _handleCheckDuplicateIds = async () => {
        try {
            console.log('🔍 Checking for duplicate REQ-IDs...');
            toast.loading('Checking for duplicate REQ-IDs...', {
                id: 'duplicates',
            });

            // Get all requirements with external_ids
            const { data: requirements, error } = await supabase
                .from('requirements')
                .select('id, name, external_id, block_id')
                .not('external_id', 'is', null)
                .not('external_id', 'eq', '')
                .eq('is_deleted', false);

            if (error) {
                throw error;
            }

            // Find duplicates
            const idCounts = new Map<
                string,
                Array<{ id: string; name: string; block_id: string }>
            >();

            requirements?.forEach((req) => {
                if (req.external_id && req.external_id.trim() !== '') {
                    const normalizedId = req.external_id.toUpperCase().trim();
                    if (!idCounts.has(normalizedId)) {
                        idCounts.set(normalizedId, []);
                    }
                    idCounts.get(normalizedId)!.push({
                        id: req.id,
                        name: req.name || 'Unnamed',
                        block_id: req.block_id,
                    });
                }
            });

            // Find actual duplicates
            const duplicates = Array.from(idCounts.entries())
                .filter(([_, reqs]) => reqs.length > 1)
                .map(([externalId, reqs]) => ({
                    externalId,
                    requirements: reqs,
                }));

            toast.dismiss('duplicates');

            if (duplicates.length === 0) {
                toast.success('No duplicate REQ-IDs found!');
                console.log('✅ No duplicates found');
            } else {
                console.log('🚨 Found duplicate REQ-IDs:', duplicates);
                toast.error(
                    `Found ${duplicates.length} duplicate REQ-ID${duplicates.length === 1 ? '' : 's'}! Check console for details.`,
                );
            }
        } catch (error) {
            toast.dismiss('duplicates');
            console.error('❌ Error checking duplicates:', error);
            toast.error('Failed to check for duplicate REQ-IDs');
        }
    };

    // Auto-cleanup is now handled in the scanner
    const _handleCleanupInvalidRequirements = async () => {
        try {
            console.log('🧹 Starting cleanup of invalid requirements...');
            toast.loading('Cleaning up invalid requirements...', {
                id: 'cleanup',
            });

            // Find requirements with invalid names or missing data
            const { data: invalidRequirements, error: fetchError } =
                await supabase
                    .from('requirements')
                    .select('id, name, external_id, block_id')
                    .or(
                        'name.is.null,name.eq.,name.eq.undefined,external_id.eq.undefined',
                    )
                    .eq('is_deleted', false);

            if (fetchError) {
                throw fetchError;
            }

            if (!invalidRequirements || invalidRequirements.length === 0) {
                toast.dismiss('cleanup');
                toast.success('No invalid requirements found!');
                return;
            }

            console.log('🗑️ Found invalid requirements:', invalidRequirements);
            console.log(
                '🔍 Invalid requirement details:',
                invalidRequirements.map((req) => ({
                    id: req.id,
                    name: req.name,
                    external_id: req.external_id,
                    nameType: typeof req.name,
                    externalIdType: typeof req.external_id,
                })),
            );

            // Soft delete invalid requirements
            const { error: deleteError } = await supabase
                .from('requirements')
                .update({ is_deleted: true })
                .in(
                    'id',
                    invalidRequirements.map((req) => req.id),
                );

            if (deleteError) {
                throw deleteError;
            }

            toast.dismiss('cleanup');
            toast.success(
                `Cleaned up ${invalidRequirements.length} invalid requirement${invalidRequirements.length === 1 ? '' : 's'}!`,
            );

            // Refresh the page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast.dismiss('cleanup');
            console.error('❌ Error cleaning up requirements:', error);
            toast.error('Failed to clean up invalid requirements');
        }
    };

    // Switch table renderer for page based on dropdown below.
    const renderTable = () => {
        switch (tableType) {
            case 'tanstack':
                return (
                    <BlockCanvasTanStack
                        documentId={documentId}
                        triggerAssignIds={triggerAssignIds}
                    />
                );
            case 'glide':
                return (
                    <BlockCanvasGlide
                        documentId={documentId}
                        triggerAssignIds={triggerAssignIds}
                    />
                );
            case 'default':
            default:
                return (
                    <BlockCanvas
                        documentId={documentId}
                        triggerAssignIds={triggerAssignIds}
                    />
                );
        }
    };

    return (
        <LayoutView>
            <div className="space-y-4">
                <div className="flex justify-end gap-2 mb-4 px-4">
                    <Button
                        variant="outline"
                        onClick={handleCheckRequirementIds}
                        disabled={isScanning || isAssigning}
                    >
                        {isScanning ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Scanning...
                            </>
                        ) : (
                            'Assign REQ-IDs'
                        )}
                    </Button>
                    <Select
                        value={tableType}
                        onValueChange={(value) =>
                            setTableType(value as typeof tableType)
                        }
                    >
                        <SelectTrigger className="w-[240px]">
                            <Table className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Select table type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">
                                Default Table
                            </SelectItem>
                            <SelectItem value="tanstack">
                                TanStack Table
                            </SelectItem>
                            <SelectItem value="glide">
                                Glide Table (Demo)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {renderTable()}
            </div>

            {/* REQ-ID Assignment Modal */}
            <AssignRequirementIdsModal
                isOpen={showAssignModal}
                onClose={handleModalClose}
                onConfirm={handleAssignConfirm}
                requirementsWithoutIds={requirementsWithoutIds}
                isLoading={isAssigning}
            />
        </LayoutView>
    );
}
