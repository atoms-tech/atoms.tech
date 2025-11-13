'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

export default function Toaster() {
    const { toasts, dismiss } = useToast();
    const [visibleToasts, setVisibleToasts] = useState<typeof toasts>([]);

    // Trigger fade-out by moving toasts to a "fading" state
    useEffect(() => {
        setVisibleToasts(toasts);
    }, [toasts]);

    if (!visibleToasts || visibleToasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[10000] flex flex-col gap-2 w-[360px] max-w-[90vw]">
            {visibleToasts.map((t) => (
                <Alert
                    key={t.id}
                    variant={t.variant}
                    className="shadow-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    role="status"
                    aria-live={t.variant === 'destructive' ? 'assertive' : 'polite'}
                >
                    <div className="flex items-start gap-3 pr-6">
                        <div className="flex-1">
                            {t.title ? (
                                <AlertTitle className="text-sm font-semibold">
                                    {t.title}
                                </AlertTitle>
                            ) : null}
                            {t.description ? (
                                <AlertDescription className="mt-1 text-sm">
                                    {t.description}
                                </AlertDescription>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            aria-label="Close notification"
                            className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted/60"
                            onClick={() => dismiss(t.id)}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </Alert>
            ))}
        </div>
    );
}
