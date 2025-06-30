'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
    useKeyboardShortcuts, 
    createShortcut, 
    SHORTCUT_CATEGORIES,
    type KeyboardShortcut 
} from '@/hooks/useKeyboardShortcuts';
import { useClipboard } from '@/hooks/useClipboard';
import { useLiveRegionContext } from '@/components/ui/live-region';

interface KeyboardShortcutContextType {
    shortcuts: KeyboardShortcut[];
    registerShortcut: (shortcut: KeyboardShortcut) => void;
    unregisterShortcut: (key: string) => void;
    showHelp: () => void;
}

const KeyboardShortcutContext = React.createContext<KeyboardShortcutContextType | null>(null);

interface KeyboardShortcutProviderProps {
    children: React.ReactNode;
}

export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
    const router = useRouter();
    const { copyText, pasteFromClipboard } = useClipboard({
        onCopy: () => console.log('Copied to clipboard'),
        onPaste: () => console.log('Pasted from clipboard'),
        onError: (error) => console.error(`Clipboard error: ${error.message}`),
    });

    const [customShortcuts, setCustomShortcuts] = React.useState<KeyboardShortcut[]>([]);
    const [showHelpDialog, setShowHelpDialog] = React.useState(false);

    // Global shortcuts
    const globalShortcuts: KeyboardShortcut[] = React.useMemo(() => [
        // Navigation shortcuts
        createShortcut('/', () => {
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }, 'Focus search', { category: SHORTCUT_CATEGORIES.NAVIGATION }),

        createShortcut('h', () => {
            router.push('/home');
        }, 'Go to home', { category: SHORTCUT_CATEGORIES.NAVIGATION }),

        createShortcut('g', () => {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.focus();
                mainContent.scrollIntoView({ behavior: 'smooth' });
            }
        }, 'Go to main content', { category: SHORTCUT_CATEGORIES.NAVIGATION }),

        // Clipboard shortcuts - Copy (Cmd/Ctrl+C)
        {
            key: 'c',
            metaKey: typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0,
            ctrlKey: typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') < 0,
            action: async () => {
                console.log('Copy shortcut triggered');
                const selection = window.getSelection();
                if (selection && selection.toString()) {
                    await copyText(selection.toString());
                } else {
                    // Try to copy focused element content
                    const activeElement = document.activeElement;
                    if (activeElement && 'value' in activeElement) {
                        await copyText((activeElement as HTMLInputElement).value);
                    } else if (activeElement && 'textContent' in activeElement) {
                        await copyText(activeElement.textContent || '');
                    }
                }
            },
            description: 'Copy selected text',
            category: SHORTCUT_CATEGORIES.CLIPBOARD,
            preventDefault: true
        },

        // Paste (Cmd/Ctrl+V)
        {
            key: 'v',
            metaKey: typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0,
            ctrlKey: typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') < 0,
            action: async () => {
                console.log('Paste shortcut triggered');
                const activeElement = document.activeElement;
                if (activeElement && ('value' in activeElement || activeElement.getAttribute('contenteditable'))) {
                    const data = await pasteFromClipboard();
                    if (data?.text) {
                        if ('value' in activeElement) {
                            const input = activeElement as HTMLInputElement;
                            const start = input.selectionStart || 0;
                            const end = input.selectionEnd || 0;
                            const currentValue = input.value;
                            input.value = currentValue.slice(0, start) + data.text + currentValue.slice(end);
                            input.setSelectionRange(start + data.text.length, start + data.text.length);
                        } else if (activeElement.getAttribute('contenteditable')) {
                            document.execCommand('insertText', false, data.text);
                        }
                    }
                }
            },
            description: 'Paste text',
            category: SHORTCUT_CATEGORIES.CLIPBOARD,
            preventDefault: true
        },

        // General shortcuts - Help dialog (Shift+?)
        {
            key: '?',
            shiftKey: true,
            metaKey: false,
            ctrlKey: false,
            action: () => {
                console.log('Help dialog triggered');
                setShowHelpDialog(true);
            },
            description: 'Show keyboard shortcuts',
            category: SHORTCUT_CATEGORIES.HELP,
            preventDefault: true
        },

        createShortcut('Escape', () => {
            // Close any open modals, dropdowns, or dialogs
            const closeButtons = document.querySelectorAll('[data-close], [aria-label*="close" i], .modal [role="button"]');
            const lastCloseButton = closeButtons[closeButtons.length - 1] as HTMLElement;
            if (lastCloseButton) {
                lastCloseButton.click();
            }
            
            // Clear any selections
            window.getSelection()?.removeAllRanges();
            
            // Close help dialog
            setShowHelpDialog(false);
        }, 'Close modal/dialog', { 
            category: SHORTCUT_CATEGORIES.GENERAL,
            preventDefault: false 
        }),

        // Editing shortcuts
        createShortcut('z', () => {
            document.execCommand('undo');
        }, 'Undo', { category: SHORTCUT_CATEGORIES.EDITING }),

        createShortcut('y', () => {
            document.execCommand('redo');
        }, 'Redo', { category: SHORTCUT_CATEGORIES.EDITING }),

        createShortcut('a', () => {
            document.execCommand('selectAll');
        }, 'Select all', { category: SHORTCUT_CATEGORIES.EDITING }),

    ], [router, copyText, pasteFromClipboard]);

    const allShortcuts = React.useMemo(() => [
        ...globalShortcuts,
        ...customShortcuts,
    ], [globalShortcuts, customShortcuts]);

    useKeyboardShortcuts({ shortcuts: allShortcuts });

    const registerShortcut = React.useCallback((shortcut: KeyboardShortcut) => {
        setCustomShortcuts(prev => {
            // Remove existing shortcut with same key combination
            const filtered = prev.filter(s => 
                !(s.key === shortcut.key && 
                  s.metaKey === shortcut.metaKey && 
                  s.ctrlKey === shortcut.ctrlKey && 
                  s.shiftKey === shortcut.shiftKey && 
                  s.altKey === shortcut.altKey)
            );
            return [...filtered, shortcut];
        });
    }, []);

    const unregisterShortcut = React.useCallback((key: string) => {
        setCustomShortcuts(prev => prev.filter(s => s.key !== key));
    }, []);

    const showHelp = React.useCallback(() => {
        setShowHelpDialog(true);
    }, []);

    const contextValue = React.useMemo(() => ({
        shortcuts: allShortcuts,
        registerShortcut,
        unregisterShortcut,
        showHelp,
    }), [allShortcuts, registerShortcut, unregisterShortcut, showHelp]);

    return (
        <KeyboardShortcutContext.Provider value={contextValue}>
            {children}
            {showHelpDialog && (
                <KeyboardShortcutHelp 
                    shortcuts={allShortcuts}
                    onClose={() => setShowHelpDialog(false)}
                />
            )}
        </KeyboardShortcutContext.Provider>
    );
}

