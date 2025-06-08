'use client';

import BulletList from '@tiptap/extension-bullet-list';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { GripVertical, Trash2 } from 'lucide-react';
import React, { useState, useRef, useCallback } from 'react';

import { cn } from '@/lib/utils';
import { Json } from '@/types/base/database.types';
import { BlockProps } from '@/components/custom/BlockCanvas/types';
import { Toolbar } from './FormatToolbar';
import { 
    SlashCommandAutocomplete,
    useSlashCommands,
    useSlashCommandContext,
} from '@/components/ui/slash-commands';

/**
 * Enhanced TextBlock component with slash command support
 */
export const TextBlockWithSlashCommands: React.FC<BlockProps> = ({
    block,
    onUpdate,
    onDelete,
    onSelect,
    dragActivators,
}) => {
    const { searchCommands: _searchCommands } = useSlashCommandContext();

    // Helper function to safely get text content from Json
    const getTextContent = useCallback((content: Json | null | undefined): string => {
        if (!content) return '';
        if (typeof content === 'string') return content;
        if (typeof content === 'object' && content !== null && 'text' in content) {
            return typeof content.text === 'string' ? content.text : '';
        }
        return '';
    }, []);

    const [localContent, setLocalContent] = useState(getTextContent(block.content));
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    const lastSavedContent = useRef(getTextContent(block.content));
    const editorRef = useRef<HTMLDivElement>(null);

    const isEditMode = true; // For demo purposes, always in edit mode

    // Custom styles for the editor
    const customStyles = `
        .empty-editor-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            color: #9ca3af;
            pointer-events: none;
            font-size: inherit;
            line-height: inherit;
        }
        .slash-command-active {
            background-color: rgba(59, 130, 246, 0.1);
            border-radius: 3px;
            padding: 1px 2px;
        }
    `;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5],
                },
                bulletList: false,
                orderedList: false,
                listItem: false,
            }),
            BulletList.configure({
                HTMLAttributes: {
                    class: '',
                },
            }),
            OrderedList.configure({
                HTMLAttributes: {
                    class: 'ordered-list',
                },
            }),
            ListItem,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: false,
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
        ],
        content: getTextContent(block.content) || '<p></p>',
        editable: Boolean(isEditMode),
        onSelectionUpdate: ({ editor }) => {
            if (!isEditMode) return;

            const { from, to } = editor.state.selection;
            if (from === to) {
                setShowToolbar(false);
                return;
            }

            const editorElement = editorRef.current;
            if (!editorElement) return;

            const view = editor.view;
            const start = view.coordsAtPos(from);
            const editorRect = editorElement.getBoundingClientRect();

            setToolbarPosition({
                top: start.top - editorRect.top - 10,
                left: start.left - editorRect.left,
            });
            setShowToolbar(true);
        },
        onUpdate: ({ editor }) => {
            if (!isEditMode) return;

            const {isEmpty} = editor;
            let newContent = editor.getHTML();

            if (isEmpty || newContent === '<p></p>') {
                newContent = '';
            }

            setLocalContent(newContent);
            
            // Handle slash command detection
            const { from } = editor.state.selection;
            const _textBefore = editor.state.doc.textBetween(Math.max(0, from - 50), from);
            const currentText = editor.getText();
            
            handleInputChange(currentText, from);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
            },
            handleKeyDown: (view, event) => {
                // Handle slash command keyboard events
                if (handleKeyDown(event as unknown as React.KeyboardEvent)) {
                    return true; // Event was handled by slash commands
                }
                return false;
            },
        },
        immediatelyRender: false,
    });

    // Slash command integration
    const {
        state: slashState,
        handleInputChange,
        handleKeyDown,
        executeSelectedCommand,
        closeAutocomplete: _closeAutocomplete,
        setSelectedIndex,
    } = useSlashCommands({
        editor: editor || undefined,
        onCommandExecuted: (commandId) => {
            console.log('Slash command executed:', commandId);
        },
    });

    // Save content when exiting edit mode or on blur
    const saveContent = useCallback(() => {
        if (!editor) return;
        
        const editorContent = editor.getHTML();
        const contentToSave = editorContent === '<p></p>' ? '' : editorContent;
        
        if (contentToSave !== lastSavedContent.current) {
            lastSavedContent.current = contentToSave;
            onUpdate({
                content: {
                    text: contentToSave,
                    format: (typeof block.content === 'object' && block.content !== null && 'format' in block.content)
                        ? block.content.format || 'default'
                        : 'default',
                } as Json,
                updated_at: new Date().toISOString(),
            });
        }
    }, [editor, onUpdate, block.content]);

    // Auto-save on content change (debounced)
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveContent();
        }, 1000); // Save after 1 second of inactivity

        return () => clearTimeout(timeoutId);
    }, [localContent, saveContent]);

    // Focus editor when entering edit mode
    React.useEffect(() => {
        if (editor && isEditMode) {
            editor.setEditable(true);
            if (getTextContent(block.content) === '<p></p>' || !getTextContent(block.content)) {
                setTimeout(() => {
                    editor.commands.focus();
                }, 100);
            }
        }
    }, [isEditMode, editor, getTextContent, block.content]);

    return (
        <div className="group flex items-start gap-2">
            {isEditMode && (
                <div className="flex flex-col gap-2 -mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                        {...dragActivators}
                        className="cursor-grab active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.();
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )}
            <div
                ref={editorRef}
                className={cn('relative w-full')}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(block.id);
                    if (isEditMode && editor && editor.state.selection.empty) {
                        editor.commands.focus();
                    }
                }}
            >
                {/* Format Toolbar */}
                {isEditMode && showToolbar && (
                    <div
                        className="absolute z-40 format-toolbar"
                        style={{
                            top: `${toolbarPosition.top}px`,
                            left: `${toolbarPosition.left}px`,
                            pointerEvents: 'none',
                        }}
                    >
                        <Toolbar
                            editor={editor}
                            className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 transform -translate-y-full transition-all duration-200 pointer-events-auto"
                        />
                    </div>
                )}

                {/* Slash Command Autocomplete */}
                <SlashCommandAutocomplete
                    state={slashState}
                    onSelect={setSelectedIndex}
                    onExecute={executeSelectedCommand}
                    className="z-50" // Higher z-index than toolbar
                />

                <style>{customStyles}</style>
                <div className="relative min-h-[1.5em]">
                    {/* Placeholder */}
                    {(!localContent || localContent === '' || localContent === '<p></p>') && (
                        <div className="empty-editor-placeholder">
                            Type &quot;/&quot; for commands or start writing...
                        </div>
                    )}
                    <EditorContent
                        editor={editor}
                        className="prose prose-sm dark:prose-invert max-w-none w-full focus:outline-none"
                        onClick={() => {
                            if (editor?.state.selection.empty) {
                                setShowToolbar(false);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
