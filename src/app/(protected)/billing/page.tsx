'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LayoutView from '@/components/views/LayoutView';

export default function BillingPage() {
    return (
        <LayoutView>
            <div className="container mx-auto p-6 space-y-6">
                {/* Billing Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{'Billing'}</h1>
                        <p className="text-muted-foreground mt-1">{'Manage Billing'}</p>
                    </div>
                </div>
                <Card>
                    <CardHeader className="flex flex-col gap-4 pb-2"></CardHeader>
                    <CardContent>
                        <div className="text-center py-6">
                            <p>Billing is currently being worked on. Come back later!</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </LayoutView>
    );
}
