'use client';

import type { Column } from '@/components/base/DashboardView';
import { MonospaceTable } from '@/components/base/MonospaceTable';
import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/lib/store/document.store';
import { cn } from '@/lib/utils';
import { Json } from '@/types/base/database.types';
import { Block } from '@/types/base/documents.types';
import { Requirement } from '@/types/base/requirements.types';
import { Plus, PlusCircle, Table, Type } from 'lucide-react';
import React, { useState } from 'react';

// Mock requirements for testing
const mockRequirements: Requirement[] = [
    {
        id: '1',
        name: 'User Authentication',
        description: 'Implement secure user authentication system',
        format: 'incose',
        level: 'system',
        priority: 'high',
        status: 'active',
        document_id: 'doc1',
        block_id: 'block1',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user1',
        updated_by: 'user1',
        deleted_at: null,
        deleted_by: null,
        is_deleted: false,
        ai_analysis: null,
        enchanced_requirement: null,
        external_id: null,
        original_requirement: null,
        tags: ['security', 'user'],
    },
    {
        id: '2',
        name: 'Data Encryption',
        description: 'Implement end-to-end encryption for sensitive data',
        format: 'ears',
        level: 'component',
        priority: 'medium',
        status: 'pending',
        document_id: 'doc1',
        block_id: 'block1',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user1',
        updated_by: 'user1',
        deleted_at: null,
        deleted_by: null,
        is_deleted: false,
        ai_analysis: null,
        enchanced_requirement: null,
        external_id: null,
        original_requirement: null,
        tags: ['security', 'data'],
    },
];

interface BlockContent {
    text?: string;
    requirements?: Requirement[];
}

const TextBlock = ({
    block,
    onUpdate,
}: {
    block: Block;
    onUpdate: (content: Json) => void;
}) => {
    const content = block.content as { text?: string };
    return (
        <div
            className="min-h-[2em] px-4 py-2 focus:outline-none"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
                onUpdate({ text: e.currentTarget.textContent || '' })
            }
            dangerouslySetInnerHTML={{ __html: content?.text || '' }}
        />
    );
};

const TableBlock = ({
    block,
    onUpdate,
}: {
    block: Block;
    onUpdate: (content: Json) => void;
}) => {
    const content = block.content as { requirements: Requirement[] };
    const requirements = content?.requirements || [];

    const columns: Column<Requirement>[] = [
        {
            header: 'Name',
            accessor: (req) => req.name,
            width: 30,
        },
        {
            header: 'Description',
            accessor: (req) => req.description || '',
            width: 40,
        },
        {
            header: 'Priority',
            accessor: (req) => req.priority,
            width: 15,
        },
        {
            header: 'Status',
            accessor: (req) => req.status,
            width: 15,
        },
    ];

    const handleAddRequirement = () => {
        const newRequirement: Requirement = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'New Requirement',
            description: 'Add description here',
            format: 'incose',
            level: 'system',
            priority: 'medium',
            status: 'draft',
            document_id: block.document_id,
            block_id: block.id,
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'test-user',
            updated_by: 'test-user',
            deleted_at: null,
            deleted_by: null,
            is_deleted: false,
            ai_analysis: null,
            enchanced_requirement: null,
            external_id: null,
            original_requirement: null,
            tags: [],
        };

        const updatedRequirements = [...requirements, newRequirement];
        onUpdate({ requirements: updatedRequirements });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRequirement}
                    className="gap-2"
                >
                    <PlusCircle className="h-4 w-4" />
                    Add Requirement
                </Button>
            </div>
            <MonospaceTable
                data={requirements}
                columns={columns}
                emptyMessage="No requirements added yet. Click 'Add Requirement' to create one."
                showFilter={false}
            />
        </div>
    );
};

export function BlockCanvas() {
    const { blocks, addBlock, updateBlock, deleteBlock, moveBlock } =
        useDocumentStore();
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    const handleAddBlock = (type: 'text' | 'table') => {
        const newBlock: Block = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: type === 'text' ? { text: '' } : { requirements: [] },
            position: blocks.length,
            document_id: 'test-doc',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'test-user',
            updated_by: 'test-user',
            deleted_at: null,
            deleted_by: null,
            is_deleted: false,
            version: 1,
        };
        addBlock(newBlock);
    };

    const renderBlock = (block: Block) => {
        const isSelected = block.id === selectedBlockId;

        return (
            <div
                key={block.id}
                className={cn(
                    'group relative rounded-lg border border-transparent transition-all hover:border-gray-200',
                    isSelected && 'border-blue-500',
                )}
                onClick={() => setSelectedBlockId(block.id)}
            >
                {block.type === 'text' && (
                    <TextBlock
                        block={block}
                        onUpdate={(content) => updateBlock(block.id, content)}
                    />
                )}
                {block.type === 'table' && (
                    <TableBlock
                        block={block}
                        onUpdate={(content) => updateBlock(block.id, content)}
                    />
                )}

                <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteBlock(block.id)}
                    >
                        <Plus className="h-4 w-4 rotate-45" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-[500px] space-y-4">
            {blocks.map(renderBlock)}

            <div className="flex gap-2 mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('text')}
                    className="gap-2"
                >
                    <Type className="h-4 w-4" />
                    Add Text
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('table')}
                    className="gap-2"
                >
                    <Table className="h-4 w-4" />
                    Add Requirements Table
                </Button>
            </div>
        </div>
    );
}
