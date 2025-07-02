'use client';

import { motion } from 'framer-motion';
// import { Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ModularDashboard } from '@/components/custom/Dashboard/ModularDashboard';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/queries/useProfile';
import {
    OnboardingProgress,
    PaginatedRecentActivity,
    ProjectWithOrg,
    RecentActivity,
} from '@/lib/db/server/home.server';
import { useUser } from '@/lib/providers/user.provider';
import { Organization } from '@/types/base/organizations.types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';

import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ServiceWorkerProvider } from './ServiceWorkerProvider';

interface HomePageProps {
    initialProjects: ProjectWithOrg[];
    initialRecentActivity: RecentActivity[];
    initialRecentActivityData: PaginatedRecentActivity;
    initialOnboardingProgress: OnboardingProgress;
    organizations: Organization[];
    userId: string;
}

const _containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const _itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function HomePage({
    initialProjects,
    initialRecentActivity,
    initialRecentActivityData: _initialRecentActivityData,
    initialOnboardingProgress,
    organizations,
    userId,
}: HomePageProps) {
    const router = useRouter();
    const { user } = useUser();
    const { data: profile } = useProfile(userId);
    const [greeting, setGreeting] = useState('Hello');

    // Fetch data on client-side to prevent server timeouts
    const { data: projects = initialProjects } = useQuery({
        queryKey: ['home', 'projects', userId],
        queryFn: async () => {
            // Simplified client-side fetch
            const { data, error } = await supabase
                .from('project_members')
                .select(`
                    project_id,
                    last_accessed_at,
                    projects:projects(
                        id,
                        name,
                        description,
                        created_at,
                        organizations:organizations(id, name)
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'active')
                .order('last_accessed_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data?.map(item => ({
                ...item.projects,
                organization: item.projects.organizations,
                last_accessed: item.last_accessed_at,
                member_count: 1 // Simplified for performance
            })) || [];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const { data: onboardingProgress = initialOnboardingProgress } = useQuery({
        queryKey: ['home', 'onboarding', userId],
        queryFn: async () => {
            // Simplified onboarding check
            const { count: projectCount } = await supabase
                .from('project_members')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .eq('status', 'active');

            return {
                is_new_user: (projectCount || 0) === 0,
                project_count: projectCount || 0,
                requirement_count: 0,
                document_count: 0,
                has_invited_members: false,
                has_used_ai_analysis: false,
                completion_percentage: (projectCount || 0) > 0 ? 20 : 0,
            };
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    const { data: recentActivityData = { activities: initialRecentActivity, hasMore: false, nextCursor: null } } = useQuery({
        queryKey: ['home', 'recent-activity', userId],
        queryFn: async () => {
            // Simplified activity fetch
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('actor_id', userId)
                .order('created_at', { ascending: false })
                .limit(8);

            if (error) throw error;
            return {
                activities: data || [],
                hasMore: (data?.length || 0) >= 8,
                nextCursor: data?.[data.length - 1]?.created_at || null
            };
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    // Set greeting based on time of day
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    const handleCreateProject = () => {
        // Navigate to organization selection or create project flow
        if (organizations.length === 1) {
            router.push(`/org/${organizations[0].id}`);
        } else {
            router.push('/home/user'); // Fallback to org selection
        }
    };

    const userName =
        profile?.full_name || user?.email?.split('@')[0] || 'there';
    const hasProjects = initialProjects.length > 0;

    return (
        <ServiceWorkerProvider>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center"
                >
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {greeting}, {userName}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {hasProjects
                                ? `You have access to ${initialProjects.length} project${initialProjects.length !== 1 ? 's' : ''} across ${organizations.length} organization${organizations.length !== 1 ? 's' : ''}.`
                                : 'Welcome to your workspace. Get started by creating your first project.'}
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 md:mt-0"
                    >
                        <Button
                            size="lg"
                            onClick={handleCreateProject}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Create New Project
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Modular Dashboard */}
                <ModularDashboard
                    data={{
                        organizations,
                        projects: projects || [],
                        activities: recentActivityData?.activities || [],
                        userId,
                        user,
                        onboardingProgress: onboardingProgress,
                    }}
                />

                {/* Performance Monitor (development only) */}
                <PerformanceMonitor />

                {/* Keyboard Shortcuts Help */}
                <KeyboardShortcutsHelp />
            </div>
        </ServiceWorkerProvider>
    );
}
