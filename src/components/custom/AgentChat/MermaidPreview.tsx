'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface MermaidPreviewProps {
    content: string;
    className?: string;
}

export const MermaidPreview: React.FC<MermaidPreviewProps> = ({ content, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [mermaidLoaded, setMermaidLoaded] = useState(false);

    useEffect(() => {
        // Dynamically import mermaid
        const loadMermaid = async () => {
            try {
                const mermaid = (await import('mermaid')).default;
                
                // Initialize mermaid
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose',
                    fontFamily: 'inherit',
                });
                
                setMermaidLoaded(true);
            } catch (err) {
                console.error('Failed to load mermaid:', err);
                setError('Failed to load diagram library');
                setLoading(false);
            }
        };

        loadMermaid();
    }, []);

    useEffect(() => {
        if (!mermaidLoaded || !containerRef.current) return;

        const renderDiagram = async () => {
            setLoading(true);
            setError(null);

            try {
                const mermaid = (await import('mermaid')).default;
                
                // Clear previous content
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                }

                // Generate unique ID for this diagram
                const id = `mermaid-${Math.random().toString(36).substring(7)}`;

                // Render the diagram
                const { svg } = await mermaid.render(id, content);

                // Insert the SVG
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }

                setLoading(false);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError(err instanceof Error ? err.message : 'Failed to render diagram');
                setLoading(false);
            }
        };

        renderDiagram();
    }, [content, mermaidLoaded]);

    if (loading) {
        return (
            <div className="flex items-center justify-center rounded border bg-muted/30 p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                    Rendering diagram...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">
                            Failed to render diagram
                        </p>
                        <p className="mt-1 text-xs text-destructive/80">{error}</p>
                        <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-destructive/80">
                                Show diagram code
                            </summary>
                            <pre className="mt-2 overflow-auto rounded bg-muted/50 p-2 text-xs">
                                {content}
                            </pre>
                        </details>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`mermaid-container overflow-auto rounded border bg-white p-4 dark:bg-slate-900 ${className || ''}`}
        />
    );
};

// Export a fallback component for when mermaid is not available
export const MermaidFallback: React.FC<{ content: string }> = ({ content }) => {
    return (
        <div className="rounded border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                    Mermaid Diagram
                </p>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
                Install mermaid to render this diagram:
            </p>
            <code className="text-xs">npm install mermaid</code>
            <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                    Show diagram code
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted/50 p-2 text-xs">
                    {content}
                </pre>
            </details>
        </div>
    );
};

