import { Copy, Save, Wand } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { FoldingCard } from '@/components/ui/folding-card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnhancedCardProps {
    enhancedReqEars?: string;
    enhancedReqIncose?: string;
    enhancedGeneralFeedback?: string;
    onAccept: (text: string, autosave: boolean) => void;
}

export function EnhancedCard({
    enhancedReqEars,
    enhancedReqIncose,
    enhancedGeneralFeedback,
    onAccept,
}: EnhancedCardProps) {
    const hasData = Boolean(
        enhancedReqEars || enhancedReqIncose || enhancedGeneralFeedback,
    );

    return (
        <FoldingCard
            icon={<Wand />}
            title="Enhanced"
            disabled={!hasData}
            defaultOpen={false}
        >
            <div className="text-muted-foreground text-sm">
                <div className="flex justify-between items-start mt-2">
                    <div>
                        <p>
                            <strong>Enhanced EARS:</strong>
                        </p>
                        <ReactMarkdown>{enhancedReqEars}</ReactMarkdown>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        enhancedReqEars && onAccept(enhancedReqEars, true)
                                    }
                                    disabled={!enhancedReqEars}
                                >
                                    <Save className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Accept</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        enhancedReqEars &&
                                        onAccept(enhancedReqEars, false)
                                    }
                                    disabled={!enhancedReqEars}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy to clipboard</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="flex justify-between items-start mt-2">
                    <div>
                        <p>
                            <strong>Enhanced INCOSE:</strong>
                        </p>
                        <ReactMarkdown>{enhancedReqIncose}</ReactMarkdown>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        enhancedReqIncose &&
                                        onAccept(enhancedReqIncose, true)
                                    }
                                    disabled={!enhancedReqIncose}
                                >
                                    <Save className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Accept</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        enhancedReqIncose &&
                                        onAccept(enhancedReqIncose, false)
                                    }
                                    disabled={!enhancedReqIncose}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy to clipboard</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <p className="mt-2">
                    <strong>General Feedback:</strong>
                </p>
                <ReactMarkdown>{enhancedGeneralFeedback}</ReactMarkdown>
            </div>
        </FoldingCard>
    );
}
