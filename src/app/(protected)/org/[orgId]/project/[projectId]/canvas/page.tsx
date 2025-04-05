'use client';

import { CircleAlert } from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { useGumloop } from '@/hooks/useGumloop';

const ExcalidrawWithClientOnly = dynamic(
    async () =>
        (await import('@/components/custom/LandingPage/excalidrawWrapper'))
            .default,
    {
        ssr: false,
    },
);

export default function Draw() {
    // const organizationId = '9badbbf0-441c-49f6-91e7-3d9afa1c13e6';
    const organizationId = usePathname().split('/')[2];
    const [prompt, setPrompt] = useState('');
    const [excalidrawApi, setExcalidrawApi] = useState<{
        addMermaidDiagram: (mermaidSyntax: string) => Promise<void>;
    } | null>(null);

    // Gumloop state management
    const { startPipeline, getPipelineRun } = useGumloop();
    const [pipelineRunId, setPipelineRunId] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string>('');

    // Get pipeline run data
    const { data: pipelineResponse } = getPipelineRun(
        pipelineRunId,
        organizationId,
    );

    const handleGenerate = async () => {
        if (!excalidrawApi) {
            console.error('Excalidraw API not initialized');
            return;
        }

        if (!prompt.trim()) {
            setError('Please enter a description for your diagram');
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const { run_id } = await startPipeline({
                pipelineType: 'text-to-mermaid',
                customPipelineInputs: [
                    {
                        input_name: 'Requirements(s)',
                        value: prompt.trim(),
                    },
                ],
            });
            setPipelineRunId(run_id);
        } catch (error) {
            console.error('Failed to start pipeline:', error);
            setError('Failed to start diagram generation');
            setIsGenerating(false);
        }
    };

    // Handle the pipeline response
    useEffect(() => {
        switch (pipelineResponse?.state) {
            case 'DONE': {
                console.log('Pipeline response:', pipelineResponse);

                // Parse the JSON string from outputs.output
                let parsedOutput;
                try {
                    const output = pipelineResponse.outputs?.output;
                    if (!output || typeof output !== 'string') {
                        throw new Error('Invalid output format');
                    }
                    parsedOutput = JSON.parse(output);
                    const mermaidSyntax = parsedOutput?.mermaid_syntax;

                    if (!mermaidSyntax) {
                        console.error('No mermaid syntax found in response');
                        console.log('parsedOutput: ', parsedOutput);
                        setError(
                            'Failed to generate diagram: No mermaid syntax in response',
                        );
                        break;
                    }

                    if (excalidrawApi) {
                        const syntax = Array.isArray(mermaidSyntax)
                            ? mermaidSyntax[0]
                            : mermaidSyntax;
                        excalidrawApi.addMermaidDiagram(syntax).catch((err) => {
                            console.error(
                                'Error rendering mermaid diagram:',
                                err,
                            );
                            setError('Failed to render diagram');
                        });
                    }
                } catch (err) {
                    console.error('Error parsing pipeline output:', err);
                    setError('Failed to parse diagram data');
                    break;
                }
                break;
            }
            case 'FAILED': {
                console.log('Pipeline response:', pipelineResponse);
                console.error('Pipeline failed');
                setError('Failed to generate diagram');
                break;
            }
            default:
                return;
        }
        setPipelineRunId('');
        setIsGenerating(false);
    }, [pipelineResponse, excalidrawApi]);

    const handleExcalidrawMount = useCallback(
        (api: {
            addMermaidDiagram: (mermaidSyntax: string) => Promise<void>;
        }) => {
            setExcalidrawApi(api);
        },
        [],
    );

    return (
        <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
            <div style={{ flexShrink: 0 }}>
                <ExcalidrawWithClientOnly onMounted={handleExcalidrawMount} />
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '20px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    height: 'fit-content',
                }}
            >
                <h3 style={{ margin: '0 0 10px 0' }}>Text to Diagram</h3>
                <textarea
                    value={prompt}
                    onChange={(e) => {
                        setPrompt(e.target.value);
                        if (error) setError('');
                    }}
                    placeholder="Describe your diagram here..."
                    style={{
                        width: '300px',
                        height: '150px',
                        padding: '10px',
                        borderRadius: '0px',
                        border: '1px solid #ddd',
                        resize: 'vertical',
                    }}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#993CF6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0px',
                        cursor: isGenerating ? 'default' : 'pointer',
                        opacity: isGenerating ? 0.7 : 1,
                        fontWeight: 'bold',
                    }}
                >
                    {isGenerating ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            <div
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid #ffffff',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                }}
                            />
                            Generating...
                        </div>
                    ) : (
                        'Generate'
                    )}
                </button>
                {error && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#dc2626',
                            backgroundColor: '#fee2e2',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                    >
                        <CircleAlert
                            style={{ width: '16px', height: '16px' }}
                        />
                        {error}
                    </div>
                )}
                {pipelineResponse?.state === 'DONE' && (
                    <div
                        style={{
                            color: '#059669',
                            backgroundColor: '#d1fae5',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                    >
                        Diagram generated successfully!
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
