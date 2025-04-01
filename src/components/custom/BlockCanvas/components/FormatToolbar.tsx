import { Editor } from '@tiptap/react';
import debounce from 'lodash/debounce';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowRight,
    Bold,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Underline,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolbarProps {
    className?: string;
    editor: Editor | null;
    dragActivators?: React.ComponentProps<typeof React.Fragment>;
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5;
type ListType = 'bullet' | 'ordered' | 'arrow';

const HeadingIcon = ({ level }: { level: HeadingLevel }) => {
    const icons = {
        1: Heading1,
        2: Heading2,
        3: Heading3,
        4: Heading4,
        5: Heading5,
    };
    const Icon = icons[level];
    return <Icon size={16} />;
};

const ListIcon = ({ type }: { type: ListType }) => {
    switch (type) {
        case 'bullet':
            return <List size={16} />;
        case 'ordered':
            return <ListOrdered size={16} />;
        case 'arrow':
            return <ArrowRight size={16} />;
        default:
            return <List size={16} />;
    }
};

export function Toolbar({
    className,
    editor,
    dragActivators: _dragActivators,
}: ToolbarProps) {
    const _iconSize = 16;
    const [toolbarState, setToolbarState] = useState({
        headingLevel: 1 as HeadingLevel,
        listType: 'bullet' as ListType,
    });

    const updateState = useMemo(
        () =>
            debounce(() => {
                if (!editor) return;

                setToolbarState((prev) => {
                    const newState = { ...prev };

                    // Update heading level
                    for (let level = 1; level <= 5; level++) {
                        if (editor.isActive('heading', { level })) {
                            newState.headingLevel = level as HeadingLevel;
                            break;
                        }
                    }

                    // Update list type
                    if (editor.isActive('bulletList')) {
                        if (
                            editor.isActive('bulletList', {
                                class: 'arrow-list',
                            })
                        ) {
                            newState.listType = 'arrow';
                        } else {
                            newState.listType = 'bullet';
                        }
                    } else if (editor.isActive('orderedList')) {
                        newState.listType = 'ordered';
                    }

                    return newState;
                });
            }, 100),
        [editor],
    );

    useEffect(() => {
        if (!editor) return;

        editor.on('selectionUpdate', updateState);
        editor.on('update', updateState);

        return () => {
            editor.off('selectionUpdate', updateState);
            editor.off('update', updateState);
            updateState.cancel();
        };
    }, [editor, updateState]);

    if (!editor) {
        return null;
    }

    const toggleHeading = () => {
        const nextLevel = ((toolbarState.headingLevel % 5) + 1) as HeadingLevel;
        setToolbarState((prev) => ({ ...prev, headingLevel: nextLevel }));

        // First clear any existing heading
        for (let level = 1; level <= 5; level++) {
            editor
                .chain()
                .focus()
                .toggleHeading({ level: level as HeadingLevel })
                .run();
        }
        // Then apply the new heading level
        editor.chain().focus().toggleHeading({ level: nextLevel }).run();
    };

    const toggleList = () => {
        const listTypes: ListType[] = ['bullet', 'ordered', 'arrow'];
        const currentIndex = listTypes.indexOf(toolbarState.listType);
        const nextType = listTypes[(currentIndex + 1) % listTypes.length];
        setToolbarState((prev) => ({ ...prev, listType: nextType }));

        // Clear any existing list format
        editor.chain().focus().toggleBulletList().toggleOrderedList().run();

        // Apply the new list format
        switch (nextType) {
            case 'bullet':
                editor.chain().focus().toggleBulletList().run();
                break;
            case 'ordered':
                editor.chain().focus().toggleOrderedList().run();
                break;
            case 'arrow':
                editor
                    .chain()
                    .focus()
                    .toggleBulletList()
                    .updateAttributes('bulletList', { class: 'arrow-list' })
                    .run();
                break;
        }
    };

    const addImage = () => {
        const url = window.prompt('Enter image URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const addLink = () => {
        const url = window.prompt('Enter URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            {/* Basic Formatting */}
            <div className="flex items-center gap-0.5">
                <Button
                    variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold size={14} />
                </Button>
                <Button
                    variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic size={14} />
                </Button>
                <Button
                    variant={
                        editor.isActive('underline') ? 'secondary' : 'ghost'
                    }
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                >
                    <Underline size={14} />
                </Button>
                <Button
                    variant={editor.isActive('code') ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                >
                    <Code size={14} />
                </Button>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-border mx-0.5" />

            {/* Links */}
            <div className="flex items-center gap-0.5">
                <Button
                    variant={editor.isActive('link') ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={addLink}
                >
                    <LinkIcon size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={addImage}
                >
                    <ImageIcon size={14} />
                </Button>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-border mx-0.5" />

            {/* Structure */}
            <div className="flex items-center gap-0.5">
                <Button
                    variant={
                        editor.isActive('heading', {
                            level: toolbarState.headingLevel,
                        })
                            ? 'secondary'
                            : 'ghost'
                    }
                    size="icon"
                    className="h-7 w-7"
                    onClick={toggleHeading}
                    title={`Heading ${toolbarState.headingLevel}`}
                >
                    <HeadingIcon level={toolbarState.headingLevel} />
                </Button>
                <Button
                    variant={
                        (toolbarState.listType === 'bullet' &&
                            editor.isActive('bulletList')) ||
                        (toolbarState.listType === 'ordered' &&
                            editor.isActive('orderedList')) ||
                        (toolbarState.listType === 'arrow' &&
                            editor.isActive('bulletList', {
                                class: 'arrow-list',
                            }))
                            ? 'secondary'
                            : 'ghost'
                    }
                    size="icon"
                    className="h-7 w-7"
                    onClick={toggleList}
                    title={`${toolbarState.listType.charAt(0).toUpperCase() + toolbarState.listType.slice(1)} List`}
                >
                    <ListIcon type={toolbarState.listType} />
                </Button>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-border mx-0.5" />

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
                <Button
                    variant={
                        editor.isActive({ textAlign: 'left' })
                            ? 'secondary'
                            : 'ghost'
                    }
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                        editor.chain().focus().setTextAlign('left').run()
                    }
                >
                    <AlignLeft size={14} />
                </Button>
                <Button
                    variant={
                        editor.isActive({ textAlign: 'center' })
                            ? 'secondary'
                            : 'ghost'
                    }
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                        editor.chain().focus().setTextAlign('center').run()
                    }
                >
                    <AlignCenter size={14} />
                </Button>
                <Button
                    variant={
                        editor.isActive({ textAlign: 'right' })
                            ? 'secondary'
                            : 'ghost'
                    }
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                        editor.chain().focus().setTextAlign('right').run()
                    }
                >
                    <AlignRight size={14} />
                </Button>
            </div>
        </div>
    );
}
