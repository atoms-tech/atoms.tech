'use client';

// Context for managing live region announcements
import { createContext, useContext, useEffect, useRef, useState } from 'react';

interface LiveRegionProps {
    message?: string;
    politeness?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
    relevant?: 'additions' | 'removals' | 'text' | 'all';
    className?: string;
}

export function LiveRegion({
    message,
    politeness = 'polite',
    atomic = false,
    relevant = 'additions',
    className = 'sr-only',
}: LiveRegionProps) {
    const [displayMessage, setDisplayMessage] = useState('');
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (message) {
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set the message
            setDisplayMessage(message);

            // Clear the message after a delay to allow re-announcing
            timeoutRef.current = setTimeout(() => {
                setDisplayMessage('');
            }, 1000) as NodeJS.Timeout;
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [message]);

    return (
        <div
            role="status"
            aria-live={politeness}
            aria-atomic={atomic}
            aria-relevant={relevant}
            className={className}
        >
            {displayMessage}
        </div>
    );
}

interface LiveRegionContextType {
    announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}

const LiveRegionContext = createContext<LiveRegionContextType | undefined>(undefined);

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
    const [politeMessage, setPoliteMessage] = useState('');
    const [assertiveMessage, setAssertiveMessage] = useState('');

    const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
        if (politeness === 'assertive') {
            setAssertiveMessage(message);
        } else {
            setPoliteMessage(message);
        }
    };

    return (
        <LiveRegionContext.Provider value={{ announce }}>
            {children}
            <LiveRegion message={politeMessage} politeness="polite" />
            <LiveRegion message={assertiveMessage} politeness="assertive" />
        </LiveRegionContext.Provider>
    );
}

export function useLiveRegion() {
    const context = useContext(LiveRegionContext);
    if (!context) {
        throw new Error('useLiveRegion must be used within a LiveRegionProvider');
    }
    return context;
}
