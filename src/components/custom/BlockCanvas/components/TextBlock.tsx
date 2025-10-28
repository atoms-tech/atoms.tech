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
import React from 'react';

import { BlockProps } from '@/components/custom/BlockCanvas/types';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store/document.store';
import { Json } from '@/types/base/database.types';

import { Toolbar } from './FormatToolbar';

const customStyles = `
  .ProseMirror {
    background: transparent;
    outline: none !important;
    min-height: 1.5em;
  }

  .ProseMirror-focused {
    outline: none !important;
  }

  /* Custom placeholder styles */
  .empty-editor-placeholder {
    position: absolute;
    color: #9ca3af;
    pointer-events: none;
    user-select: none;
    top: 0;
    left: 0;
    padding: 0.5em 0;
    line-height: 1.5;
    display: flex;
    align-items: center;
    height: 100%;
  }

  .ProseMirror .arrow-list {
    list-style: none;
    padding-left: 1.5em;
  }

  .ProseMirror .arrow-list li {
    position: relative;
  }

  .ProseMirror .arrow-list li::before {
    content: "→";
    position: absolute;
    left: -1.5em;
    color: currentColor;
  }

  .ProseMirror h1 {
    font-size: 2em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror h2 {
    font-size: 1.5em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror h3 {
    font-size: 1.17em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror h4 {
    font-size: 1em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror h5 {
    font-size: 0.83em;
    font-weight: bold;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  .ProseMirror ul,
  .ProseMirror ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  .ProseMirror ol {
    list-style-type: decimal;
  }

  .ProseMirror ul {
    list-style-type: disc;
  }

  .ProseMirror p {
    margin: 0.5em 0;
  }

  .ProseMirror p:first-child {
    margin-top: 0;
  }

  .ProseMirror *::selection {
    background: rgba(59, 130, 246, 0.2);
    border-radius: 0;
  }

  .ProseMirror:not(.ProseMirror-focused) *::selection {
    background: rgba(59, 130, 246, 0.1);
  }
`;

export const TextBlock: React.FC<BlockProps> = ({ block, onUpdate }) => {
    const content = block.content as { text?: string; format?: string };
    const [localContent, setLocalContent] = React.useState(content?.text || '<p></p>');
    const [showToolbar, setShowToolbar] = React.useState(false);
    const [toolbarPosition, setToolbarPosition] = React.useState({
        top: 0,
        left: 0,
    });
    const editorRef = React.useRef<HTMLDivElement>(null);
    const lastSavedContent = React.useRef(content?.text || '<p></p>');

    // Use the document store for edit mode state
    const { isEditMode } = useDocumentStore();

    // Add click outside handler
    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleClickOutside = (event: MouseEvent) => {
            if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
                setShowToolbar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
        content: content?.text || '<p></p>',
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

            // Check if editor is completely empty (only has an empty paragraph)
            const isEmpty = editor.isEmpty;
            let newContent = editor.getHTML();

            // If editor is empty, set content to empty string instead of <p></p>
            if (isEmpty || newContent === '<p></p>') {
                newContent = '';
            }

            // Update local content immediately to trigger placeholder if needed
            setLocalContent(newContent);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
            },
        },
        immediatelyRender: false, // Explicitly set to avoid SSR hydration mismatch
    });

    // Update editor's editable state when isEditMode changes
    React.useEffect(() => {
        if (editor) {
            editor.setEditable(Boolean(isEditMode));

            // Focus the editor when entering edit mode
            if (isEditMode && content?.text === '<p></p>') {
                setTimeout(() => {
                    editor.commands.focus();
                }, 100);
            }
        }
    }, [isEditMode, editor, content?.text]);

    // Save content when exiting edit mode
    React.useEffect(() => {
        if (!isEditMode && localContent !== lastSavedContent.current) {
            // If content is empty or just empty paragraph tags, save as empty string
            const contentToSave =
                localContent === '' || localContent === '<p></p>' ? '' : localContent;

            lastSavedContent.current = contentToSave;
            onUpdate({
                content: {
                    text: contentToSave,
                    format: content?.format || 'default',
                } as Json,
                updated_at: new Date().toISOString(),
            });
        }
    }, [isEditMode, localContent, content?.format, onUpdate]);

    // Save content when editor loses focus
    const handleBlur = React.useCallback(() => {
        if (!editor || !isEditMode) return;

        const editorContent = editor.getHTML();
        if (editorContent !== lastSavedContent.current) {
            lastSavedContent.current = editorContent;
            onUpdate({
                content: {
                    text: editorContent,
                    format: content?.format || 'default',
                } as Json,
                updated_at: new Date().toISOString(),
            });
        }
    }, [editor, isEditMode, onUpdate, content?.format]);

    // Add blur handler to editor
    React.useEffect(() => {
        if (!editor) return;

        editor.on('blur', handleBlur);
        return () => {
            editor.off('blur', handleBlur);
        };
    }, [editor, handleBlur]);

    // Sync external content changes only when not in edit mode
    React.useEffect(() => {
        if (!editor || isEditMode) return;

        // Handle empty content case
        const textContent = content?.text || '';

        if (textContent !== lastSavedContent.current) {
            lastSavedContent.current = textContent;
            setLocalContent(textContent);

            // If content is empty, set empty paragraph that will show placeholder
            if (textContent === '') {
                editor.commands.clearContent();
            } else {
                editor.commands.setContent(textContent);
            }
        }
    }, [content?.text, editor, isEditMode]);

    return (
        <div
            ref={editorRef}
            className={cn('relative w-full cursor-text')}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditMode && editor && editor.state.selection.empty) {
                    editor.commands.focus();
                }
            }}
        >
            {isEditMode && showToolbar && (
                <div
                    className="absolute z-50 format-toolbar"
                    style={{
                        top: `${toolbarPosition.top}px`,
                        left: `${toolbarPosition.left}px`,
                        pointerEvents: 'none', // Allow clicks to pass through the container
                    }}
                >
                    <Toolbar
                        editor={editor}
                        className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 transform -translate-y-full transition-all duration-200 pointer-events-auto" // Re-enable pointer events just for the toolbar itself
                    />
                </div>
            )}
            <style>{customStyles}</style>
            <div className="relative min-h-[1.5em]">
                {/* Show placeholder for empty text blocks regardless of edit mode */}
                {(!localContent || localContent === '' || localContent === '<p></p>') && (
                    <div className="empty-editor-placeholder">Enter text here...</div>
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
    );
};
