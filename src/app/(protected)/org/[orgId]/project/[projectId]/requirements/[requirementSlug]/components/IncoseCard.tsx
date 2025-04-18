import { Check, Copy, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { FoldingCard } from '@/components/ui/folding-card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface IncoseCardProps {
    incoseFormat?: string;
    incoseFeedback?: string;
    onAccept: (text: string, autosave: boolean) => void;
}

export function IncoseCard({
    incoseFormat,
    incoseFeedback,
    onAccept,
}: IncoseCardProps) {
    const hasData = Boolean(incoseFormat || incoseFeedback);

    return (
        <FoldingCard
            icon={<Check />}
            title="INCOSE"
            disabled={!hasData}
            defaultOpen={false}
        >
            <div className="text-muted-foreground text-sm">
                <div className="flex justify-between items-start mt-2">
                    <div>
                        <p>
                            <strong>INCOSE Format:</strong>
                        </p>
                        <ReactMarkdown>{incoseFormat}</ReactMarkdown>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        incoseFormat &&
                                        onAccept(incoseFormat, true)
                                    }
                                    disabled={!incoseFormat}
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
                                        incoseFormat &&
                                        onAccept(incoseFormat, false)
                                    }
                                    disabled={!incoseFormat}
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
                    <strong>Feedback:</strong>
                </p>
                <ReactMarkdown>{incoseFeedback}</ReactMarkdown>
            </div>
        </FoldingCard>
    );
}
