'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    generateNextReqId,
    isValidReqIdFormat,
    reqIdExists,
} from '@/lib/utils/reqIdGenerator';

export default function AutoReqIdDemoPage() {
    const [documentId, setDocumentId] = useState('demo-document-123');
    const [generatedReqId, setGeneratedReqId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [validationResult, setValidationResult] = useState<string>('');
    const [existsResult, setExistsResult] = useState<string>('');

    const handleGenerateReqId = async () => {
        setIsLoading(true);
        try {
            const reqId = await generateNextReqId(documentId);
            setGeneratedReqId(reqId);

            // Test validation
            const isValid = isValidReqIdFormat(reqId);
            setValidationResult(
                isValid ? '✅ Valid format' : '❌ Invalid format',
            );

            // Test existence check
            const exists = await reqIdExists(documentId, reqId);
            setExistsResult(exists ? '⚠️ Already exists' : '✅ Unique');
        } catch (error) {
            console.error('Error generating REQ-ID:', error);
            setGeneratedReqId('Error generating REQ-ID');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">
                    Auto REQ-ID Generation Demo
                </h1>
                <p className="text-muted-foreground">
                    Test the automatic REQ-ID generation functionality
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>🎯 REQ-ID Generator Test</CardTitle>
                    <CardDescription>
                        Generate unique REQ-IDs for requirements automatically
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">
                            Document ID:
                        </label>
                        <input
                            type="text"
                            value={documentId}
                            onChange={(e) => setDocumentId(e.target.value)}
                            className="w-full mt-1 p-2 border rounded"
                            placeholder="Enter document ID"
                        />
                    </div>

                    <Button
                        onClick={handleGenerateReqId}
                        disabled={isLoading || !documentId}
                        className="w-full"
                    >
                        {isLoading ? 'Generating...' : 'Generate Next REQ-ID'}
                    </Button>

                    {generatedReqId && (
                        <div className="space-y-2 p-4 bg-muted rounded">
                            <div className="text-lg font-mono font-bold text-center">
                                Generated REQ-ID:{' '}
                                <span className="text-primary">
                                    {generatedReqId}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>
                                    Format Validation: {validationResult}
                                </span>
                                <span>Uniqueness Check: {existsResult}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>📋 How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 border rounded">
                            <h3 className="font-semibold text-sm">
                                1. Query Existing
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Fetch all existing REQ-IDs in the document
                            </p>
                        </div>
                        <div className="p-3 border rounded">
                            <h3 className="font-semibold text-sm">
                                2. Find Next Number
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Calculate the next sequential number
                            </p>
                        </div>
                        <div className="p-3 border rounded">
                            <h3 className="font-semibold text-sm">
                                3. Format & Return
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Format as REQ-XXX with zero padding
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>✅ Implementation Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-green-500">✅</span>
                            <span>REQ-ID generation utility created</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-500">✅</span>
                            <span>
                                Integration with useRequirementMutations
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-500">✅</span>
                            <span>Uniqueness validation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-500">✅</span>
                            <span>Format validation (REQ-XXX)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-500">✅</span>
                            <span>Error handling and fallbacks</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
