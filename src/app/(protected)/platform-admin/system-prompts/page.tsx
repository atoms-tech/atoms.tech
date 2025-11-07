'use client';

import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import LayoutView from '@/components/views/LayoutView';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { SystemPromptManager } from '@/components/custom/SystemPrompts';

export default function SystemPromptsPage() {
    const { isPlatformAdmin, isLoading: adminLoading } = usePlatformAdmin();

    // Redirect if not platform admin (after all hooks are called)
    if (!adminLoading && !isPlatformAdmin) {
        return (
            <LayoutView>
                <div className="container mx-auto p-6">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                            <p className="text-muted-foreground text-center">
                                You need platform admin privileges to access this page.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </LayoutView>
        );
    }

    if (adminLoading) {
        return (
            <LayoutView>
                <div className="container mx-auto p-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        <span className="ml-2">Loading...</span>
                    </div>
                </div>
            </LayoutView>
        );
    }

    return (
        <LayoutView>
            <div className="container mx-auto p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">System Prompts</h1>
                    <p className="text-muted-foreground">
                        Manage system-wide prompts available to all users. System prompts can be used across the platform.
                    </p>
                </div>

                {/* Use the same SystemPromptManager component from agent settings */}
                <SystemPromptManager 
                    currentOrganizationId={undefined}
                    onPromptSelected={(promptId) => {
                        console.log('Selected prompt:', promptId);
                    }}
                />
            </div>
        </LayoutView>
    );
}

