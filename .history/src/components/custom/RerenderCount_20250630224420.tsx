'use client';

// Mark as client component
import { useEffect, useRef, useState } from 'react';

export default function RenderCounter() {
    const [mounted, setMounted] = useState(false);
    const renderCount = useRef(0);

    // Only increment counter after component mounts on client
    useEffect(() => {
        setMounted(true);
        renderCount.current++;
        console.log(`Component rendered ${renderCount.current} times`);
    }, []);

    // Increment on subsequent re-renders (only when mounted changes)
    useEffect(() => {
        if (mounted) {
            renderCount.current++;
            console.log(`Component rendered ${renderCount.current} times`);
        }
    }, [mounted]);

    // Show placeholder during SSR
    if (!mounted) {
        return <div className="text-gray-600">Loading render count...</div>;
    }

    return (
        <div className="p-4 border rounded-lg shadow-sm">
            <span className="font-medium">Render count: </span>
            <span className="text-blue-600">{renderCount.current}</span>
        </div>
    );
}
