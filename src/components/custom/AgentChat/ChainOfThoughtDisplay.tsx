'use client';

import { ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export interface ChainOfThoughtStep {
    id: string;
    step: number;
    thought: string;
    timestamp: number;
    type?: 'analysis' | 'planning' | 'execution' | 'reflection';
}

export interface ChainOfThoughtDisplayProps {
    steps: ChainOfThoughtStep[];
    className?: string;
    maxHeight?: string;
}

const getStepColor = (type?: string) => {
    switch (type) {
        case 'analysis':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'planning':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'execution':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'reflection':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getStepIcon = (_type?: string) => {
    return <Lightbulb className="h-4 w-4" />;
};

export const ChainOfThoughtDisplay: React.FC<ChainOfThoughtDisplayProps> = ({
    steps,
    className = '',
    maxHeight = '400px',
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

    const toggleStep = (stepId: string) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(stepId)) {
            newExpanded.delete(stepId);
        } else {
            newExpanded.add(stepId);
        }
        setExpandedSteps(newExpanded);
    };

    if (!steps || steps.length === 0) {
        return null;
    }

    return (
        <Card className={`${className} border-l-4 border-l-blue-500`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-sm font-medium">
                            Chain of Thought
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {steps.length} steps
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-6 w-6 p-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0">
                    <ScrollArea style={{ maxHeight }} className="pr-4">
                        <div className="space-y-3">
                            {steps.map((step, index) => {
                                const isStepExpanded = expandedSteps.has(step.id);
                                const shouldTruncate = step.thought.length > 150;

                                return (
                                    <div key={step.id} className="space-y-2">
                                        <div
                                            className={`rounded-lg border p-3 transition-colors hover:bg-gray-50 ${getStepColor(step.type)}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {getStepIcon(step.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-semibold">
                                                            Step {step.step}
                                                        </span>
                                                        {step.type && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs capitalize"
                                                            >
                                                                {step.type}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {shouldTruncate && !isStepExpanded
                                                            ? step.thought.substring(0, 150) +
                                                              '...'
                                                            : step.thought}
                                                    </p>
                                                    {shouldTruncate && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            onClick={() => toggleStep(step.id)}
                                                            className="h-auto p-0 text-xs mt-1"
                                                        >
                                                            {isStepExpanded
                                                                ? 'Show less'
                                                                : 'Show more'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <Separator className="my-2" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            )}
        </Card>
    );
};
