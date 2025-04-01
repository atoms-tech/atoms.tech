import { Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { FoldingCard } from '@/components/ui/folding-card';

interface IncoseCardProps {
    incoseFormat?: string;
    incoseFeedback?: string;
    onAccept: (text: string) => void;
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
                            <strong>Format:</strong>
                        </p>
                        <ReactMarkdown>{incoseFormat}</ReactMarkdown>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => incoseFormat && onAccept(incoseFormat)}
                        disabled={!incoseFormat}
                    >
                        Accept Format
                    </Button>
                </div>
                <p className="mt-2">
                    <strong>Feedback:</strong>
                </p>
                <ReactMarkdown>{incoseFeedback}</ReactMarkdown>
            </div>
        </FoldingCard>
    );
}
