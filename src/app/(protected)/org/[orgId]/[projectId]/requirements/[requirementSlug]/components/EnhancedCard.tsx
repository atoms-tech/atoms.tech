import { Wand } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { FoldingCard } from '@/components/ui/folding-card';

interface EnhancedCardProps {
    enhancedReqEars?: string;
    enhancedReqIncose?: string;
    enhancedGeneralFeedback?: string;
    onAccept: (text: string) => void;
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
                    <Button
                        size="sm"
                        onClick={() =>
                            enhancedReqEars && onAccept(enhancedReqEars)
                        }
                        disabled={!enhancedReqEars}
                    >
                        Accept EARS
                    </Button>
                </div>

                <div className="flex justify-between items-start mt-2">
                    <div>
                        <p>
                            <strong>Enhanced INCOSE:</strong>
                        </p>
                        <ReactMarkdown>{enhancedReqIncose}</ReactMarkdown>
                    </div>
                    <Button
                        size="sm"
                        onClick={() =>
                            enhancedReqIncose && onAccept(enhancedReqIncose)
                        }
                        disabled={!enhancedReqIncose}
                    >
                        Accept INCOSE
                    </Button>
                </div>

                <p className="mt-2">
                    <strong>General Feedback:</strong>
                </p>
                <ReactMarkdown>{enhancedGeneralFeedback}</ReactMarkdown>
            </div>
        </FoldingCard>
    );
}