export function useKeyboardShortcutContext() {
    const context = React.useContext(KeyboardShortcutContext);
    if (!context) {
        throw new Error('useKeyboardShortcutContext must be used within a KeyboardShortcutProvider');
    }
    return context;
}

// Help dialog component
interface KeyboardShortcutHelpProps {
    shortcuts: KeyboardShortcut[];
    onClose: () => void;
}

function KeyboardShortcutHelp({ shortcuts, onClose }: KeyboardShortcutHelpProps) {
    const dialogRef = React.useRef<HTMLDivElement>(null);

    // Group shortcuts by category
    const groupedShortcuts = React.useMemo(() => {
        const groups: Record<string, KeyboardShortcut[]> = {};
        shortcuts.forEach(shortcut => {
            const category = shortcut.category || 'Other';
            if (!groups[category]) groups[category] = [];
            groups[category].push(shortcut);
        });
        return groups;
    }, [shortcuts]);

    // Focus management
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                ref={dialogRef}
                className="bg-background border rounded-lg shadow-lg max-w-2xl max-h-[80vh] overflow-auto p-6"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-labelledby="shortcut-help-title"
                aria-modal="true"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="shortcut-help-title" className="text-xl font-semibold">
                        Keyboard Shortcuts
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Close help dialog"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="space-y-6">
                    {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                        <div key={category}>
                            <h3 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                                {category}
                            </h3>
                            <div className="space-y-2">
                                {categoryShortcuts.map((shortcut, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm">{shortcut.description}</span>
                                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                            {formatShortcutDisplay(shortcut)}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function formatShortcutDisplay(shortcut: KeyboardShortcut): string {
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    const parts: string[] = [];
    
    if (shortcut.metaKey) parts.push(isMac ? '⌘' : 'Ctrl');
    if (shortcut.ctrlKey && !shortcut.metaKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt');
    if (shortcut.shiftKey) parts.push('⇧');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(isMac ? '' : '+');
}
