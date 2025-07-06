'use client';

import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { RecentActivityTab } from '@/components/home/RecentActivityTab';
import { SettingsTab } from '@/components/home/SettingsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LayoutView from '@/components/views/LayoutView';

export default function HomePage() {
    const searchParams = useSearchParams();
    const currentTabFromUrl = searchParams.get('tab') || 'activity';
    const [activeTab, setActiveTab] = useState(currentTabFromUrl);

    // Sync tab state with URL params when they change
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams, activeTab]);

    return (
        <LayoutView>
            <div className="container mx-auto p-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                >
                    <Tabs
                        defaultValue={currentTabFromUrl}
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-2 max-w-md">
                            <TabsTrigger value="activity">
                                Recent Activity
                            </TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="activity" className="mt-6">
                            <RecentActivityTab />
                        </TabsContent>

                        <TabsContent value="settings" className="mt-6">
                            <SettingsTab />
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </div>
        </LayoutView>
    );
}
