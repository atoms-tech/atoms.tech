'use client';

import React from 'react';

import TableLibraryTester from '@/components/custom/BlockCanvas/components/TableLibraryTester';

// Simple mock user provider for testing
const MockUserProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return <>{children}</>;
};

export default function TableTestingPage() {
    return (
        <MockUserProvider>
            <div className="min-h-screen bg-background">
                <TableLibraryTester />
            </div>
        </MockUserProvider>
    );
}
