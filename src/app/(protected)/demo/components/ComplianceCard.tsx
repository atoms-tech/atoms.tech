import { Scale } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { FoldingCard } from '@/components/ui/folding-card';

interface ComplianceCardProps {
    complianceFeedback?: string;
    relevantRegulations?: string;
}

export function ComplianceCard({
    complianceFeedback,
    relevantRegulations,
}: ComplianceCardProps) {
    const hasData = Boolean(complianceFeedback || relevantRegulations);

    return (
        <FoldingCard
            icon={<Scale />}
            title="Compliance"
            disabled={!hasData}
            defaultOpen={false}
        >
            <div className="text-muted-foreground text-sm">
                <ReactMarkdown>{complianceFeedback}</ReactMarkdown>
                {relevantRegulations && (
                    <div className="mt-2">
                        <p>
                            <strong>Relevant Regulations:</strong>
                        </p>
                        <ReactMarkdown>{relevantRegulations}</ReactMarkdown>
                    </div>
                )}
            </div>
        </FoldingCard>
    );
}
