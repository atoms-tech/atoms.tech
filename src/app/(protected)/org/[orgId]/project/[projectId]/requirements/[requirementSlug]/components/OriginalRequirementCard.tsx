import { Brain } from 'lucide-react';

import { Card } from '@/components/ui/card';

interface OriginalRequirementCardProps {
    reqId?: string;
    originalRequirement?: string;
}

export function OriginalRequirementCard({
    reqId,
    originalRequirement,
}: OriginalRequirementCardProps) {
    return (
        <Card className="p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.75)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
            <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                    <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold mb-1">Original Requirement</h3>
                    {originalRequirement ? (
                        <div className="text-muted-foreground text-sm">
                            <p>
                                <strong>ID:</strong> {reqId}
                            </p>
                            <p>{originalRequirement}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Upload files and analyze the requirement to get AI
                            feedback
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}
