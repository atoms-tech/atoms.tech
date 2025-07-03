'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Command, Keyboard, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KeyboardShortcut {
    key: string;
    description: string;
    category: string;
}

const shortcuts: KeyboardShortcut[] = [
    { key: 'Ctrl+N', description: 'Create new project', category: 'Actions' },
    {
        key: 'Ctrl+O',
        description: 'Create new organization',
        category: 'Actions',
    },
    { key: 'Ctrl+A', description: 'Open AI analysis', category: 'Actions' },
    { key: 'Ctrl+I', description: 'Invite team members', category: 'Actions' },
    { key: '?', description: 'Show keyboard shortcuts', category: 'Help' },
    { key: 'Esc', description: 'Close dialogs/modals', category: 'Navigation' },
];

export function KeyboardShortcutsHelp() {
    const [isOpen, setIsOpen] = useState(false);

    const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

    return (
        <>
            {/* Trigger Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-40 bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-600"
                title="Keyboard shortcuts (Press ? to open)"
            >
                <Keyboard className="h-4 w-4" />
            </Button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md"
                        >
                            <Card className="bg-gray-900 border-gray-700">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Command className="h-5 w-5" />
                                        Keyboard Shortcuts
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsOpen(false)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {categories.map((category) => (
                                        <div key={category}>
                                            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                                                {category}
                                            </h3>
                                            <div className="space-y-2">
                                                {shortcuts
                                                    .filter(
                                                        (shortcut) =>
                                                            shortcut.category ===
                                                            category,
                                                    )
                                                    .map((shortcut, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50"
                                                        >
                                                            <span className="text-sm text-gray-300">
                                                                {
                                                                    shortcut.description
                                                                }
                                                            </span>
                                                            <kbd className="px-2 py-1 text-xs font-mono bg-gray-700 text-gray-200 rounded border border-gray-600">
                                                                {shortcut.key}
                                                            </kbd>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-4 border-t border-gray-700">
                                        <p className="text-xs text-gray-400 text-center">
                                            Press{' '}
                                            <kbd className="px-1 py-0.5 text-xs bg-gray-700 rounded">
                                                ?
                                            </kbd>{' '}
                                            anytime to open this help
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
