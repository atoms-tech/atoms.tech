import { Copy, Save, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FoldingCard } from '@/components/ui/folding-card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface EarsCardProps {
    earsPattern?: string;
    earsRequirement?: string;
    earsTemplate?: string;
    onAccept: (text: string, autosave: boolean) => void;
}

export function EarsCard({
    earsPattern,
    earsRequirement,
    earsTemplate,
    onAccept,
}: EarsCardProps) {
    const hasData = Boolean(earsPattern || earsRequirement || earsTemplate);

    return (
        <FoldingCard
            icon={<Target />}
            title="EARS"
            disabled={!hasData}
            defaultOpen={false}
        >
            <div className="text-muted-foreground text-sm">
                <p>
                    <strong>Pattern:</strong> {earsPattern}
                </p>
                <div className="flex justify-between items-center mt-2">
                    <p>
                        <strong>EARS Format:</strong> {earsRequirement}
                    </p>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        earsRequirement && onAccept(earsRequirement, true)
                                    }
                                    disabled={!earsRequirement}
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
                                        earsRequirement &&
                                        onAccept(earsRequirement, false)
                                    }
                                    disabled={!earsRequirement}
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
                <p>
                    <strong>Template:</strong> {earsTemplate}
                </p>
            </div>
        </FoldingCard>
    );
}
