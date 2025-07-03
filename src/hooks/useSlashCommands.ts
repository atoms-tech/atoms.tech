import { useCallback, useEffect, useRef, useState } from 'react';

import {
    SlashCommandAutocompleteState,
    SlashCommandContext,
    UseSlashCommandsReturn,
} from '@/components/ui/slash-commands/types';
import { useSlashCommandContext } from '@/components/ui/slash-commands/SlashCommandProvider';

interface UseSlashCommandsOptions {
    /** Input element reference */
    inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
    /** TipTap editor instance */
    editor?: import('@/components/ui/slash-commands/types').EditorLike;
    /** Callback when command is executed */
    onCommandExecuted?: (commandId: string) => void;
    /** Custom text insertion function */
    onInsertText?: (text: string) => void;
    /** Custom text replacement function */
    onReplaceText?: (start: number, end: number, text: string) => void;
}

export function useSlashCommands(options: UseSlashCommandsOptions = {}): UseSlashCommandsReturn {
    const { inputRef, editor, onCommandExecuted, onInsertText, onReplaceText } = options;
    const { searchCommands } = useSlashCommandContext();
    
    const [state, setState] = useState<SlashCommandAutocompleteState>({
        isOpen: false,
        query: '',
        commands: [],
        selectedIndex: 0,
        position: null,
    });

    const slashPositionRef = useRef<number>(-1);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    /**
     * Get current cursor position
     */
    const getCursorPosition = useCallback((): number => {
        if (editor) {
            return editor.state.selection.from;
        }
        
        if (inputRef?.current) {
            return inputRef.current.selectionStart || 0;
        }
        
        return 0;
    }, [editor, inputRef]);

    /**
     * Get selected text
     */
    const getSelectedText = useCallback((): string => {
        if (editor) {
            const { from, to } = editor.state.selection;
            return editor.state.doc.textBetween(from, to);
        }
        
        if (inputRef?.current) {
            const { selectionStart, selectionEnd, value } = inputRef.current;
            if (selectionStart !== null && selectionEnd !== null) {
                return value.substring(selectionStart, selectionEnd);
            }
        }
        
        return '';
    }, [editor, inputRef]);

    /**
     * Insert text at cursor position
     */
    const insertText = useCallback((text: string) => {
        if (onInsertText) {
            onInsertText(text);
            return;
        }

        if (editor) {
            editor.chain().focus().insertContent(text).run();
            return;
        }

        if (inputRef?.current) {
            const input = inputRef.current;
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const value = input.value;
            
            const newValue = value.substring(0, start) + text + value.substring(end);
            input.value = newValue;
            input.setSelectionRange(start + text.length, start + text.length);
            
            // Trigger input event for controlled components
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        }
    }, [editor, inputRef, onInsertText]);

    /**
     * Replace text in a range
     */
    const replaceText = useCallback((start: number, end: number, text: string) => {
        if (onReplaceText) {
            onReplaceText(start, end, text);
            return;
        }

        if (editor) {
            editor.chain().focus().deleteRange({ from: start, to: end }).insertContent(text).run();
            return;
        }

        if (inputRef?.current) {
            const input = inputRef.current;
            const value = input.value;
            
            const newValue = value.substring(0, start) + text + value.substring(end);
            input.value = newValue;
            input.setSelectionRange(start + text.length, start + text.length);
            
            // Trigger input event for controlled components
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        }
    }, [editor, inputRef, onReplaceText]);



    /**
     * Detect slash command in text
     */
    const detectSlashCommand = useCallback((text: string, cursorPosition: number) => {
        // Find the last slash before cursor position
        let slashIndex = -1;
        for (let i = cursorPosition - 1; i >= 0; i--) {
            if (text[i] === '/') {
                // Check if it's at the start or preceded by whitespace
                if (i === 0 || /\s/.test(text[i - 1])) {
                    slashIndex = i;
                    break;
                }
            } else if (!/\w/.test(text[i])) {
                // Stop if we hit non-word character that's not slash
                break;
            }
        }

        if (slashIndex === -1) {
            return null;
        }

        // Extract query after the slash
        const query = text.substring(slashIndex + 1, cursorPosition);
        
        // Don't show autocomplete if there's whitespace in the query
        if (/\s/.test(query)) {
            return null;
        }

        return {
            slashPosition: slashIndex,
            query,
        };
    }, []);

    /**
     * Handle input change
     */
    const handleInputChange = useCallback((value: string, cursorPosition: number) => {
        const detection = detectSlashCommand(value, cursorPosition);

        if (!detection) {
            setState(prev => ({ ...prev, isOpen: false, query: '', commands: [] }));
            slashPositionRef.current = -1;
            return;
        }

        slashPositionRef.current = detection.slashPosition;
        
        // Debounce search
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            const commands = searchCommands(detection.query, { editor, input: inputRef?.current });

            setState(prev => ({
                ...prev,
                isOpen: commands.length > 0,
                query: detection.query,
                commands,
                selectedIndex: 0,
                position: null, // Using relative positioning now
            }));
        }, 100); // Reduced debounce for better responsiveness
    }, [detectSlashCommand, searchCommands, editor, inputRef]);

    /**
     * Close autocomplete
     */
    const closeAutocomplete = useCallback(() => {
        setState(prev => ({
            ...prev,
            isOpen: false,
            query: '',
            commands: [],
            selectedIndex: 0,
            position: null,
        }));
        slashPositionRef.current = -1;
    }, []);

    /**
     * Execute the currently selected command
     */
    const executeSelectedCommand = useCallback(() => {
        if (!state.isOpen || state.commands.length === 0 || slashPositionRef.current === -1) {
            return;
        }

        const selectedCommand = state.commands[state.selectedIndex]?.command;
        if (!selectedCommand) {
            return;
        }

        const cursorPosition = getCursorPosition();
        const context: SlashCommandContext = {
            editor,
            input: inputRef?.current || undefined,
            cursorPosition,
            selectedText: getSelectedText(),
            insertText,
            replaceText,
            query: state.query,
        };

        try {
            // Replace the slash command text with empty string first
            const slashEnd = slashPositionRef.current + state.query.length + 1;
            replaceText(slashPositionRef.current, slashEnd, '');

            // Execute the command
            selectedCommand.execute(context);
            
            onCommandExecuted?.(selectedCommand.id);
        } catch (error) {
            console.error('Error executing slash command:', error);
        }

        closeAutocomplete();
    }, [
        state.isOpen,
        state.commands,
        state.selectedIndex,
        state.query,
        getCursorPosition,
        getSelectedText,
        insertText,
        replaceText,
        editor,
        inputRef,
        onCommandExecuted,
        closeAutocomplete,
    ]);

    /**
     * Handle keyboard events
     */
    const handleKeyDown = useCallback((event: React.KeyboardEvent): boolean => {
        if (!state.isOpen || state.commands.length === 0) {
            return false;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setState(prev => ({
                    ...prev,
                    selectedIndex: Math.min(prev.selectedIndex + 1, prev.commands.length - 1),
                }));
                return true;

            case 'ArrowUp':
                event.preventDefault();
                setState(prev => ({
                    ...prev,
                    selectedIndex: Math.max(prev.selectedIndex - 1, 0),
                }));
                return true;

            case 'Enter':
            case 'Tab':
                event.preventDefault();
                executeSelectedCommand();
                return true;

            case 'Escape':
                event.preventDefault();
                closeAutocomplete();
                return true;

            default:
                return false;
        }
    }, [state.isOpen, state.commands.length, closeAutocomplete, executeSelectedCommand]);

    /**
     * Set selected index
     */
    const setSelectedIndex = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            selectedIndex: Math.max(0, Math.min(index, prev.commands.length - 1)),
        }));
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    return {
        state,
        handleInputChange,
        handleKeyDown,
        executeSelectedCommand,
        closeAutocomplete,
        setSelectedIndex,
    };
}
