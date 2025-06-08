import {
    Bold,
    Calendar,
    Clock,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Image,
    Italic,
    Link,
    List,
    ListOrdered,
    Minus,
    Quote,
    Table,
    Trash2,
    Underline,
} from 'lucide-react';

import { SlashCommand } from '@/components/ui/slash-commands/types';

// Type for TipTap editor with common methods - extends the basic EditorLike interface
interface TipTapEditor {
    chain(): {
        focus(): {
            toggleHeading(options: { level: number }): { run(): void };
            toggleBold(): { run(): void };
            toggleItalic(): { run(): void };
            toggleUnderline(): { run(): void };
            toggleCode(): { run(): void };
            toggleBulletList(): { run(): void };
            toggleOrderedList(): { run(): void };
            toggleBlockquote(): { run(): void };
            setHorizontalRule(): { run(): void };
            setLink(options: { href: string }): { insertContent(text: string): { run(): void } };
            setImage(options: { src: string; alt: string }): { run(): void };
            insertTable(options: { rows: number; cols: number; withHeaderRow: boolean }): { run(): void };
            selectLine(): { deleteSelection(): { run(): void } };
            insertContent(content: string): { run(): void };
            deleteRange(range: { from: number; to: number }): { insertContent(content: string): { run(): void } };
        };
    };
}

/**
 * Default text formatting commands
 */
export const textFormattingCommands: SlashCommand[] = [
    {
        id: 'heading1',
        name: 'Heading 1',
        description: 'Large section heading',
        icon: Heading1,
        category: 'formatting',
        keywords: ['h1', 'title', 'header'],
        execute: ({ insertText, editor }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleHeading({ level: 1 }).run();
            } else {
                insertText('# ');
            }
        },
    },
    {
        id: 'heading2',
        name: 'Heading 2',
        description: 'Medium section heading',
        icon: Heading2,
        category: 'formatting',
        keywords: ['h2', 'subtitle', 'header'],
        execute: ({ insertText, editor }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleHeading({ level: 2 }).run();
            } else {
                insertText('## ');
            }
        },
    },
    {
        id: 'heading3',
        name: 'Heading 3',
        description: 'Small section heading',
        icon: Heading3,
        category: 'formatting',
        keywords: ['h3', 'subheading', 'header'],
        execute: ({ insertText, editor }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleHeading({ level: 3 }).run();
            } else {
                insertText('### ');
            }
        },
    },
    {
        id: 'bold',
        name: 'Bold',
        description: 'Make text bold',
        icon: Bold,
        category: 'formatting',
        keywords: ['strong', 'emphasis'],
        execute: ({ insertText, editor, selectedText }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleBold().run();
            } else {
                const text = selectedText || 'bold text';
                insertText(`**${text}**`);
            }
        },
    },
    {
        id: 'italic',
        name: 'Italic',
        description: 'Make text italic',
        icon: Italic,
        category: 'formatting',
        keywords: ['emphasis', 'em'],
        execute: ({ insertText, editor, selectedText }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleItalic().run();
            } else {
                const text = selectedText || 'italic text';
                insertText(`*${text}*`);
            }
        },
    },
    {
        id: 'underline',
        name: 'Underline',
        description: 'Underline text',
        icon: Underline,
        category: 'formatting',
        keywords: ['u'],
        execute: ({ insertText, editor, selectedText }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleUnderline().run();
            } else {
                const text = selectedText || 'underlined text';
                insertText(`<u>${text}</u>`);
            }
        },
    },
    {
        id: 'code',
        name: 'Inline Code',
        description: 'Format text as code',
        icon: Code,
        category: 'formatting',
        keywords: ['monospace', 'code'],
        execute: ({ insertText, editor, selectedText }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleCode().run();
            } else {
                const text = selectedText || 'code';
                insertText(`\`${text}\``);
            }
        },
    },
];

/**
 * List and structure commands
 */
