'use client';

import { motion } from 'framer-motion';
import { FileText, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { WidgetProps } from '@/types/dashboard.types';

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
}

export function NotesWidget({ instance, onConfigChange }: WidgetProps) {
    const { maxNotes = 5, showSearch = true, allowEdit = true } = instance.config || {};
    
    const [notes, setNotes] = useState<Note[]>([
        {
            id: '1',
            title: 'Meeting Notes',
            content: 'Discussed project timeline and deliverables. Next steps: finalize requirements and start development.',
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(Date.now() - 86400000),
            tags: ['work', 'meeting']
        },
        {
            id: '2',
            title: 'Ideas',
            content: 'New feature ideas for the dashboard: drag and drop, better analytics, mobile support.',
            createdAt: new Date(Date.now() - 172800000),
            updatedAt: new Date(Date.now() - 172800000),
            tags: ['ideas', 'features']
        },
        {
            id: '3',
            title: 'Quick Reminder',
            content: 'Remember to update the documentation before the release.',
            createdAt: new Date(Date.now() - 259200000),
            updatedAt: new Date(Date.now() - 259200000),
            tags: ['reminder']
        }
    ]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    const filteredNotes = notes
        .filter(note => 
            searchQuery === '' || 
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, maxNotes);

    const createNote = () => {
        if (newNote.title.trim() || newNote.content.trim()) {
            const note: Note = {
                id: Date.now().toString(),
                title: newNote.title.trim() || 'Untitled',
                content: newNote.content.trim(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            setNotes(prev => [note, ...prev]);
            setNewNote({ title: '', content: '' });
            setIsCreating(false);
        }
    };

    const updateNote = (id: string, updates: Partial<Note>) => {
        setNotes(prev => prev.map(note => 
            note.id === id 
                ? { ...note, ...updates, updatedAt: new Date() }
                : note
        ));
        setEditingId(null);
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(note => note.id !== id));
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 48) return 'Yesterday';
        return date.toLocaleDateString();
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        Notes
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreating(true)}
                        className="h-8 w-8 p-0"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                
                {showSearch && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                )}
            </CardHeader>
            
            <CardContent className="space-y-3">
                {/* Create New Note */}
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/20"
                    >
                        <Input
                            placeholder="Note title..."
                            value={newNote.title}
                            onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                            className="border-0 bg-transparent p-0 text-sm font-medium placeholder:text-gray-400"
                        />
                        <Textarea
                            placeholder="Write your note..."
                            value={newNote.content}
                            onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                            className="border-0 bg-transparent p-0 text-sm resize-none min-h-[60px] placeholder:text-gray-400"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewNote({ title: '', content: '' });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button size="sm" onClick={createNote}>
                                Save
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Notes List */}
                <div className="space-y-2">
                    {filteredNotes.map((note, index) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow group"
                        >
                            {editingId === note.id ? (
                                <div className="space-y-2">
                                    <Input
                                        defaultValue={note.title}
                                        onBlur={(e) => updateNote(note.id, { title: e.target.value })}
                                        className="border-0 bg-transparent p-0 text-sm font-medium"
                                    />
                                    <Textarea
                                        defaultValue={note.content}
                                        onBlur={(e) => updateNote(note.id, { content: e.target.value })}
                                        className="border-0 bg-transparent p-0 text-sm resize-none min-h-[60px]"
                                    />
                                </div>
                            ) : (
                                <div
                                    onClick={() => allowEdit && setEditingId(note.id)}
                                    className={allowEdit ? 'cursor-pointer' : ''}
                                >
                                    <div className="flex items-start justify-between">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                            {note.title}
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNote(note.id);
                                            }}
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {note.content}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex gap-1">
                                            {note.tags?.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(note.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                    
                    {filteredNotes.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No notes found</p>
                            <p className="text-sm">
                                {searchQuery ? 'Try a different search term' : 'Create your first note'}
                            </p>
                        </div>
                    )}
                </div>
                
                {notes.length > maxNotes && (
                    <div className="text-center">
                        <Button variant="ghost" size="sm" className="text-xs">
                            View {notes.length - maxNotes} more notes
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
