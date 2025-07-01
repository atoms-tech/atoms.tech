'use client';

import { useCallback, useState } from 'react';

export interface ClipboardData {
    text?: string;
    html?: string;
    json?: unknown;
    custom?: Record<string, unknown>;
}

export interface UseClipboardOptions {
    onCopy?: (data: ClipboardData) => void;
    onPaste?: (data: ClipboardData) => void;
    onError?: (error: Error) => void;
    timeout?: number; // Feedback timeout in ms
}

export function useClipboard(options: UseClipboardOptions = {}) {
    const [isCopied, setIsCopied] = useState(false);
    const [isPasted, setIsPasted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { onCopy, onPaste, onError, timeout = 2000 } = options;

    const copyToClipboard = useCallback(
        async (data: ClipboardData) => {
            try {
                setError(null);

                // Always try the simple text approach first for better compatibility
                if (
                    data.text &&
                    navigator.clipboard &&
                    navigator.clipboard.writeText
                ) {
                    await navigator.clipboard.writeText(data.text);
                } else if (data.text) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = data.text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();

                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);

                    if (!successful) {
                        throw new Error('Copy command failed');
                    }
                } else {
                    throw new Error('No text content to copy');
                }

                setIsCopied(true);
                setTimeout(() => setIsCopied(false), timeout);

                onCopy?.(data);
            } catch (err) {
                const error =
                    err instanceof Error ? err : new Error('Copy failed');
                setError(error.message);
                onError?.(error);
                console.error('Copy failed:', error);
            }
        },
        [onCopy, onError, timeout],
    );

    const pasteFromClipboard =
        useCallback(async (): Promise<ClipboardData | null> => {
            try {
                setError(null);

                // Try the simple text approach first
                if (navigator.clipboard && navigator.clipboard.readText) {
                    const text = await navigator.clipboard.readText();
                    const data: ClipboardData = { text };

                    setIsPasted(true);
                    setTimeout(() => setIsPasted(false), timeout);

                    onPaste?.(data);
                    return data;
                } else {
                    throw new Error('Clipboard API not available');
                }
            } catch (err) {
                const error =
                    err instanceof Error ? err : new Error('Paste failed');
                setError(error.message);
                onError?.(error);
                console.error('Paste failed:', error);
                return null;
            }
        }, [onPaste, onError, timeout]);

    const copyText = useCallback(
        (text: string) => {
            return copyToClipboard({ text });
        },
        [copyToClipboard],
    );

    const copyHTML = useCallback(
        (html: string, fallbackText?: string) => {
            return copyToClipboard({ html, text: fallbackText || html });
        },
        [copyToClipboard],
    );

    const copyJSON = useCallback(
        (json: unknown, fallbackText?: string) => {
            return copyToClipboard({
                json,
                text: fallbackText || JSON.stringify(json, null, 2),
            });
        },
        [copyToClipboard],
    );

    const copyTableData = useCallback(
        (data: unknown[][], headers?: string[]) => {
            const text = [
                headers ? headers.join('\t') : '',
                ...data.map((row) => row.join('\t')),
            ]
                .filter(Boolean)
                .join('\n');

            const html = `
            <table>
                ${headers ? `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>` : ''}
                <tbody>
                    ${data.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        `;

            return copyToClipboard({ text, html, json: { headers, data } });
        },
        [copyToClipboard],
    );

    return {
        copyToClipboard,
        pasteFromClipboard,
        copyText,
        copyHTML,
        copyJSON,
        copyTableData,
        isCopied,
        isPasted,
        error,
        isSupported: !!navigator.clipboard,
    };
}
