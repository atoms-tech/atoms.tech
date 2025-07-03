import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { createClient } from '@/lib/supabase/supabaseServer';
import { Json } from '@/types/base/database.types';

interface DuplicateDocumentRequest {
    targetProjectId: string;
    newName?: string;
    includeRequirements?: boolean;
    includeProperties?: boolean;
}

interface DuplicateProgress {
    step: string;
    progress: number;
    total: number;
    message: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ documentId: string }> },
) {
    try {
        const supabase = await createClient();
        const { documentId } = await params;

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Parse request body
        const body: DuplicateDocumentRequest = await request.json();
        const {
            targetProjectId,
            newName,
            includeRequirements = true,
            includeProperties = true,
        } = body;

        if (!targetProjectId) {
            return NextResponse.json(
                { error: 'Target project ID is required' },
                { status: 400 },
            );
        }

        // Validate source document exists and user has access
        const { data: sourceDocument, error: sourceError } = await supabase
            .from('documents')
            .select(
                `
                *,
                project:projects!inner(
                    id,
                    name,
                    organization_id,
                    project_members!inner(
                        user_id,
                        role
                    )
                )
            `,
            )
            .eq('id', documentId)
            .eq('is_deleted', false)
            .eq('project.project_members.user_id', user.id)
            .single();

        if (sourceError || !sourceDocument) {
            return NextResponse.json(
                { error: 'Source document not found or access denied' },
                { status: 404 },
            );
        }

        // Validate target project exists and user has access
        const { data: targetProject, error: targetError } = await supabase
            .from('projects')
            .select(
                `
                *,
                project_members!inner(
                    user_id,
                    role
                )
            `,
            )
            .eq('id', targetProjectId)
            .eq('project_members.user_id', user.id)
            .single();

        if (targetError || !targetProject) {
            return NextResponse.json(
                { error: 'Target project not found or access denied' },
                { status: 404 },
            );
        }

        // Check if user has permission to create documents in target project
        const userRole = targetProject.project_members[0]?.role;
        const canCreateDocuments = [
            'owner',
            'admin',
            'maintainer',
            'editor',
        ].includes(userRole);

        if (!canCreateDocuments) {
            return NextResponse.json(
                {
                    error: 'Insufficient permissions to create documents in target project',
                },
                { status: 403 },
            );
        }

        // Generate new document ID and name
        const newDocumentId = uuidv4();
        const duplicatedName = newName || `${sourceDocument.name} (Copy)`;
        const duplicatedSlug = duplicatedName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');

        // Check for duplicate slug in target project
        const { data: existingDoc } = await supabase
            .from('documents')
            .select('id')
            .eq('project_id', targetProjectId)
            .eq('slug', duplicatedSlug)
            .eq('is_deleted', false)
            .single();

        const finalSlug = existingDoc
            ? `${duplicatedSlug}-${Date.now()}`
            : duplicatedSlug;

        const timestamp = new Date().toISOString();

        // Start transaction-like operations
        // 1. Create the new document
        const { data: newDocument, error: docError } = await supabase
            .from('documents')
            .insert({
                id: newDocumentId,
                name: duplicatedName,
                slug: finalSlug,
                description: sourceDocument.description,
                project_id: targetProjectId,
                tags: sourceDocument.tags,
                created_by: user.id,
                updated_by: user.id,
                created_at: timestamp,
                updated_at: timestamp,
                is_deleted: false,
                version: 1,
            })
            .select()
            .single();

        if (docError) {
            return NextResponse.json(
                {
                    error: 'Failed to create document copy',
                    details: docError.message,
                },
                { status: 500 },
            );
        }

        let progress: DuplicateProgress = {
            step: 'document',
            progress: 1,
            total: 4,
            message: 'Document created successfully',
        };

        // 2. Copy blocks and requirements if requested
        if (includeRequirements) {
            // Get all blocks with their requirements
            const { data: sourceBlocks, error: blocksError } = await supabase
                .from('blocks')
                .select(
                    `
                    *,
                    requirements(*)
                `,
                )
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('position');

            if (blocksError) {
                // Cleanup: delete the created document
                await supabase
                    .from('documents')
                    .update({
                        is_deleted: true,
                        deleted_by: user.id,
                        deleted_at: timestamp,
                    })
                    .eq('id', newDocumentId);

                return NextResponse.json(
                    {
                        error: 'Failed to fetch source blocks',
                        details: blocksError.message,
                    },
                    { status: 500 },
                );
            }

            progress = {
                step: 'blocks',
                progress: 2,
                total: 4,
                message: `Copying ${sourceBlocks?.length || 0} blocks...`,
            };

            if (sourceBlocks && sourceBlocks.length > 0) {
                // Create new blocks
                const newBlocks = sourceBlocks.map((block) => ({
                    id: uuidv4(),
                    document_id: newDocumentId,
                    type: block.type,
                    content: block.content,
                    position: block.position,
                    name: block.name,
                    org_id: block.org_id,
                    created_by: user.id,
                    updated_by: user.id,
                    created_at: timestamp,
                    updated_at: timestamp,
                    is_deleted: false,
                    version: 1,
                }));

                const { data: createdBlocks, error: createBlocksError } =
                    await supabase.from('blocks').insert(newBlocks).select();

                if (createBlocksError) {
                    // Cleanup
                    await supabase
                        .from('documents')
                        .update({
                            is_deleted: true,
                            deleted_by: user.id,
                            deleted_at: timestamp,
                        })
                        .eq('id', newDocumentId);

                    return NextResponse.json(
                        {
                            error: 'Failed to create blocks',
                            details: createBlocksError.message,
                        },
                        { status: 500 },
                    );
                }

                // Copy requirements for each block
                const allRequirements: Array<{
                    id: string;
                    document_id: string;
                    block_id: string;
                    name: string;
                    description: string;
                    level: string;
                    format: string;
                    priority: string;
                    external_id: string;
                    original_requirement: string;
                    enchanced_requirement: string;
                    ai_analysis: Record<string, unknown> | null;
                    created_by: string;
                    updated_by: string;
                    created_at: string;
                    updated_at: string;
                    is_deleted: boolean;
                    version: number;
                }> = [];
                for (let i = 0; i < sourceBlocks.length; i++) {
                    const sourceBlock = sourceBlocks[i];
                    const newBlock = createdBlocks[i];

                    if (
                        sourceBlock.requirements &&
                        sourceBlock.requirements.length > 0
                    ) {
                        const newRequirements = sourceBlock.requirements
                            .filter(
                                (req: Record<string, unknown>) =>
                                    !req.is_deleted,
                            )
                            .map((req: Record<string, unknown>) => ({
                                id: uuidv4(),
                                document_id: newDocumentId,
                                block_id: newBlock.id,
                                name: req.name as string,
                                description:
                                    (req.description as string | null) || '',
                                level: req.level as string,
                                format: req.format as string,
                                priority: req.priority as string,
                                external_id:
                                    (req.external_id as string | null) || '',
                                original_requirement:
                                    (req.original_requirement as
                                        | string
                                        | null) || '',
                                enchanced_requirement:
                                    (req.enchanced_requirement as
                                        | string
                                        | null) || '',
                                ai_analysis:
                                    req.ai_analysis &&
                                    typeof req.ai_analysis === 'object' &&
                                    !Array.isArray(req.ai_analysis)
                                        ? (req.ai_analysis as Record<
                                              string,
                                              unknown
                                          >)
                                        : null,
                                position: req.position as number,
                                status: req.status as string,
                                properties:
                                    (req.properties as Json | null) || {},
                                tags: req.tags as string[] | null,
                                type: (req.type as string | null) || '',
                                created_by: user.id,
                                updated_by: user.id,
                                created_at: timestamp,
                                updated_at: timestamp,
                                is_deleted: false,
                                version: 1,
                            }));

                        allRequirements.push(...newRequirements);
                    }
                }

                if (allRequirements.length > 0) {
                    const { error: requirementsError } = await supabase
                        .from('requirements')
                        .insert(allRequirements as any);

                    if (requirementsError) {
                        console.error(
                            'Failed to copy requirements:',
                            requirementsError,
                        );
                        // Don't fail the entire operation for requirements
                    }
                }
            }
        }

        progress = {
            step: 'properties',
            progress: 3,
            total: 4,
            message: 'Copying document properties...',
        };

        // 3. Copy document-specific properties if requested
        if (includeProperties) {
            const { data: sourceProperties, error: propsError } = await supabase
                .from('properties')
                .select('*')
                .eq('document_id', documentId);

            if (
                !propsError &&
                sourceProperties &&
                sourceProperties.length > 0
            ) {
                const newProperties = sourceProperties.map((prop) => ({
                    id: uuidv4(),
                    name: prop.name,
                    property_type: prop.property_type,
                    org_id: targetProject.organization_id,
                    document_id: newDocumentId,
                    project_id: targetProjectId,
                    scope: prop.scope,
                    options: prop.options,
                    is_base: false,
                    created_by: user.id,
                    updated_by: user.id,
                    created_at: timestamp,
                    updated_at: timestamp,
                }));

                await supabase.from('properties').insert(newProperties);
            }
        }

        progress = {
            step: 'complete',
            progress: 4,
            total: 4,
            message: 'Document duplication completed successfully',
        };

        return NextResponse.json({
            success: true,
            document: newDocument,
            progress,
            message: `Document "${duplicatedName}" created successfully in target project`,
        });
    } catch (error) {
        console.error('Document duplication error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error during document duplication',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
