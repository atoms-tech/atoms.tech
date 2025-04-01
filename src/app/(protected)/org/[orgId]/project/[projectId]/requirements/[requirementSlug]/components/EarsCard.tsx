import { Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FoldingCard } from '@/components/ui/folding-card';

interface EarsCardProps {
    earsPattern?: string;
    earsRequirement?: string;
    earsTemplate?: string;
    onAccept: (text: string) => void;
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
                        <strong>Requirement:</strong> {earsRequirement}
                    </p>
                    <Button
                        size="sm"
                        onClick={() =>
                            earsRequirement && onAccept(earsRequirement)
                        }
                        disabled={!earsRequirement}
                    >
                        Accept Pattern
                    </Button>
                </div>
                <p>
                    <strong>Template:</strong> {earsTemplate}
                </p>
            </div>
        </FoldingCard>
    );
}
