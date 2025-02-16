'use client';

import React from 'react';
import { BlockProps } from '../types';
import { Json } from '@/types/base/database.types';
import { cn } from '@/lib/utils';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Toolbar } from './FormatToolbar';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';

const customStyles = `
  .ProseMirror {
    background: transparent;
    outline: none !important;
  }

  .ProseMirror-focused {
    outline: none !important;
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
    background: rgba(255, 0, 0, 0.1);
    border-radius: 0;
  }

  .ProseMirror:not(.ProseMirror-focused) *::selection {
    background: transparent;
  }
`;

export const TextBlock: React.FC<BlockProps> = ({
    block,
    onUpdate,
    isSelected,
    onSelect,
    isEditMode,
}) => {
    const content = block.content as { text?: string; format?: string };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
            }),
            Heading.configure({
                levels: [1, 2, 3, 4, 5],
            }),
            BulletList.configure({
                HTMLAttributes: {
                    class: 'bullet-list',
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
        content: content?.text || '',
        editable: isEditMode,
        immediatelyRender: false,
        onBlur: ({ editor }) => {
            const html = editor.getHTML();
            if (html !== content?.text) {
                onUpdate({ text: html, format: 'html' } as Json);
            }
        },
        onFocus: onSelect,
    });

    // Update editor content when block content changes externally
    React.useEffect(() => {
        if (editor && content?.text && editor.getHTML() !== content.text) {
            editor.commands.setContent(content.text);
        }
    }, [content?.text, editor]);

    // Update editor's editable state when isEditMode changes
    React.useEffect(() => {
        if (editor) {
            editor.setEditable(isEditMode || false);
            if (!isEditMode) {
                // Clear any text selection when exiting edit mode
                window.getSelection()?.removeAllRanges();
            }
        }
    }, [isEditMode, editor]);

    return (
        <div className="relative">
            <style>{customStyles}</style>
            {isSelected && isEditMode && (
                <Toolbar editor={editor} className="sticky top-0 z-10" />
            )}
            <EditorContent
                editor={editor}
                className={cn(
                    'min-h-[2em]',
                    'prose prose-sm max-w-none',
                    'focus:outline-none',
                    'bg-transparent',
                    !editor?.getText() &&
                        'before:text-gray-400 before:content-[attr(data-placeholder)]',
                    !isEditMode && 'pointer-events-none',
                )}
                data-placeholder="Enter Text"
            />
        </div>
    );
};
