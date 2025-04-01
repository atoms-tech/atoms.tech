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

  .ProseMirror p.is-empty::before {
    color: #9ca3af;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
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

export const TextBlock: React.FC<BlockProps> = ({
    block,
    onUpdate,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    isSelected,
    onSelect,
    isEditMode,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    onDelete,
    onDoubleClick,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    dragActivators,
}) => {
    const content = block.content as { text?: string; format?: string };
    const [localContent, setLocalContent] = React.useState(
        content?.text || '<p></p>',
    );
    const [showToolbar, setShowToolbar] = React.useState(false);
    const [toolbarPosition, setToolbarPosition] = React.useState({
        top: 0,
        left: 0,
    });
    const editorRef = React.useRef<HTMLDivElement>(null);

    // Add click outside handler
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                editorRef.current &&
                !editorRef.current.contains(event.target as Node)
            ) {
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
        immediatelyRender: false,
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
            const newContent = editor.getHTML();
            if (newContent !== localContent) {
                setLocalContent(newContent);
            }
        },
    });

    // Update editor's editable state when isEditMode changes
    React.useEffect(() => {
        if (editor) {
            editor.setEditable(Boolean(isEditMode));
        }
    }, [isEditMode, editor]);

    // Save content when exiting edit mode
    React.useEffect(() => {
        if (!isEditMode && localContent !== content?.text) {
            onUpdate({
                text: localContent,
            } as Json);
        }
    }, [isEditMode, localContent, content?.text, onUpdate]);

    // Sync external content changes
    React.useEffect(() => {
        if (!editor || !content?.text) return;
        if (!isEditMode && content.text !== localContent) {
            setLocalContent(content.text);
            editor.commands.setContent(content.text);
        }
    }, [content?.text, editor, isEditMode, localContent]);

    return (
        <div
            ref={editorRef}
            className={cn(
                'relative w-full',
                isEditMode && 'ring-1 ring-purple-300/50 ring-offset-0',
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelect?.(block.id);
                if (isEditMode && editor && editor.state.selection.empty) {
                    editor.commands.focus();
                }
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                onDoubleClick?.();
            }}
        >
            {isEditMode && showToolbar && (
                <div
                    className="absolute z-50 format-toolbar"
                    style={{
                        top: `${toolbarPosition.top}px`,
                        left: `${toolbarPosition.left}px`,
                    }}
                    onMouseDown={(e) => {
                        // Prevent toolbar interactions from stealing focus
                        e.preventDefault();
                    }}
                >
                    <Toolbar
                        editor={editor}
                        className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 transform -translate-y-full transition-all duration-200"
                    />
                </div>
            )}
            <style>{customStyles}</style>
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
    );
};
