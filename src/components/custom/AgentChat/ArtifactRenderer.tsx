'use client';

import React, { useState } from 'react';
import { Copy, Download, Code, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MermaidPreview } from './MermaidPreview';

export interface Artifact {
    id: string;
    type: 'react' | 'html' | 'mermaid' | 'svg' | 'code' | 'text';
    title: string;
    language?: string;
    content: string;
    renderMode?: 'preview' | 'diagram' | 'svg' | 'code';
    editable?: boolean;
    framework?: string;
}

interface ArtifactRendererProps {
    artifact: Artifact;
    className?: string;
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({
    artifact,
    className,
}) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(artifact.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([artifact.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${artifact.id}.${getFileExtension(artifact)}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getFileExtension = (artifact: Artifact): string => {
        switch (artifact.type) {
            case 'react':
                return artifact.language === 'tsx' ? 'tsx' : 'jsx';
            case 'html':
                return 'html';
            case 'mermaid':
                return 'mmd';
            case 'svg':
                return 'svg';
            default:
                return artifact.language || 'txt';
        }
    };

    return (
        <Card className={cn('overflow-hidden', className)}>
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                        <Code className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium">{artifact.title}</h4>
                        <p className="text-xs text-muted-foreground">
                            {artifact.type} {artifact.language && `• ${artifact.language}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 px-2"
                    >
                        <Copy className="h-3.5 w-3.5" />
                        {copied && <span className="ml-1 text-xs">Copied!</span>}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        className="h-7 px-2"
                    >
                        <Download className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code')}>
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                    {artifact.renderMode !== 'code' && (
                        <TabsTrigger value="preview" className="rounded-none">
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Preview
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="code" className="rounded-none">
                        <Code className="mr-1.5 h-3.5 w-3.5" />
                        Code
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="m-0 p-4">
                    <ArtifactPreview artifact={artifact} />
                </TabsContent>

                <TabsContent value="code" className="m-0 p-0">
                    <pre className="overflow-auto p-4 text-xs">
                        <code>{artifact.content}</code>
                    </pre>
                </TabsContent>
            </Tabs>
        </Card>
    );
};

interface ArtifactPreviewProps {
    artifact: Artifact;
}

const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ artifact }) => {
    switch (artifact.type) {
        case 'html':
            return <HTMLPreview content={artifact.content} />;
        case 'svg':
            return <SVGPreview content={artifact.content} />;
        case 'mermaid':
            // Use MermaidPreview
            return <MermaidPreview content={artifact.content} />;
        case 'react':
            return <ReactPreview content={artifact.content} />;
        default:
            return (
                <pre className="overflow-auto text-xs">
                    <code>{artifact.content}</code>
                </pre>
            );
    }
};

const HTMLPreview: React.FC<{ content: string }> = ({ content }) => (
    <iframe
        srcDoc={content}
        className="h-96 w-full rounded border"
        sandbox="allow-scripts"
        title="HTML Preview"
    />
);

const SVGPreview: React.FC<{ content: string }> = ({ content }) => (
    <div
        className="flex items-center justify-center rounded border bg-white p-4"
        dangerouslySetInnerHTML={{ __html: content }}
    />
);

// MermaidPreview is now imported from MermaidPreview.tsx

const ReactPreview: React.FC<{ content: string }> = ({ content }) => {
    // TODO: Integrate React sandbox
    return (
        <div className="rounded border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
                React component preview coming soon...
            </p>
            <pre className="mt-2 text-xs">{content}</pre>
        </div>
    );
};