export const structureCommands: SlashCommand[] = [
    {
        id: 'bullet-list',
        name: 'Bullet List',
        description: 'Create a bulleted list',
        icon: List,
        category: 'structure',
        keywords: ['ul', 'unordered', 'bullets'],
        execute: ({ insertText, editor }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleBulletList().run();
            } else {
                insertText('• ');
            }
        },
    },
    {
        id: 'numbered-list',
        name: 'Numbered List',
        description: 'Create a numbered list',
        icon: ListOrdered,
        category: 'structure',
        keywords: ['ol', 'ordered', 'numbers'],
        execute: ({ insertText, editor }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleOrderedList().run();
            } else {
                insertText('1. ');
            }
        },
    },
    {
        id: 'quote',
        name: 'Quote',
        description: 'Create a blockquote',
        icon: Quote,
        category: 'structure',
        keywords: ['blockquote', 'citation'],
        execute: ({ insertText, editor }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().toggleBlockquote().run();
            } else {
                insertText('> ');
            }
        },
    },
    {
        id: 'divider',
        name: 'Divider',
        description: 'Insert a horizontal rule',
        icon: Minus,
        category: 'structure',
        keywords: ['hr', 'separator', 'line'],
        execute: ({ insertText, editor }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().setHorizontalRule().run();
            } else {
                insertText('\n---\n');
            }
        },
    },
];

/**
 * Content insertion commands
 */
export const contentCommands: SlashCommand[] = [
    {
        id: 'link',
        name: 'Link',
        description: 'Insert a link',
        icon: Link,
        category: 'content',
        keywords: ['url', 'href'],
        execute: ({ insertText, editor }) => {
            const url = prompt('Enter URL:');
            if (!url) return;
            
            const text = prompt('Enter link text:') || url;
            
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().setLink({ href: url }).insertContent(text).run();
            } else {
                insertText(`[${text}](${url})`);
            }
        },
    },
    {
        id: 'image',
        name: 'Image',
        description: 'Insert an image',
        icon: Image,
        category: 'content',
        keywords: ['img', 'picture', 'photo'],
        execute: ({ insertText, editor }) => {
            const url = prompt('Enter image URL:');
            if (!url) return;
            
            const alt = prompt('Enter alt text:') || 'Image';
            
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().setImage({ src: url, alt }).run();
            } else {
                insertText(`![${alt}](${url})`);
            }
        },
    },
    {
        id: 'table',
        name: 'Table',
        description: 'Insert a table',
        icon: Table,
        category: 'content',
        keywords: ['grid', 'rows', 'columns'],
        execute: ({ insertText, editor }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            } else {
                const table = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;
                insertText(table);
            }
        },
    },
];

/**
 * Utility commands
 */
export const utilityCommands: SlashCommand[] = [
    {
        id: 'date',
        name: 'Current Date',
        description: 'Insert today\'s date',
        icon: Calendar,
        category: 'utility',
        keywords: ['today', 'now'],
        execute: ({ insertText }) => {
            const date = new Date().toLocaleDateString();
            insertText(date);
        },
    },
    {
        id: 'time',
        name: 'Current Time',
        description: 'Insert current time',
        icon: Clock,
        category: 'utility',
        keywords: ['now', 'clock'],
        execute: ({ insertText }) => {
            const time = new Date().toLocaleTimeString();
            insertText(time);
        },
    },
    {
        id: 'clear',
        name: 'Clear',
        description: 'Clear current line',
        icon: Trash2,
        category: 'utility',
        keywords: ['delete', 'remove', 'empty'],
        execute: ({ replaceText, cursorPosition, input, editor }) => {
            if (editor) {
                (editor as unknown as TipTapEditor).chain().focus().selectLine().deleteSelection().run();
            } else if (input) {
                const value = input.value;
                const lines = value.split('\n');
                let currentLine = 0;
                let charCount = 0;
                
                for (let i = 0; i < lines.length; i++) {
                    if (charCount + lines[i].length >= cursorPosition) {
                        currentLine = i;
                        break;
                    }
                    charCount += lines[i].length + 1; // +1 for newline
                }
                
                const lineStart = charCount;
                const lineEnd = charCount + lines[currentLine].length;
                replaceText(lineStart, lineEnd, '');
            }
        },
    },
];

/**
 * All default commands combined
 */
export const defaultSlashCommands: SlashCommand[] = [
    ...textFormattingCommands,
    ...structureCommands,
    ...contentCommands,
    ...utilityCommands,
];
